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

# Test ascii slice for Bangladesh on 2026-11-07
url = 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/2026/11/3B-DAY-L.MS.MRG.3IMERG.20261107-S000000-E235959.V07C.nc4.ascii?precipitation[0:0][2680:2727][1105:1167]'
print('Fetching Bangladesh OPeNDAP ascii slice...')
r = session.get(url, timeout=30)
print(f'Status: {r.status_code}, Bytes: {len(r.text)}')
if r.status_code == 200:
    lines = r.text.strip().split('\n')
    print('First 10 lines of OPeNDAP slice:')
    for line in lines[:10]:
        print(' ', line)
