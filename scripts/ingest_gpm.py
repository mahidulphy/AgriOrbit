import os
import json
import requests
import numpy as np
from datetime import datetime, timedelta, timezone
from dotenv import dotenv_values

from district_meta import load_district_points

# 1. Earthdata session
config = dotenv_values('.env.local')
user = os.environ.get('EARTHDATA_USERNAME') or config.get('EARTHDATA_USERNAME')
pwd = os.environ.get('EARTHDATA_PASSWORD') or config.get('EARTHDATA_PASSWORD')

if not user or not pwd:
    raise ValueError('Missing EARTHDATA_USERNAME or EARTHDATA_PASSWORD (env or .env.local)')

class EarthdataSession(requests.Session):
    def rebuild_auth(self, prepared_request, response):
        url = prepared_request.url
        if 'urs.earthdata.nasa.gov' in url or 'earthdata.nasa.gov' in url:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(user, pwd)
        return

session = EarthdataSession()
session.auth = (user, pwd)

# 2. Setup folders
os.makedirs('public/cache/gpm', exist_ok=True)

# 3. Load 64 district coordinates (names from bdAdmin.ts, not the division column)
districts = load_district_points()

# 4. Rolling 30-day window ending 2 days ago (IMERG Late ~14-hour latency)
end_dt = (datetime.now(timezone.utc) - timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
dates = [(end_dt - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(29, -1, -1)]
print(f'GPM IMERG 30-day window: {dates[0]} to {dates[-1]} ({len(dates)} days)')

# Map coordinates to grid indices in GPM:
# lat grid: step 0.1, centered at -89.95, -89.85 ... +89.95.
# lon grid: step 0.1, centered at -179.95 ... +179.95.
# Bangladesh bounding slice: lon [2680:2727] (88.05 to 92.75), lat [1105:1167] (20.55 to 26.75)
lon_start_idx = 2680
lon_end_idx = 2727
lat_start_idx = 1105
lat_end_idx = 1167

grid_lons = [round(88.05 + 0.1 * i, 2) for i in range(lon_end_idx - lon_start_idx + 1)]
grid_lats = [round(20.55 + 0.1 * i, 2) for i in range(lat_end_idx - lat_start_idx + 1)]

# Pre-calculate nearest grid indices for each district
district_grid_pos = {}
for d in districts:
    d_lon = d['lon']
    d_lat = d['lat']
    closest_lon_idx = int(np.argmin(np.abs(np.array(grid_lons) - d_lon)))
    closest_lat_idx = int(np.argmin(np.abs(np.array(grid_lats) - d_lat)))
    district_grid_pos[d['id']] = (
        closest_lon_idx,
        closest_lat_idx,
        grid_lons[closest_lon_idx],
        grid_lats[closest_lat_idx],
    )

# Fetch each day
daily_grids = {}
failed_dates = []

print('\nFetching real GPM IMERG Late slices from GES DISC OPeNDAP...')
for d_str in dates:
    dt = datetime.strptime(d_str, '%Y-%m-%d')
    year = dt.strftime('%Y')
    month = dt.strftime('%m')
    day = dt.strftime('%d')
    ymd = dt.strftime('%Y%m%d')

    # Granule name: 3B-DAY-L.MS.MRG.3IMERG.{ymd}-S000000-E235959.V07C.nc4
    url = f'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/{year}/{month}/3B-DAY-L.MS.MRG.3IMERG.{ymd}-S000000-E235959.V07C.nc4.ascii?precipitation[0:0][{lon_start_idx}:{lon_end_idx}][{lat_start_idx}:{lat_end_idx}]'
    
    try:
        r = session.get(url, timeout=20)
        if r.status_code != 200:
            print(f'  Failed {d_str}: HTTP {r.status_code}')
            failed_dates.append(d_str)
            continue
        
        # Parse ascii slice
        # Lines with precipitation[lon=...], followed by comma-separated numbers for latitudes
        grid_matrix = []
        for line in r.text.strip().split('\n'):
            line = line.strip()
            if 'precipitation.precipitation[' in line:
                # e.g. precipitation.precipitation[precipitation.time=17107][precipitation.lon=88.05], 0, 0, ...
                parts = line.split(',')
                vals = [float(x.strip()) for x in parts[1:]]
                grid_matrix.append(vals)

        if len(grid_matrix) == len(grid_lons):
            arr = np.array(grid_matrix)
            if arr.shape != (len(grid_lons), len(grid_lats)):
                print(f'  Invalid matrix shape for {d_str}: {arr.shape}')
                failed_dates.append(d_str)
                continue
            if np.isnan(arr).any() or (arr < -1).any():
                print(f'  Invalid precipitation values for {d_str}')
                failed_dates.append(d_str)
                continue
            # Shape is (len_lons, len_lats)
            daily_grids[d_str] = arr
            print(f'  [OK] {d_str} (GPM_3IMERGDL.07)')
        else:
            print(f'  Invalid matrix shape for {d_str}: {len(grid_matrix)} rows vs expected {len(grid_lons)}')
            failed_dates.append(d_str)
    except Exception as e:
        print(f'  Error {d_str}: {e}')
        failed_dates.append(d_str)

print(f'\nFetched {len(daily_grids)} / {len(dates)} days of real GPM IMERG.')
if failed_dates or len(daily_grids) != len(dates):
    raise SystemExit(f'GPM ingest aborted: failed dates {failed_dates}. Cache not overwritten.')

# Calculate district series & summary
district_summaries = {}
for d in districts:
    d_id = d['id']
    lon_idx, lat_idx, cell_lon, cell_lat = district_grid_pos[d_id]
    
    daily_precip = []
    extreme_rain_days_50mm = 0
    total_precip_mm = 0.0

    for d_str in dates:
        if d_str in daily_grids:
            val = float(daily_grids[d_str][lon_idx, lat_idx])
            val_rounded = round(max(0.0, val), 2)
            daily_precip.append({
                'date': d_str,
                'precip_mm': val_rounded
            })
            total_precip_mm += val_rounded
            if val_rounded >= 50.0:
                extreme_rain_days_50mm += 1
        else:
            daily_precip.append({
                'date': d_str,
                'precip_mm': None
            })

    # Read NASA POWER 30-day rain for comparison from public/cache/{district}.json if present
    power_cache_path = f'public/cache/{d_id}.json'
    power_rain_30d = None
    power_window = None
    if os.path.exists(power_cache_path):
        try:
            with open(power_cache_path, 'r', encoding='utf-8') as pf:
                pdata = json.load(pf)
                prec_dict = pdata.get('daily', {}).get('PRECTOTCORR', {})
                sorted_dates = sorted(prec_dict.keys())
                last_30_dates = sorted_dates[-30:] if len(sorted_dates) >= 30 else sorted_dates
                sum_p = sum(prec_dict[k] for k in last_30_dates if prec_dict[k] is not None and prec_dict[k] > -900)
                power_rain_30d = round(sum_p, 1)
                if last_30_dates:
                    def iso(k):
                        return f'{k[:4]}-{k[4:6]}-{k[6:8]}' if len(k) == 8 and k.isdigit() else k
                    power_window = [iso(last_30_dates[0]), iso(last_30_dates[-1])]
        except Exception:
            pass

    # Aligned comparison: POWER values only for the exact GPM window dates
    power_same_total = None
    power_same_days = 0
    gpm_same_total = None
    diff_same = None
    if power_cache_path and os.path.exists(power_cache_path):
        try:
            with open(power_cache_path, 'r', encoding='utf-8') as pf:
                pdata = json.load(pf)
                prec_dict = pdata.get('daily', {}).get('PRECTOTCORR', {})
                iso_vals = {}
                for k, v in prec_dict.items():
                    key = f'{k[:4]}-{k[4:6]}-{k[6:8]}' if len(k) == 8 and k.isdigit() else k
                    iso_vals[key] = v
                same_dates = [
                    d for d in dates
                    if iso_vals.get(d) is not None and iso_vals[d] > -900
                ]
                if same_dates:
                    power_same_total = round(sum(iso_vals[d] for d in same_dates), 1)
                    power_same_days = len(same_dates)
                    gpm_same_total = round(
                        sum(p['precip_mm'] for p in daily_precip if p['date'] in set(same_dates)), 1
                    )
                    diff_same = round(gpm_same_total - power_same_total, 1)
        except Exception:
            pass

    district_summaries[d_id] = {
        'districtId': d_id,
        'districtName': d['name'],
        'latitude': d['lat'],
        'longitude': d['lon'],
        'grid_cell_lat': cell_lat,
        'grid_cell_lon': cell_lon,
        'grid_lon_index': lon_start_idx + lon_idx,
        'grid_lat_index': lat_start_idx + lat_idx,
        'grid_selection': 'Nearest 0.1-degree IMERG cell centre; no area aggregation.',
        'gpm_30d_total_mm': round(total_precip_mm, 1),
        'power_30d_total_mm': power_rain_30d,
        'power_30d_window': power_window,
        'difference_mm': round(total_precip_mm - power_rain_30d, 1) if power_rain_30d is not None else None,
        'power_same_window_total_mm': power_same_total,
        'power_same_window_days': power_same_days,
        'gpm_same_window_total_mm': gpm_same_total,
        'difference_same_window_mm': diff_same,
        'extreme_rain_days_count': extreme_rain_days_50mm,
        'extreme_rain_threshold_mm': 50.0,
        'days_count': len(daily_precip),
        'valid_days_count': len([p for p in daily_precip if p['precip_mm'] is not None]),
        'daily_series': daily_precip
    }

# Save metadata & master summary
metadata = {
    'product': 'GPM_3IMERGDL.07',
    'product_long_name': 'GPM IMERG Late Precipitation L3 1 day 0.1 degree x 0.1 degree V07',
    'version': 'V07 (GPM_3IMERGDL.07, 3B-DAY-L.MS.MRG.3IMERG.*.V07C)',
    'source': 'NASA GES DISC',
    'source_url': 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/',
    'variable': 'precipitation (daily accumulated liquid-equivalent precipitation in mm)',
    'spatial_resolution': '0.1° x 0.1° (~10 km)',
    'run_type': 'Late Run (calibrated microwave + IR multi-satellite, ~14-hour latency)',
    'final_run_note': (
        'Final Run is not available for the rolling-window dates (latest Final granule found: '
        '2025-09-30); the rolling window therefore uses the Late Run. A separate full-history '
        'backfill would use Final through 2025-09-30 and Late thereafter.'
    ),
    'sampling': 'Nearest 0.1° IMERG grid cell to each district headquarters coordinate (docs/data/district_points.csv); no area aggregation.',
    'grid_dimensions': 'precipitation(time, lon, lat)',
    'dimension_order': 'time, lon, lat',
    'dimension_order_note': (
        'OPeNDAP request is precipitation[time][lon][lat]; the parser receives one row per '
        'longitude (48 rows) and 63 latitude values per row. District selection is '
        'arr[lon_index, lat_index], not arr[lat_index, lon_index].'
    ),
    'grid_slice': {
        'lon_start_index': lon_start_idx,
        'lon_end_index': lon_end_idx,
        'lat_start_index': lat_start_idx,
        'lat_end_index': lat_end_idx,
        'lon_start_degrees': grid_lons[0],
        'lon_end_degrees': grid_lons[-1],
        'lat_start_degrees': grid_lats[0],
        'lat_end_degrees': grid_lats[-1],
    },
    'window_start': dates[0],
    'window_end': dates[-1],
    'ingested_at': datetime.now(timezone.utc).isoformat(),
    'districts_count': len(districts)
}

# 1. Summary file
with open('public/cache/gpm/gpm_last30d_summary.json', 'w', encoding='utf-8') as f:
    json.dump({
        '_metadata': metadata,
        'districts': {
            d_id: {k: v for k, v in data.items() if k != 'daily_series'}
            for d_id, data in district_summaries.items()
        }
    }, f, indent=2)

# 2. Individual district files
for d_id, data in district_summaries.items():
    with open(f'public/cache/gpm/{d_id}.json', 'w', encoding='utf-8') as f:
        json.dump({
            '_metadata': metadata,
            **data
        }, f, indent=2)

print('Saved GPM 30-day cache to public/cache/gpm/!')

# Print comparison for Rangpur, Rajshahi, Sylhet
for d_id in ['rangpur', 'rajshahi', 'sylhet']:
    item = district_summaries.get(d_id)
    if item:
        print(f"\n[{item['districtName'].upper()}] Lat: {item['latitude']}, Lon: {item['longitude']}")
        print(f"  GPM IMERG 30-day total: {item['gpm_30d_total_mm']} mm")
        print(f"  NASA POWER 30-day total: {item['power_30d_total_mm']} mm")
        print(f"  Difference: {item['difference_mm']} mm")
        print(f"  Extreme rain days (>50mm): {item['extreme_rain_days_count']}")
