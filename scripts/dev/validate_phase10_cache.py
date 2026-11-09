import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = 'public/cache'
problems = []


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


gpm_files = [f for f in os.listdir(f'{ROOT}/gpm') if f.endswith('.json') and f != 'gpm_last30d_summary.json']
print('GPM district files:', len(gpm_files))
for f in gpm_files:
    d = load(f'{ROOT}/gpm/{f}')
    if len(d['daily_series']) != 30:
        problems.append(f'gpm/{f}: {len(d["daily_series"])} days')
    if d['valid_days_count'] != 30:
        problems.append(f'gpm/{f}: valid {d["valid_days_count"]}')
    if d['districtName'] in (None, '') or d['latitude'] is None:
        problems.append(f'gpm/{f}: missing name/coords')
    for key in ('grid_cell_lat', 'grid_cell_lon', 'grid_lon_index', 'grid_lat_index'):
        if d.get(key) is None:
            problems.append(f'gpm/{f}: missing {key}')
if load(f'{ROOT}/gpm/rangpur.json')['_metadata'].get('dimension_order') != 'time, lon, lat':
    problems.append('gpm: dimension order not time, lon, lat')

grace = load(f'{ROOT}/grace/grace_summary.json')
print('GRACE regions:', len(grace['regions']), 'district map:', len(grace['district_region_map']))
if len(grace['regions']) != 5:
    problems.append(f'grace: expected 5 mascon regions, got {len(grace["regions"])}')
if len(grace['district_region_map']) != 64:
    problems.append('grace: district map != 64')
if sum(r['districts_count'] for r in grace['regions'].values()) != 64:
    problems.append('grace: mascon district counts do not sum to 64')
for did, m in grace['district_region_map'].items():
    if m['regionId'] not in grace['regions']:
        problems.append(f'grace: {did} -> missing region {m["regionId"]}')
for rid, r in grace['regions'].items():
    if r.get('area_pct_inside_bangladesh') is None:
        problems.append(f'grace: {rid} missing area %')
    if r.get('districts_count', 0) < 1:
        problems.append(f'grace: {rid} has no districts')

nas_files = [f for f in os.listdir(f'{ROOT}/nasadem') if f.endswith('.json') and 'summary' not in f]
print('NASADEM district files:', len(nas_files))
for f in nas_files:
    d = load(f'{ROOT}/nasadem/{f}')
    if d['mean_elevation_m'] is None or d['mean_slope_degrees'] is None:
        problems.append(f'nasadem/{f}: missing value')
    if d.get('median_slope_degrees') is None:
        problems.append(f'nasadem/{f}: missing median slope')
    for key in ('area_pct_slope_gt2_degrees', 'area_pct_slope_gt5_degrees'):
        if d.get(key) is None or not (0 <= d[key] <= 100):
            problems.append(f'nasadem/{f}: bad {key}')
    if d.get('main_erosion_indicator') != 'area_pct_slope_gt5_degrees':
        problems.append(f'nasadem/{f}: wrong main erosion indicator')
    if d['sampled_area_km2'] <= 0:
        problems.append(f'nasadem/{f}: bad area')
    if d['mean_slope_degrees'] < 0 or d['mean_slope_degrees'] > 90:
        problems.append(f'nasadem/{f}: bad slope')

eco_files = [f for f in os.listdir(f'{ROOT}/ecostress') if f.endswith('.json') and 'summary' not in f]
print('ECOSTRESS district files:', len(eco_files))
for f in eco_files:
    d = load(f'{ROOT}/ecostress/{f}')
    if d['et_observations_count'] < 1:
        problems.append(f'ecostress/{f}: no ET')
    if d['coordinates']['latitude'] is None:
        problems.append(f'ecostress/{f}: missing coords')
    if d['latest_et'] and 'et_daily_mm_per_day' not in d['latest_et']:
        problems.append(f'ecostress/{f}: latest_et missing mm/day')
    for obs_key in ('latest_et', 'latest_lst'):
        obs = d.get(obs_key)
        if obs:
            for key in ('datetime_local', 'solar_elevation_deg', 'day_night'):
                if key not in obs:
                    problems.append(f'ecostress/{f}: {obs_key} missing {key}')
    daytime = d.get('lst_series_daytime', [])
    if d.get('lst_observations_daytime_count') != len(daytime):
        problems.append(f'ecostress/{f}: daytime count mismatch')
    if any(o.get('day_night') != 'day' or o.get('solar_elevation_deg', 0) <= 0 for o in daytime):
        problems.append(f'ecostress/{f}: daytime LST series contains non-day rows')

lc = load(f'{ROOT}/landcover/mcd12q1_hq.json')
print('MCD12Q1 HQ points:', len(lc['hq_points']))
for did in ('rangpur', 'rajshahi', 'sylhet'):
    if did not in lc['hq_points']:
        problems.append(f'mcd12q1: missing {did}')
    elif lc['hq_points'][did]['center_class_code'] != 13:
        problems.append(f'mcd12q1: {did} not urban')

mod_files = [f for f in os.listdir(f'{ROOT}/modis_ndvi/mod13q1') if f.endswith('.json') and 'summary' not in f]
print('MOD13Q1 district files:', len(mod_files))
for f in mod_files:
    d = load(f'{ROOT}/modis_ndvi/mod13q1/{f}')
    expected = d['expected_series_length'] - len(d['missing_composite_dates'])
    if d['series_length'] != expected:
        problems.append(f'mod13q1/{f}: series {d["series_length"]} != expected {expected}')
    if d['missing_composite_dates']:
        print(f'  note: mod13q1/{f} missing composites {d["missing_composite_dates"]}')
    if d['coordinates']['latitude'] is None:
        problems.append(f'mod13q1/{f}: missing coords')

print('\nProblems:', len(problems))
for p in problems[:50]:
    print(' -', p)
