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

for tid in ['348bd938-ec62-4b4c-912e-2725002933a5', 'eb4fcd8a-53bd-4707-b8ba-7991d7e78960', '681b0ec9-0e86-4f27-8f5e-39d38ce2c014']:
    r = requests.get(f'https://appeears.earthdatacloud.nasa.gov/api/task/{tid}', headers={'Authorization': f'Bearer {token}'})
    d = r.json()
    print(d.get('task_name'), 'status:', d.get('status'), 'updated:', d.get('updated'), 'estimate:', d.get('estimate'))
