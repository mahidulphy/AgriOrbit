import os
import re
import sys

import requests
from dotenv import dotenv_values

sys.stdout.reconfigure(encoding='utf-8')
cfg = dotenv_values('.env.local')
user = cfg.get('EARTHDATA_USERNAME') or os.environ.get('EARTHDATA_USERNAME')
pwd = cfg.get('EARTHDATA_PASSWORD') or os.environ.get('EARTHDATA_PASSWORD')


class S(requests.Session):
    def __init__(self):
        super().__init__()
        self.auth = (user, pwd)

    def rebuild_auth(self, prepared_request, response):
        u = prepared_request.url
        if 'urs.earthdata.nasa.gov' in u or 'earthdata.nasa.gov' in u:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(user, pwd)


s = S()
base = 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3'
for path in [
    'GPM_3IMERGDF.07/2020/01/catalog.xml',
    'GPM_3IMERGDF.07/2026/07/catalog.xml',
    'GPM_3IMERGDF.07/2026/08/catalog.xml',
    'GPM_3IMERGDF.07/2026/09/catalog.xml',
    'GPM_3IMERGDF.07/2026/10/catalog.xml',
    'GPM_3IMERGDF.07/2026/11/catalog.xml',
]:
    r = s.get(f'{base}/{path}', timeout=60)
    print(path, r.status_code, len(r.content))
    if r.status_code == 200:
        names = re.findall(r'dataset name="([^"]+)"', r.text)
        print('  n', len(names), 'first', names[:1], 'last', names[-1:])
