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
for y in [2021, 2022, 2023, 2024, 2025]:
    for m in ['01', '06', '12']:
        r = s.get(f'{base}/{y}/{m}/catalog.xml', timeout=60)
        names = re.findall(r'dataset name="([^"]+\.nc4)"', r.text) if r.status_code == 200 else []
        print(f'{y}/{m}', r.status_code, len(names), names[-1:] if names else '')
