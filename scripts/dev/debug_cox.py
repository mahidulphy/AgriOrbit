import sys
sys.path.insert(0, 'scripts')
import fetch_nasadem as f
names = f.load_district_names()
lookup = {f.normalize(v): k for k, v in names.items()}
print('coxsbazar name:', names.get('coxsbazar'))
print('coxsbazar key:', f.normalize(names['coxsbazar']), 'lookup ->', lookup.get(f.normalize(names['coxsbazar'])))
print("adm2 key:", f.normalize("Cox's Bazar"), 'lookup ->', lookup.get(f.normalize("Cox's Bazar")))
print('repr adm2:', repr("Cox's Bazar"))
