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

grace = load(f'{ROOT}/grace/grace_summary.json')
print('GRACE regions:', len(grace['regions']), 'district map:', len(grace['district_region_map']))
if len(grace['district_region_map']) != 64:
    problems.append('grace: district map != 64')
for did, m in grace['district_region_map'].items():
    if m['regionId'] not in grace['regions']:
        problems.append(f'grace: {did} -> missing region {m["regionId"]}')

nas_files = [f for f in os.listdir(f'{ROOT}/nasadem') if f.endswith('.json') and 'summary' not in f]
print('NASADEM district files:', len(nas_files))
for f in nas_files:
    d = load(f'{ROOT}/nasadem/{f}')
    if d['mean_elevation_m'] is None or d['mean_slope_degrees'] is None:
        problems.append(f'nasadem/{f}: missing value')
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
