import json
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

# Load 64 district coordinates from docs/data/district_points.csv
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

print(f'Loaded {len(coords)} district coordinates.')

# Task A: NASADEM & SRTMGL1
task_payload = {
    'task_type': 'point',
    'task_name': 'agriorbit_nasadem_bd_districts',
    'params': {
        'dates': [
            {
                'startDate': '02-11-2000',
                'endDate': '02-22-2000'
            }
        ],
        'layers': [
            {
                'product': 'NASADEM_NC.001',
                'layer': 'NASADEM_HGT'
            },
            {
                'product': 'SRTMGL1_NC.003',
                'layer': 'SRTMGL1_DEM'
            }
        ],
        'coordinates': coords
    }
}

print('Submitting NASADEM point task to AppEEARS...')
r_task = requests.post(
    'https://appeears.earthdatacloud.nasa.gov/api/task',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json=task_payload
)

print('Task submission status:', r_task.status_code)
print('Response:', r_task.text)
