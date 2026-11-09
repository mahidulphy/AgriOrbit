import os
import requests
from dotenv import dotenv_values

config = dotenv_values('.env.local')
user = config.get('EARTHDATA_USERNAME')
pwd = config.get('EARTHDATA_PASSWORD')

# Custom Session that preserves auth on URS redirect
class EarthdataSession(requests.Session):
    def rebuild_auth(self, prepared_request, response):
        # Keep auth when redirected to URS
        headers = prepared_request.headers
        url = prepared_request.url
        if 'urs.earthdata.nasa.gov' in url or 'earthdata.nasa.gov' in url:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(user, pwd)
        return

session = EarthdataSession()
session.auth = (user, pwd)

url = 'https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4/GRCTellus.JPL.200204_202608.GLO.RL06.3M.MSCNv04CRI.nc'

print('Testing EarthdataSession download...')
r = session.get(url, stream=True, timeout=30)
print(f'Status: {r.status_code}, Final URL: {r.url[:60]}...')
print(f'Content-Type: {r.headers.get("Content-Type")}')
print(f'Content-Length: {r.headers.get("Content-Length")} bytes')

if r.status_code == 200:
    chunk = next(r.iter_content(chunk_size=1024))
    print(f'First 4 bytes: {chunk[:4]}')
    if b'HDF' in chunk[:8] or b'CDF' in chunk[:8]:
        print('SUCCESS: Valid NetCDF4 file stream established!')
r.close()
