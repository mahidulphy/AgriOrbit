"""Shared district metadata for the Python ingest scripts.

docs/data/district_points.csv columns are: id, division, latitude, longitude.
The district display name is parsed from src/data/bdAdmin.ts (nameEn).
"""
import re


def load_district_names():
    names = {}
    text = open('src/data/bdAdmin.ts', encoding='utf-8-sig').read()
    for line in text.splitlines():
        m = re.search(r"id:\s*'([^']+)',\s*nameEn:\s*(['\"])(.*?)\2", line)
        if m:
            names[m.group(1)] = m.group(3)
    if len(names) != 64:
        raise SystemExit(f'Expected 64 district names, got {len(names)}')
    return names


def load_district_points():
    names = load_district_names()
    districts = []
    for line in open('docs/data/district_points.csv', encoding='utf-8'):
        parts = line.strip().split(',')
        if len(parts) < 4:
            continue
        did = parts[0].strip()
        districts.append({
            'id': did,
            'name': names.get(did, did),
            'division': parts[1].strip(),
            'lat': float(parts[2].strip()),
            'lon': float(parts[3].strip()),
        })
    if len(districts) != 64:
        raise SystemExit(f'Expected 64 district points, got {len(districts)}')
    return districts
