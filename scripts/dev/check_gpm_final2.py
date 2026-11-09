import os
import re
import sys

import requests
from dotenv import dotenv_values

sys.stdout.reconfigure(encoding='utf-8')
c = dotenv_values('.env.local')
u = c.get('EARTHDATA_USERNAME') or os.environ.get('EARTHDATA_USERNAME')
p = c.get('EARTHDATA_PASSWORD') or os.environ.get('EARTHDATA_PASSWORD')


class S(requests.Session):
    def __init__(self):
        super().__init__()
        self.auth = (u, p)

    def rebuild_auth(self, pr, resp):
        if 'earthdata.nasa.gov' in pr.url:
            pr.headers['Authorization'] = requests.auth._basic_auth_str(u, p)


s = S()
base = 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDF.07'
for ym in ['2025/12', '2026/01', '2026/02', '2026/03', '2026/04', '2026/05', '2026/06']:
    r = s.get(f'{base}/{ym}/catalog.xml', timeout=60)
    names = re.findall(r'dataset name="([^"]+\.nc4)"', r.text) if r.status_code == 200 else []
    print(ym, r.status_code, len(names), names[-1:] if names else '')
