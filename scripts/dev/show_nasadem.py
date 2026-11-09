import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('public/cache/nasadem/nasadem_elevation_slope_summary.json', encoding='utf-8'))['districts']
for k in ['bandarban', 'rangamati', 'khagrachari', 'sylhet', 'mymensingh', 'dinajpur',
          'rangpur', 'rajshahi', 'bagerhat', 'coxsbazar', 'dhaka']:
    x = d[k]
    print(x['districtName'], '| elev', x['mean_elevation_m'], 'm | min', x['min_elevation_m'],
          '| max', x['max_elevation_m'], '| slope', x['mean_slope_degrees'], 'deg | area',
          x['sampled_area_km2'], 'km2')
