import requests

res = requests.get('https://appeears.earthdatacloud.nasa.gov/api/product').json()
for p in res:
    if p.get('ProductAndVersion') == 'ECO_L3T_JET.002':
        print(p)
