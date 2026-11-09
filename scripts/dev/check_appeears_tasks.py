import requests
from dotenv import dotenv_values

config = dotenv_values('.env.local')
user = config.get('EARTHDATA_USERNAME')
pwd = config.get('EARTHDATA_PASSWORD')

# Get AppEEARS token
r_login = requests.post(
    'https://appeears.earthdatacloud.nasa.gov/api/login',
    auth=(user, pwd),
    headers={'Content-Type': 'application/json'}
)
token = r_login.json().get('token')
print('AppEEARS Token obtained:', bool(token))

# List existing tasks
r_tasks = requests.get(
    'https://appeears.earthdatacloud.nasa.gov/api/task',
    headers={'Authorization': f'Bearer {token}'}
)
print('Tasks status:', r_tasks.status_code)
if r_tasks.status_code == 200:
    tasks = r_tasks.json()
    print(f'Total tasks in account: {len(tasks)}')
    for t in tasks[:10]:
        print(f"- {t.get('task_name')} ({t.get('task_id')}): {t.get('status')} [type: {t.get('task_type')}]")
