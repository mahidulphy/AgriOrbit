import os
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

url = 'https://data.gesdisc.earthdata.nasa.gov/data/GPM_L3/GPM_3IMERGDL.07/2026/11/3B-DAY-L.MS.MRG.3IMERG.20261107-S000000-E235959.V07C.nc4'

print(f'Testing GPM IMERG download from GES DISC: {url}')
r = session.get(url, stream=True, timeout=30)
print(f'Status: {r.status_code}, Final URL: {r.url[:60]}...')
print(f'Content-Type: {r.headers.get("Content-Type")}')
print(f'Content-Length: {r.headers.get("Content-Length")} bytes')

if r.status_code == 200:
    chunk = next(r.iter_content(chunk_size=1024))
    print(f'First 4 bytes: {chunk[:4]}')
    if b'HDF' in chunk[:8] or b'CDF' in chunk[:8]:
        print('SUCCESS: Valid NetCDF4 file stream established for GPM IMERG!')
r.close()
