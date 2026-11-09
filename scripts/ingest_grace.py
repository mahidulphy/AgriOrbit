"""Ingest GRACE/GRACE-FO JPL mascon total water storage (TWS) anomalies.

Product : TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4
Source  : NASA PO.DAAC / JPL
Output  : public/cache/grace/grace_regions.json (regional series + trends)
          public/cache/grace/grace_summary.json (region index + district map)

Districts are grouped by the native JPL ``mascon_ID`` mapped on the 0.5-degree
CRI grid. The product's own attributes state that the native resolution is
3-degree equal-area mascons, so the 0.5-degree cells are not independent
measurements. The ``mascon_ID`` variable is used directly; all 0.5-degree
cells inside one mascon carry the same TWS value.

Trends:
  * the mean seasonal cycle (monthly climatology) is removed first;
  * ordinary least squares on deseasonalised TWS anomaly vs decimal year;
  * the 2017-07 .. 2018-05 GRACE / GRACE-FO gap is marked missing and never
    interpolated.

The percentage of each mascon's area inside Bangladesh is computed by
subpixel intersection with the HDX/OCHA COD-AB ADM0 polygon. If the boundary
file is unavailable, a static fallback derived from the same boundary is used.
"""
import json
import math
import os
from datetime import datetime, timezone

import numpy as np
import requests
import xarray as xr
from dotenv import dotenv_values
from PIL import Image, ImageDraw

from district_meta import load_district_points

NC_FILE = 'data/raw/grace/GRCTellus.JPL.200204_202608.GLO.RL06.3M.MSCNv04CRI.nc'
GRACE_URL = (
    'https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/'
    'TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4/'
    'GRCTellus.JPL.200204_202608.GLO.RL06.3M.MSCNv04CRI.nc'
)
ADM0_FILE = 'data/raw/boundaries/bgd_admin0.geojson'
GAP_START = '2017-07'
GAP_END = '2018-05'

# Fallback values from the ADM0 subpixel calculation (10x10 subpixels per
# 0.5-degree cell, area-weighted by cos(lat)). Used only if the boundary file
# is absent, e.g. in CI before the boundary download step.
STATIC_AREA_PCT_INSIDE_BD = {
    1213: 2.02,
    1214: 10.94,
    1320: 12.27,
    1321: 79.27,
    1430: 8.22,
    1431: 18.43,
}


def credentials():
    config = dotenv_values('.env.local')
    user = os.environ.get('EARTHDATA_USERNAME') or config.get('EARTHDATA_USERNAME')
    pwd = os.environ.get('EARTHDATA_PASSWORD') or config.get('EARTHDATA_PASSWORD')
    if not user or not pwd:
        raise SystemExit('Missing EARTHDATA_USERNAME / EARTHDATA_PASSWORD (env or .env.local)')
    return user, pwd


class EarthdataSession(requests.Session):
    def __init__(self, user, pwd):
        super().__init__()
        self._user = user
        self._pwd = pwd
        self.auth = (user, pwd)

    def rebuild_auth(self, prepared_request, response):
        url = prepared_request.url
        if 'urs.earthdata.nasa.gov' in url or 'earthdata.nasa.gov' in url:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(self._user, self._pwd)


def download_if_needed():
    os.makedirs('data/raw/grace', exist_ok=True)
    if os.path.exists(NC_FILE) and os.path.getsize(NC_FILE) > 10_000_000:
        print(f'Using cached GRACE file: {NC_FILE} ({os.path.getsize(NC_FILE)} bytes)')
        return
    user, pwd = credentials()
    session = EarthdataSession(user, pwd)
    print('Downloading GRACE JPL mascon NetCDF from PO.DAAC...')
    r = session.get(GRACE_URL, stream=True, timeout=300)
    if r.status_code != 200:
        raise SystemExit(f'GRACE download failed: HTTP {r.status_code}')
    tmp = NC_FILE + '.part'
    total = 0
    with open(tmp, 'wb') as f:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
                total += len(chunk)
    os.replace(tmp, NC_FILE)
    print(f'Downloaded {total} bytes to {NC_FILE}')


def month_key(date_iso):
    return date_iso[:7]


def decimal_year(month):
    year, mon = int(month[:4]), int(month[5:7])
    return year + (mon - 0.5) / 12.0


def fit_trend(rows, start_month, end_month):
    used = [
        row for row in rows
        if start_month <= row['month'] <= end_month and row['deseasonalized_cm'] is not None
    ]
    if len(used) < 6:
        return None
    x = np.array([decimal_year(row['month']) for row in used])
    y = np.array([row['deseasonalized_cm'] for row in used])
    slope, intercept = np.polyfit(x, y, 1)
    residuals = y - (slope * x + intercept)
    sxx = float(np.sum((x - x.mean()) ** 2))
    stderr = float(np.sqrt(np.sum(residuals ** 2) / (len(x) - 2) / sxx)) if len(x) > 2 and sxx > 0 else None
    return {
        'slope_cm_per_year': round(float(slope), 2),
        'standard_error_cm_per_year': round(stderr, 2) if stderr is not None else None,
        'months_used': len(x),
        'first_month': used[0]['month'],
        'last_month': used[-1]['month'],
        'gap_note': f'{GAP_START}..{GAP_END} is missing (GRACE ended / GRACE-FO gap); not interpolated.',
    }


def fit_raw_trend(rows, start_month, end_month, key):
    xs, ys = [], []
    for row in rows:
        if not (start_month <= row['month'] <= end_month):
            continue
        if row[key] is None:
            continue
        xs.append(decimal_year(row['month']))
        ys.append(row[key])
    if len(xs) < 6:
        return None
    slope, _ = np.polyfit(np.array(xs), np.array(ys), 1)
    return {'slope_cm_per_year': round(float(slope), 2), 'months_used': len(xs)}


def load_country_mask():
    if not os.path.exists(ADM0_FILE):
        return None
    geo = json.load(open(ADM0_FILE, encoding='utf-8'))
    feature = geo['features'][0]
    lon_w, lon_e = 87.9, 92.8
    lat_s, lat_n = 20.6, 26.8
    step = 0.005
    w = int(round((lon_e - lon_w) / step))
    h = int(round((lat_n - lat_s) / step))
    img = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(img)
    for poly in feature['geometry']['coordinates']:
        for ring in poly:
            draw.polygon([((x - lon_w) / step, (lat_n - y) / step) for x, y in ring], fill=1)
    return {
        'mask': np.array(img, dtype=bool),
        'lon_w': lon_w, 'lon_e': lon_e, 'lat_s': lat_s, 'lat_n': lat_n,
        'step': step, 'w': w, 'h': h,
    }


def cell_inside_fraction(mask_info, cell_lat, cell_lon):
    if mask_info is None:
        return None
    inside = 0
    for a in range(10):
        la = cell_lat - 0.25 + (a + 0.5) * 0.05
        for b in range(10):
            lo = cell_lon - 0.25 + (b + 0.5) * 0.05
            px = int(round((lo - mask_info['lon_w']) / mask_info['step']))
            py = int(round((mask_info['lat_n'] - la) / mask_info['step']))
            if 0 <= px < mask_info['w'] and 0 <= py < mask_info['h'] and mask_info['mask'][py, px]:
                inside += 1
    return inside / 100.0


def mascon_area_percentages(lat, lon, mascon_id, ids):
    """Area-weighted % of each mascon's total 0.5-degree area inside Bangladesh."""
    mask_info = load_country_mask()
    if mask_info is None:
        return {int(k): v for k, v in STATIC_AREA_PCT_INSIDE_BD.items()}, 'static fallback from ADM0 subpixel calculation'
    out = {}
    weights = np.cos(np.radians(lat))
    for mid in ids:
        total = 0.0
        inside = 0.0
        for i in range(len(lat)):
            for j in range(len(lon)):
                if int(mascon_id[i, j]) != mid:
                    continue
                w = float(weights[i])
                total += w
                frac = cell_inside_fraction(mask_info, float(lat[i]), float(lon[j]))
                inside += w * frac
        out[mid] = round(100.0 * inside / total, 2) if total else None
    return out, 'ADM0 subpixel intersection (10x10 subpixels per 0.5-degree cell, cos-lat area weights)'


def main():
    download_if_needed()
    ds = xr.open_dataset(NC_FILE)
    lwe = ds['lwe_thickness']
    lat_vals = ds['lat'].values
    lon_vals = ds['lon'].values
    is_360 = bool(np.max(lon_vals) > 180)
    lon_deg = np.where(lon_vals > 180, lon_vals - 360, lon_vals)
    mascon_id = ds['mascon_ID'].values.astype(int)
    land_mask = ds['land_mask'].values
    time_vals = ds['time'].values
    dates = [str(t)[:10] for t in time_vals]

    districts = load_district_points()
    groups = {}
    district_map = {}

    for d in districts:
        target_lon = d['lon'] % 360 if is_360 else d['lon']
        lat_idx = int(np.argmin(np.abs(lat_vals - d['lat'])))
        lon_idx = int(np.argmin(np.abs(lon_vals - target_lon)))
        cell_lat = round(float(lat_vals[lat_idx]), 2)
        cell_lon = round(float(lon_deg[lon_idx]), 2)
        mid = int(mascon_id[lat_idx, lon_idx])
        raw = [
            (date, None if np.isnan(v) else round(float(v), 2))
            for date, v in zip(dates, lwe[:, lat_idx, lon_idx])
        ]
        if mid not in groups:
            groups[mid] = {
                'mascon_id': mid,
                'representative_cell_lat': cell_lat,
                'representative_cell_lon': cell_lon,
                'districts': [],
                'cells': [],
                'raw': raw,
            }
        groups[mid]['districts'].append({'id': d['id'], 'name': d['name']})
        groups[mid]['cells'].append({
            'districtId': d['id'],
            'cell_lat': cell_lat,
            'cell_lon': cell_lon,
            'latest_cm': raw[-1][1],
        })
        district_map[d['id']] = {
            'districtId': d['id'],
            'districtName': d['name'],
            'regionId': f'mascon_{mid}',
            'mascon_id': mid,
            'representative_cell_lat': cell_lat,
            'representative_cell_lon': cell_lon,
        }
    ds.close()

    hq_ids = sorted(groups)
    # Include border mascons that intersect Bangladesh but contain no district HQ.
    all_ids = set(hq_ids)
    mask_info = load_country_mask()
    if mask_info is not None:
        for i in range(len(lat_vals)):
            for j in range(len(lon_vals)):
                mid = int(mascon_id[i, j])
                if mid <= 0 or mid in all_ids:
                    continue
                if not (mask_info['lat_s'] <= lat_vals[i] <= mask_info['lat_n']):
                    continue
                if not (mask_info['lon_w'] <= lon_deg[j] <= mask_info['lon_e']):
                    continue
                if cell_inside_fraction(mask_info, float(lat_vals[i]), float(lon_deg[j])) > 0:
                    all_ids.add(mid)
    areas, area_method = mascon_area_percentages(lat_vals, lon_deg, mascon_id, sorted(all_ids))
    for mid, info in groups.items():
        info['area_pct_inside_bangladesh'] = areas.get(mid)
    adjacent = [
        {'mascon_id': mid, 'area_pct_inside_bangladesh': areas.get(mid), 'districts_count': 0}
        for mid in sorted(all_ids - set(hq_ids))
    ]

    downloaded_at = datetime.fromtimestamp(os.path.getmtime(NC_FILE), tz=timezone.utc).isoformat()
    regions = {}
    for mid, group in sorted(groups.items()):
        by_month = {}
        for date, value in group['raw']:
            month = month_key(date)
            if month not in by_month:
                by_month[month] = {'date': date, 'values': []}
            if value is not None:
                by_month[month]['values'].append(value)

        first_month = min(by_month)
        last_month = max(by_month)
        rows = []
        year, mon = int(first_month[:4]), int(first_month[5:7])
        while (year, mon) <= (int(last_month[:4]), int(last_month[5:7])):
            month = f'{year:04d}-{mon:02d}'
            entry = by_month.get(month)
            value = round(float(np.mean(entry['values'])), 2) if entry and entry['values'] else None
            rows.append({
                'month': month,
                'date': entry['date'] if entry else None,
                'lwe_cm': value,
                'missing': value is None,
            })
            mon += 1
            if mon == 13:
                mon = 1
                year += 1

        climatology = {}
        for m in range(1, 13):
            vals = [r['lwe_cm'] for r in rows if r['lwe_cm'] is not None and int(r['month'][5:7]) == m]
            if vals:
                climatology[m] = float(np.mean(vals))
        for r in rows:
            m = int(r['month'][5:7])
            r['deseasonalized_cm'] = (
                round(r['lwe_cm'] - climatology[m], 2) if r['lwe_cm'] is not None and m in climatology else None
            )

        latest = next((r for r in reversed(rows) if r['lwe_cm'] is not None), None)
        missing_months = [r['month'] for r in rows if r['lwe_cm'] is None]
        gap_missing = [m for m in missing_months if GAP_START <= m <= GAP_END]

        region_id = f'mascon_{mid}'
        regions[region_id] = {
            'regionId': region_id,
            'regionName': f'JPL mascon {mid}',
            'mascon_id': mid,
            'representative_cell_lat': group['representative_cell_lat'],
            'representative_cell_lon': group['representative_cell_lon'],
            'area_pct_inside_bangladesh': group['area_pct_inside_bangladesh'],
            'area_method': area_method,
            'districts': sorted(group['districts'], key=lambda x: x['name']),
            'districts_count': len(group['districts']),
            'cells': group['cells'],
            'latest_observation': {'month': latest['month'], 'date': latest['date'], 'lwe_cm': latest['lwe_cm']} if latest else None,
            'trend_2002_2010': fit_trend(rows, '2002-01', '2010-12'),
            'trend_2016_present': fit_trend(rows, '2016-01', '9999-12'),
            'raw_trend_2002_2010': fit_raw_trend(rows, '2002-01', '2010-12', 'lwe_cm'),
            'raw_trend_2016_present': fit_raw_trend(rows, '2016-01', '9999-12', 'lwe_cm'),
            'observations_count': sum(1 for r in rows if r['lwe_cm'] is not None),
            'missing_months_count': len(missing_months),
            'gap_months_missing': len(gap_missing),
            'monthly_series': rows,
        }

    metadata = {
        'product': 'TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4',
        'granule': os.path.basename(NC_FILE),
        'source': 'NASA PO.DAAC / JPL',
        'source_url': GRACE_URL,
        'variable': (
            'lwe_thickness: terrestrial total water storage (TWS) anomaly in cm of liquid water '
            'equivalent relative to the 2004-2009 mean. TWS includes groundwater, soil moisture, '
            'surface water, snow/ice and vegetation water; it is NOT groundwater alone.'
        ),
        'effective_spatial_resolution': 'Regional (~300 km)',
        'native_resolution': '3-degree equal-area JPL mascons',
        'grid_sampling': 'Native JPL mascon_ID mapped on the 0.5-degree CRI grid; districts grouped by mascon_ID',
        'grid_sampling_note': (
            'The 0.5-degree CRI grid is a display/interpolation grid. The product attributes state the '
            'native resolution is 3-degree equal-area mascons; the uncertainty field is per mascon, '
            'not per 0.5-degree cell. All 0.5-degree cells inside one mascon carry the same TWS value.'
        ),
        'area_pct_method': area_method,
        'area_pct_note': (
            'Percentage of each mascon total 0.5-degree cell area inside the HDX/OCHA COD-AB ADM0 '
            'Bangladesh polygon. A 0.5-degree cell is counted by 10x10 subpixel intersection; areas '
            'are weighted by cos(latitude).'
        ),
        'baseline': '2004-2009 mean',
        'downloaded_at': downloaded_at,
        'processed_at': datetime.now(timezone.utc).isoformat(),
        'period_start': dates[0],
        'period_end': dates[-1],
        'districts_count': len(districts),
        'regions_count': len(regions),
        'mascon_ids_at_district_hqs': hq_ids,
        'adjacent_mascons': adjacent,
        'gap': {
            'start': GAP_START,
            'end': GAP_END,
            'status': 'missing',
            'note': 'GRACE ended in 2017 and GRACE-FO science data resume in 2018; no values are interpolated.',
        },
        'deseasonalization': (
            'Mean seasonal cycle removed before trend fitting: for each calendar month the long-term '
            'mean TWS anomaly is subtracted across all valid years.'
        ),
        'trend_method': (
            'Ordinary least squares on monthly deseasonalised TWS anomaly versus decimal year; '
            'slope in cm/year with standard error. Raw (seasonal) slopes are also stored for reference.'
        ),
        'spatial_note': (
            'Regional basin-scale total water storage change, not field-level groundwater. Neighbouring '
            'districts in the same mascon share one observation; district-level trends would be '
            'statistically false and are not reported.'
        ),
    }

    os.makedirs('public/cache/grace', exist_ok=True)
    for name in os.listdir('public/cache/grace'):
        path = os.path.join('public/cache/grace', name)
        if name.endswith('.json') and name not in ('grace_summary.json', 'grace_regions.json'):
            os.remove(path)

    with open('public/cache/grace/grace_regions.json', 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'regions': regions}, f, indent=2)

    summary = {
        region_id: {
            'regionName': region['regionName'],
            'mascon_id': region['mascon_id'],
            'representative_cell_lat': region['representative_cell_lat'],
            'representative_cell_lon': region['representative_cell_lon'],
            'area_pct_inside_bangladesh': region['area_pct_inside_bangladesh'],
            'districts_count': region['districts_count'],
            'districts': region['districts'],
            'latest_observation': region['latest_observation'],
            'trend_2002_2010': region['trend_2002_2010'],
            'trend_2016_present': region['trend_2016_present'],
            'observations_count': region['observations_count'],
            'gap_months_missing': region['gap_months_missing'],
        }
        for region_id, region in regions.items()
    }
    with open('public/cache/grace/grace_summary.json', 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'regions': summary, 'district_region_map': district_map}, f, indent=2)

    print(f'Saved {len(regions)} GRACE JPL mascon regions for {len(districts)} districts')
    for did in ['rangpur', 'rajshahi', 'sylhet']:
        m = district_map[did]
        region = regions[m['regionId']]
        t1 = region['trend_2002_2010']
        t2 = region['trend_2016_present']
        print(f"\n[{m['districtName']}] -> {region['regionName']} "
              f"({region['districts_count']} districts, {region['area_pct_inside_bangladesh']}% area inside BD)")
        print(f"  Latest: {region['latest_observation']}")
        print(f"  2002-2010 deseasonalised TWS trend: {t1['slope_cm_per_year']} +/- {t1['standard_error_cm_per_year']} cm/yr ({t1['months_used']} months)")
        print(f"  2016-present deseasonalised TWS trend: {t2['slope_cm_per_year']} +/- {t2['standard_error_cm_per_year']} cm/yr ({t2['months_used']} months)")
        print(f"  Gap months missing: {region['gap_months_missing']}")


if __name__ == '__main__':
    main()
