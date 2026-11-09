import os
import sys
import time
from datetime import datetime, timezone

import requests
from dotenv import dotenv_values

sys.stdout.reconfigure(encoding='utf-8')
cfg = dotenv_values('.env.local')
user = cfg.get('EARTHDATA_USERNAME') or os.environ.get('EARTHDATA_USERNAME')
pwd = cfg.get('EARTHDATA_PASSWORD') or os.environ.get('EARTHDATA_PASSWORD')
token = requests.post(
    'https://appeears.earthdatacloud.nasa.gov/api/login',
    auth=(user, pwd),
    headers={'Content-Type': 'application/json'},
    timeout=60,
).json()['token']
tid = '82e2e7e6-c38e-4210-92e5-8e470bd23e0f'

for attempt in range(10):
    now = datetime.now(timezone.utc).strftime('%H:%M:%S')
    task = requests.get(
        f'https://appeears.earthdatacloud.nasa.gov/api/task/{tid}',
        headers={'Authorization': f'Bearer {token}'},
        timeout=60,
    ).json()
    status = task.get('status')
    print(f'[{now}] MYD13Q1: {status} updated={task.get("updated")}', flush=True)
    try:
        r = requests.get(
            'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDL.07/2026/11/catalog.xml',
            auth=(user, pwd),
            timeout=15,
        )
        print(f'[{now}] GES DISC catalog: HTTP {r.status_code}', flush=True)
    except Exception as exc:
        print(f'[{now}] GES DISC: {type(exc).__name__}', flush=True)
    if status == 'done':
        print('MYD13Q1 task is done')
        break
    if attempt < 9:
        time.sleep(30)
