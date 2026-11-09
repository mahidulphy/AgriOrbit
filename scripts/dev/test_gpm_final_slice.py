import os
import sys

import numpy as np
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
lon_start_idx, lon_end_idx = 2680, 2727
lat_start_idx, lat_end_idx = 1105, 1167
ymd = '20200101'
url = (
    'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDF.07/2020/01/'
    f'3B-DAY.MS.MRG.3IMERG.{ymd}-S000000-E235959.V07B.nc4.ascii'
    f'?precipitation[0:0][{lon_start_idx}:{lon_end_idx}][{lat_start_idx}:{lat_end_idx}]'
)
r = s.get(url, timeout=60)
print(r.status_code, len(r.text))
print(r.text[:400])
grid = []
for line in r.text.strip().split('\n'):
    line = line.strip()
    if 'precipitation.precipitation[' in line:
        parts = line.split(',')
        grid.append([float(x.strip()) for x in parts[1:]])
arr = np.array(grid)
print('shape', arr.shape, 'min', arr.min(), 'max', arr.max(), 'mean', arr.mean())
