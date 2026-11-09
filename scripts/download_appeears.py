import os
import sys
import requests
from dotenv import dotenv_values

TASKS = {
    'nasadem': '348bd938-ec62-4b4c-912e-2725002933a5',
    'ecostress': 'eb4fcd8a-53bd-4707-b8ba-7991d7e78960',
    'mod13q1': '681b0ec9-0e86-4f27-8f5e-39d38ce2c014',
    'myd13q1': '82e2e7e6-c38e-4210-92e5-8e470bd23e0f',
}

config = dotenv_values('.env.local')
user = os.environ.get('EARTHDATA_USERNAME') or config.get('EARTHDATA_USERNAME')
pwd = os.environ.get('EARTHDATA_PASSWORD') or config.get('EARTHDATA_PASSWORD')
if not user or not pwd:
    raise SystemExit('Missing EARTHDATA_USERNAME / EARTHDATA_PASSWORD (env or .env.local)')

login = requests.post(
    'https://appeears.earthdatacloud.nasa.gov/api/login',
    auth=(user, pwd),
    headers={'Content-Type': 'application/json'},
)
login.raise_for_status()
token = login.json()['token']

selected = sys.argv[1:] or list(TASKS)
for key in selected:
    if key not in TASKS:
        raise SystemExit(f'Unknown task key: {key}')
    tid = TASKS[key]
    out_dir = os.path.join('data', 'raw', 'appeears', key)
    os.makedirs(out_dir, exist_ok=True)

    task = requests.get(
        f'https://appeears.earthdatacloud.nasa.gov/api/task/{tid}',
        headers={'Authorization': f'Bearer {token}'},
    ).json()
    print(f"{key}: status={task.get('status')} updated={task.get('updated')}")
    if task.get('status') != 'done':
        print(f'  skipping download, task not done')
        continue

    bundle = requests.get(
        f'https://appeears.earthdatacloud.nasa.gov/api/bundle/{tid}',
        headers={'Authorization': f'Bearer {token}'},
    ).json()

    for f in bundle.get('files', []):
        fname = f['file_name']
        out_path = os.path.join(out_dir, fname)
        if os.path.exists(out_path) and os.path.getsize(out_path) == f.get('file_size'):
            print(f'  [cached] {out_path}')
            continue
        print(f"  downloading {fname} ({f.get('file_size')} bytes)...")
        r = requests.get(
            f"https://appeears.earthdatacloud.nasa.gov/api/bundle/{tid}/{f['file_id']}",
            headers={'Authorization': f'Bearer {token}'},
            stream=True,
        )
        r.raise_for_status()
        tmp = out_path + '.part'
        with open(tmp, 'wb') as fh:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    fh.write(chunk)
        os.replace(tmp, out_path)
        actual = os.path.getsize(out_path)
        if f.get('file_size') is not None and actual != f['file_size']:
            raise RuntimeError(f'{out_path}: size {actual} != bundle {f["file_size"]}')
        print(f'  [ok] {out_path} ({actual} bytes)')

print('done')
