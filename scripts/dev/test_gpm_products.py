import os
import sys
import time

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


def get(label, url):
    for attempt in range(3):
        try:
            r = S().get(url, timeout=45)
            print(label, 'attempt', attempt + 1, 'status', r.status_code, 'len', len(r.text), 'redirects', len(r.history))
            if r.status_code == 200:
                print('  first line:', r.text.splitlines()[0][:160])
                return
        except Exception as e:
            print(label, 'attempt', attempt + 1, 'error', type(e).__name__, str(e)[:160])
        time.sleep(3)


lon = 'precipitation[0:0][2680:2727][1105:1167]'
get('final-2020', 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDF.07/2020/01/3B-DAY.MS.MRG.3IMERG.20200101-S000000-E235959.V07B.nc4.ascii?' + lon)
get('late-2026', 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/2026/11/3B-DAY-L.MS.MRG.3IMERG.20261107-S000000-E235959.V07C.nc4.ascii?' + lon)
