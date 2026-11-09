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

r = requests.get(
    'https://appeears.earthdatacloud.nasa.gov/api/task/348bd938-ec62-4b4c-912e-2725002933a5',
    headers={'Authorization': f'Bearer {token}'}
)
print('Task details:', r.json())
