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

task_id = '3d27655e-9af7-4df5-a83d-9785ec7600b9'
r_bundle = requests.get(
    f'https://appeears.earthdatacloud.nasa.gov/api/bundle/{task_id}',
    headers={'Authorization': f'Bearer {token}'}
)
print('Bundle status:', r_bundle.status_code)
if r_bundle.status_code == 200:
    bundle = r_bundle.json()
    print('Bundle files count:', len(bundle.get('files', [])))
    for f in bundle.get('files', []):
        print(f"  - {f.get('file_name')} ({f.get('file_size')} bytes, type: {f.get('file_type')})")
