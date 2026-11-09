import requests
from dotenv import dotenv_values

config = dotenv_values('.env.local')
user = config.get('EARTHDATA_USERNAME')
pwd = config.get('EARTHDATA_PASSWORD')

class EarthdataSession(requests.Session):
    def rebuild_auth(self, prepared_request, response):
        url = prepared_request.url
        if 'urs.earthdata.nasa.gov' in url or 'earthdata.nasa.gov' in url:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(user, pwd)
        return

session = EarthdataSession()
session.auth = (user, pwd)

# Test OPeNDAP dmr.json
url = 'https://opendap.earthdata.nasa.gov/collections/C2723754859-GES_DISC/granules/GPM_3IMERGDL.07%3A3B-DAY-L.MS.MRG.3IMERG.20261107-S000000-E235959.V07C.nc4.dmr.json'
print('Testing OPeNDAP dmr.json...')
r = session.get(url, timeout=30)
print(f'Status: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print('Variables available:', list(data.get('variables', {}).keys()))
else:
    print('Response:', r.text[:200])
