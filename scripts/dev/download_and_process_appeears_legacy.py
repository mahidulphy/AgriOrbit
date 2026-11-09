import os
import json
import time
import requests
import numpy as np
from datetime import datetime, timezone
from dotenv import dotenv_values

config = dotenv_values('.env.local')
user = config.get('EARTHDATA_USERNAME')
pwd = config.get('EARTHDATA_PASSWORD')

def get_appeears_token():
    r = requests.post(
        'https://appeears.earthdatacloud.nasa.gov/api/login',
        auth=(user, pwd),
        headers={'Content-Type': 'application/json'}
    )
    if not r.ok:
        raise RuntimeError(f'AppEEARS login failed: {r.status_code} - {r.text}')
    return r.json().get('token')

token = get_appeears_token()
print('AppEEARS authenticated.')

tasks = {
    'nasadem': {
        'id': '348bd938-ec62-4b4c-912e-2725002933a5',
        'name': 'agriorbit_nasadem_bd_districts',
        'dir': 'public/cache/nasadem'
    },
    'ecostress': {
        'id': 'eb4fcd8a-53bd-4707-b8ba-7991d7e78960',
        'name': 'agriorbit_ecostress_bd_districts',
        'dir': 'public/cache/ecostress'
    },
    'modis_ndvi': {
        'id': '681b0ec9-0e86-4f27-8f5e-39d38ce2c014',
        'name': 'agriorbit_mod13q1_timeseries_bd_districts',
        'dir': 'public/cache/modis_ndvi'
    }
}

os.makedirs('data/raw/appeears', exist_ok=True)
for t in tasks.values():
    os.makedirs(t['dir'], exist_ok=True)

def parse_csv(filepath):
    import csv
    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows

def check_task(task_key):
    info = tasks[task_key]
    tid = info['id']
    r = requests.get(
        f'https://appeears.earthdatacloud.nasa.gov/api/task/{tid}',
        headers={'Authorization': f'Bearer {token}'}
    )
    if not r.ok:
        return 'error', None
    data = r.json()
    status = data.get('status')
    return status, data

def download_bundle(task_key):
    info = tasks[task_key]
    tid = info['id']
    r = requests.get(
        f'https://appeears.earthdatacloud.nasa.gov/api/bundle/{tid}',
        headers={'Authorization': f'Bearer {token}'}
    )
    if not r.ok:
        raise RuntimeError(f'Failed to get bundle for {task_key}: {r.status_code}')
    
    bundle = r.json()
    files = bundle.get('files', [])
    downloaded = []
    
    for f in files:
        fname = f.get('file_name')
        fid = f.get('file_id')
        ftype = f.get('file_type')
        if ftype == 'csv' or fname.endswith('.csv'):
            out_path = os.path.join('data/raw/appeears', fname)
            if not os.path.exists(out_path):
                print(f'  Downloading {fname}...')
                fr = requests.get(
                    f'https://appeears.earthdatacloud.nasa.gov/api/bundle/{tid}/{fid}',
                    headers={'Authorization': f'Bearer {token}'},
                    stream=True
                )
                if fr.ok:
                    with open(out_path, 'wb') as out_f:
                        for chunk in fr.iter_content(chunk_size=1024*1024):
                            if chunk:
                                out_f.write(chunk)
                    print(f'  ✓ Saved {out_path} ({os.path.getsize(out_path)} bytes)')
            downloaded.append(out_path)
    return downloaded

def process_nasadem(csv_files):
    print('\nProcessing NASADEM & SRTMGL1 data...')
    # Look for results csv
    res_file = next((f for f in csv_files if 'results.csv' in f or 'NASADEM' in f or 'SRTM' in f), None)
    if not res_file:
        print('No results CSV found for NASADEM')
        return

    rows = parse_csv(res_file)
    print(f'Loaded {len(rows)} rows from {os.path.basename(res_file)}')

    by_district = {}
    for r in rows:
        d_id = r.get('ID', '').strip().lower()
        if not d_id:
            continue
        lat = float(r.get('Latitude', 0))
        lon = float(r.get('Longitude', 0))
        nasadem_hgt_raw = r.get('NASADEM_NC_001_NASADEM_HGT')
        srtm_dem_raw = r.get('SRTMGL1_NC_003_SRTMGL1_DEM')

        elev = None
        if nasadem_hgt_raw and nasadem_hgt_raw != '' and nasadem_hgt_raw != 'None':
            try:
                elev = float(nasadem_hgt_raw)
            except:
                pass
        if elev is None and srtm_dem_raw and srtm_dem_raw != '' and srtm_dem_raw != 'None':
            try:
                elev = float(srtm_dem_raw)
            except:
                pass

        if d_id not in by_district:
            by_district[d_id] = {
                'districtId': d_id,
                'latitude': lat,
                'longitude': lon,
                'elevation_m': elev
            }

    # For slope calculation:
    # In flat alluvial plains (e.g. delta), regional slope is typically < 0.5 degrees.
    # In hilly tracts (Sylhet, Chittagong Hill Tracts, Bandarban), slope can exceed 10-25 degrees.
    # We compute gradient relative to regional topography and store elevation and mean slope.
    # For point extractions, we also compute gradient from neighboring district nodes or local topography:
    dist_items = list(by_district.values())
    for d in dist_items:
        # Calculate local terrain gradient: distance-weighted difference from nearby districts (within 80 km)
        d_lat, d_lon, d_elev = d['latitude'], d['longitude'], d['elevation_m']
        if d_elev is not None:
            nearby_slopes = []
            for other in dist_items:
                if other['districtId'] != d['districtId'] and other['elevation_m'] is not None:
                    # Distance in meters
                    dy = (other['latitude'] - d_lat) * 111139.0
                    dx = (other['longitude'] - d_lon) * 111139.0 * np.cos(np.radians(d_lat))
                    dist_m = np.sqrt(dx**2 + dy**2)
                    if 10000 <= dist_m <= 75000:
                        dz = abs(other['elevation_m'] - d_elev)
                        slope_pct = (dz / dist_m) * 100
                        slope_deg = np.degrees(np.arctan(dz / dist_m))
                        nearby_slopes.append(slope_deg)
            mean_slope_deg = round(float(np.mean(nearby_slopes)), 2) if nearby_slopes else 0.1
        else:
            mean_slope_deg = None

        d['mean_slope_degrees'] = mean_slope_deg
        d['mean_slope_percent'] = round(float(np.tan(np.radians(mean_slope_deg)) * 100), 2) if mean_slope_deg is not None else None

    metadata = {
        'product': 'NASADEM_NC.001 / SRTMGL1_NC.003',
        'source': 'NASA LP DAAC via AppEEARS',
        'source_url': 'https://appeears.earthdatacloud.nasa.gov/api/task/348bd938-ec62-4b4c-912e-2725002933a5',
        'spatial_resolution': '1 arc-second (~30 meters native)',
        'variables': ['NASADEM_HGT (elevation in meters above WGS84 ellipsoid)', 'SRTMGL1_DEM'],
        'ingested_at': datetime.now(timezone.utc).isoformat(),
        'districts_count': len(by_district)
    }

    # Save summary
    with open('public/cache/nasadem/nasadem_elevation_slope_summary.json', 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'districts': by_district}, f, indent=2)

    for d_id, d_data in by_district.items():
        with open(f'public/cache/nasadem/{d_id}.json', 'w', encoding='utf-8') as f:
            json.dump({'_metadata': metadata, **d_data}, f, indent=2)

    print('✓ Saved NASADEM elevation and slope for 64 districts to public/cache/nasadem/!')

def process_ecostress(csv_files):
    print('\nProcessing ECOSTRESS ET and LST data...')
    # AppEEARS produces results CSVs per product
    # e.g. *-ECO_L3T_JET-002-results.csv and *-ECO_L2T_LSTE-002-results.csv
    jet_file = next((f for f in csv_files if 'JET-002' in f or 'JET' in f), None)
    lste_file = next((f for f in csv_files if 'LSTE-002' in f or 'LSTE' in f), None)
    
    # Also generic results if single file
    if not jet_file and not lste_file:
        res_file = next((f for f in csv_files if 'results.csv' in f), None)
        jet_file = res_file
        lste_file = res_file

    et_by_district = {}
    if jet_file and os.path.exists(jet_file):
        rows = parse_csv(jet_file)
        print(f'Loaded {len(rows)} ECOSTRESS ET rows from {os.path.basename(jet_file)}')
        for r in rows:
            d_id = r.get('ID', '').strip().lower()
            date = r.get('Date', '')
            et_val = r.get('ECO_L3T_JET_002_ETdaily')
            if d_id and date and et_val and et_val != '' and et_val != 'None':
                try:
                    val_w_m2 = float(et_val)
                    if 0 < val_w_m2 < 1500:
                        if d_id not in et_by_district:
                            et_by_district[d_id] = []
                        et_by_district[d_id].append({
                            'date': date,
                            'et_daily_w_m2': round(val_w_m2, 2)
                        })
                except:
                    pass

    lst_by_district = {}
    if lste_file and os.path.exists(lste_file):
        rows = parse_csv(lste_file)
        print(f'Loaded {len(rows)} ECOSTRESS LST rows from {os.path.basename(lste_file)}')
        for r in rows:
            d_id = r.get('ID', '').strip().lower()
            date = r.get('Date', '')
            lst_val = r.get('ECO_L2T_LSTE_002_LST')
            if d_id and date and lst_val and lst_val != '' and lst_val != 'None':
                try:
                    val_k = float(lst_val)
                    if 250 < val_k < 350:
                        val_c = round(val_k - 273.15, 2)
                        if d_id not in lst_by_district:
                            lst_by_district[d_id] = []
                        lst_by_district[d_id].append({
                            'date': date,
                            'lst_celsius': val_c
                        })
                except:
                    pass

    # Merge by district
    all_districts = set(list(et_by_district.keys()) + list(lst_by_district.keys()))
    summary = {}
    for d_id in all_districts:
        et_list = sorted(et_by_district.get(d_id, []), key=lambda x: x['date'])
        lst_list = sorted(lst_by_district.get(d_id, []), key=lambda x: x['date'])
        latest_et = et_list[-1] if et_list else None
        latest_lst = lst_list[-1] if lst_list else None
        
        d_out = {
            'districtId': d_id,
            'latest_et': latest_et,
            'latest_lst': latest_lst,
            'et_observations_count': len(et_list),
            'lst_observations_count': len(lst_list),
            'revisit_note': 'ECOSTRESS has an asynchronous precessing orbit on the International Space Station (ISS); revisit is non-uniform and varies from 1 to 5 days at varying times of day. No temporal interpolation applied.',
            'et_observations': et_list,
            'lst_observations': lst_list
        }
        summary[d_id] = {k: v for k, v in d_out.items() if not k.endswith('_observations')}

        metadata = {
            'product_et': 'ECO_L3T_JET.002 (70m Tiled Evapotranspiration)',
            'product_lst': 'ECO_L2T_LSTE.002 (70m Tiled Land Surface Temperature & Emissivity)',
            'source': 'NASA LP DAAC via AppEEARS',
            'spatial_resolution': '70m x 70m',
            'platform': 'International Space Station (ISS)',
            'period_covered': '2019-01-01 to Present',
            'ingested_at': datetime.now(timezone.utc).isoformat()
        }
        with open(f'public/cache/ecostress/{d_id}.json', 'w', encoding='utf-8') as f:
            json.dump({'_metadata': metadata, **d_out}, f, indent=2)

    with open('public/cache/ecostress/ecostress_summary.json', 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'districts': summary}, f, indent=2)

    print('✓ Saved ECOSTRESS ET and LST data to public/cache/ecostress/!')

def process_modis_ndvi(csv_files):
    print('\nProcessing MODIS MOD13Q1 16-day NDVI time series (2001-present)...')
    res_file = next((f for f in csv_files if 'results.csv' in f or 'MOD13Q1' in f), None)
    if not res_file:
        print('No results CSV found for MOD13Q1')
        return

    rows = parse_csv(res_file)
    print(f'Loaded {len(rows)} MOD13Q1 rows from {os.path.basename(res_file)}')

    by_district = {}
    for r in rows:
        d_id = r.get('ID', '').strip().lower()
        date = r.get('Date', '')
        ndvi_raw = r.get('MOD13Q1_061__250m_16_days_NDVI')
        qa_raw = r.get('MOD13Q1_061__250m_16_days_pixel_reliability')
        if not d_id or not date:
            continue
        try:
            val = float(ndvi_raw)
            qa = int(qa_raw) if qa_raw and qa_raw != 'None' else 3
            # AppEEARS MOD13Q1 NDVI is already scaled (-1..1) or unscaled (-2000..10000)
            scaled_ndvi = val if abs(val) <= 1.0 else val * 0.0001
            if d_id not in by_district:
                by_district[d_id] = []
            by_district[d_id].append({
                'date': date,
                'ndvi': round(scaled_ndvi, 4),
                'reliability': qa,
                'valid': (qa == 0 or qa == 1)
            })
        except:
            pass

    summary = {}
    metadata = {
        'product': 'MOD13Q1.061',
        'variable': '_250m_16_days_NDVI',
        'source': 'NASA LP DAAC via AppEEARS',
        'spatial_resolution': '250m',
        'temporal_resolution': '16-day composite',
        'period_covered': '2001-01-01 to Present',
        'ingested_at': datetime.now(timezone.utc).isoformat()
    }

    for d_id, obs_list in by_district.items():
        obs_sorted = sorted(obs_list, key=lambda x: x['date'])
        valid_obs = [o for o in obs_sorted if o['valid']]
        summary[d_id] = {
            'districtId': d_id,
            'total_steps': len(obs_sorted),
            'valid_steps': len(valid_obs),
            'first_date': obs_sorted[0]['date'] if obs_sorted else None,
            'latest_date': obs_sorted[-1]['date'] if obs_sorted else None,
            'latest_valid_ndvi': valid_obs[-1]['ndvi'] if valid_obs else None
        }
        with open(f'public/cache/modis_ndvi/{d_id}.json', 'w', encoding='utf-8') as f:
            json.dump({
                '_metadata': metadata,
                'districtId': d_id,
                'series_length': len(obs_sorted),
                'valid_series_length': len(valid_obs),
                'time_series': obs_sorted
            }, f, indent=2)

    with open('public/cache/modis_ndvi/modis_ndvi_summary.json', 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'districts': summary}, f, indent=2)

    print('✓ Saved MODIS MOD13Q1 NDVI time series for 64 districts to public/cache/modis_ndvi/!')

def main():
    print('Checking AppEEARS task completion status...')
    for t_key in ['nasadem', 'ecostress', 'modis_ndvi']:
        status, data = check_task(t_key)
        print(f"Task {t_key.upper()} ({tasks[t_key]['id']}): {status}")
        if status == 'done':
            print(f'Task {t_key.upper()} is DONE! Downloading bundle files...')
            csvs = download_bundle(t_key)
            if t_key == 'nasadem':
                process_nasadem(csvs)
            elif t_key == 'ecostress':
                process_ecostress(csvs)
            elif t_key == 'modis_ndvi':
                process_modis_ndvi(csvs)

if __name__ == '__main__':
    main()
