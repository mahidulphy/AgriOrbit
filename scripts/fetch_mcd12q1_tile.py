"""Download the MCD12Q1 2023 h25v06 tile needed for western Bangladesh.

The h26v06 tile alone does not cover Chapai Nawabganj and the western edge of
the ADM2 polygons. This script downloads the adjacent h25v06 tile from LP DAAC
using Earthdata credentials from the environment or .env.local. It never prints
credentials and does not modify the existing h26v06 granule.
"""
import os
import sys

import requests
from dotenv import dotenv_values

URL = (
    'https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/MCD12Q1.061/'
    'MCD12Q1.A2023001.h25v06.061.2024252132116/'
    'MCD12Q1.A2023001.h25v06.061.2024252132116.hdf'
)
OUT = 'data/raw/mcd12q1/MCD12Q1.A2023001.h25v06.061.2024252132116.hdf'


def credentials():
    config = dotenv_values('.env.local')
    user = os.environ.get('EARTHDATA_USERNAME') or config.get('EARTHDATA_USERNAME')
    pwd = os.environ.get('EARTHDATA_PASSWORD') or config.get('EARTHDATA_PASSWORD')
    if not user or not pwd:
        raise SystemExit('Missing EARTHDATA_USERNAME / EARTHDATA_PASSWORD (env or .env.local)')
    return user, pwd


class EarthdataSession(requests.Session):
    def __init__(self, user, pwd):
        super().__init__()
        self._user = user
        self._pwd = pwd
        self.auth = (user, pwd)

    def rebuild_auth(self, prepared_request, response):
        url = prepared_request.url
        if 'urs.earthdata.nasa.gov' in url or 'earthdata.nasa.gov' in url:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(
                self._user, self._pwd
            )


def main():
    os.makedirs('data/raw/mcd12q1', exist_ok=True)
    if os.path.exists(OUT) and os.path.getsize(OUT) > 10_000_000:
        print(f'Using cached tile: {OUT} ({os.path.getsize(OUT)} bytes)')
        return
    user, pwd = credentials()
    session = EarthdataSession(user, pwd)
    print('Downloading MCD12Q1 h25v06 tile from LP DAAC...')
    response = session.get(URL, stream=True, timeout=300)
    print('HTTP', response.status_code, 'Content-Type', response.headers.get('Content-Type'))
    if response.status_code != 200:
        raise SystemExit(f'Download failed: HTTP {response.status_code}')
    tmp = OUT + '.part'
    total = 0
    with open(tmp, 'wb') as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
                total += len(chunk)
    with open(tmp, 'rb') as f:
        signature = f.read(4)
    if signature != b'\x0e\x03\x13\x01':
        os.remove(tmp)
        raise SystemExit(f'Downloaded file is not HDF4 (signature {signature!r}); login redirect?')
    os.replace(tmp, OUT)
    print(f'Downloaded {total} bytes to {OUT}')


if __name__ == '__main__':
    main()
