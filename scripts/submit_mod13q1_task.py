import requests
from dotenv import dotenv_values

config = dotenv_values('.env.local')
user = config.get('EARTHDATA_USERNAME')
pwd = config.get('EARTHDATA_PASSWORD')

r_login = requests.post(
    'https://appeears.earthdatacloud.nasa.gov/api/login',
    auth=(user, pwd),
    headers={'Content-Type': 'application/json'}
)
token = r_login.json().get('token')

coords = []
with open('docs/data/district_points.csv', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split(',')
        if len(parts) >= 4:
            d_id = parts[0].strip()
            lat = float(parts[2].strip())
            lon = float(parts[3].strip())
            coords.append({
                'id': d_id,
                'category': 'district',
                'latitude': lat,
                'longitude': lon
            })

print(f'Submitting MOD13Q1 task for {len(coords)} districts (2001-01-01 to 2026-11-08)...')

task_payload = {
    'task_type': 'point',
    'task_name': 'agriorbit_mod13q1_timeseries_bd_districts',
    'params': {
        'dates': [
            {
                'startDate': '01-01-2001',
                'endDate': '11-08-2026'
            }
        ],
        'layers': [
            {
                'product': 'MOD13Q1.061',
                'layer': '_250m_16_days_NDVI'
            },
            {
                'product': 'MOD13Q1.061',
                'layer': '_250m_16_days_pixel_reliability'
            }
        ],
        'coordinates': coords
    }
}

r_task = requests.post(
    'https://appeears.earthdatacloud.nasa.gov/api/task',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json=task_payload
)

print('Status:', r_task.status_code)
print('Response:', r_task.text)
