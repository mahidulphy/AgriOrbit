"""Download NASADEM_NC.001 1x1 degree tiles covering Bangladesh district polygons.

The earlier AppEEARS NASADEM task is a point sample at 64 district headquarters.
Phase 10 requires polygon means, so this script downloads the native 30 m
NASADEM_HGT tiles from NASA LP DAAC and process_nasadem.py computes zonal
statistics over the HDX/OCHA COD-AB ADM2 district polygons.
"""
import json
import os
import re
import sys

import requests
from dotenv import dotenv_values

from district_meta import load_district_names

CMR_URL = 'https://cmr.earthdata.nasa.gov/search/granules.json'
GRANULE_BASE = 'https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_NC.001'


def credentials():
    config = dotenv_values('.env.local')
    user = config.get('EARTHDATA_USERNAME') or os.environ.get('EARTHDATA_USERNAME')
    pwd = config.get('EARTHDATA_PASSWORD') or os.environ.get('EARTHDATA_PASSWORD')
    if not user or not pwd:
        raise SystemExit('Missing EARTHDATA_USERNAME / EARTHDATA_PASSWORD (env or .env.local)')
    return user, pwd


class EarthdataSession(requests.Session):
    def __init__(self, user, pwd):
        super().__init__()
        self._user = user
        self._pwd = pwd
        self.auth = (user, pwd)

    def rebuild_auth(self, prepared_request, response):
        url = prepared_request.url
        if 'urs.earthdata.nasa.gov' in url or 'earthdata.nasa.gov' in url:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(self._user, self._pwd)


ALIASES = {
    'coxsbazar': 'coxsbazar',
    'chapainababganj': 'chapainawabganj',
    'netrakona': 'netrokona',
    'jhalokati': 'jhalokati',
    'khagrachhari': 'khagrachari',
}


def normalize(name):
    key = re.sub(r'[^a-z]', '', name.lower())
    return ALIASES.get(key, key)


def district_polygons():
    names = load_district_names()
    path = 'data/raw/boundaries/bgd_admin2.geojson'
    if not os.path.exists(path):
        raise SystemExit(f'Missing {path}; download HDX OCHA COD-AB ADM2 GeoJSON first')
    data = json.load(open(path, encoding='utf-8'))
    lookup = {normalize(v): k for k, v in names.items()}
    out = {}
    missing = []
    for feature in data['features']:
        adm2 = feature['properties']['adm2_name']
        did = lookup.get(normalize(adm2))
        if not did:
            missing.append(adm2)
            continue
        out[did] = feature
    if missing:
        raise SystemExit(f'Unmatched ADM2 names: {missing}')
    assert len(out) == 64, f'Expected 64 matched districts, got {len(out)}'
    return names, out


def bbox(geometry):
    xs, ys = [], []
    rings = []
    if geometry['type'] == 'Polygon':
        rings = [geometry['coordinates']]
    elif geometry['type'] == 'MultiPolygon':
        rings = geometry['coordinates']
    else:
        raise ValueError(geometry['type'])
    for poly in rings:
        for ring in poly:
            for x, y in ring:
                xs.append(x)
                ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


def tile_has_land(tile, polygons):
    from matplotlib.path import Path

    lat, lon = tile
    step = 0.125
    sample = [(lon + x * step, lat + y * step) for x in range(9) for y in range(9)]
    for feature in polygons.values():
        geometry = feature['geometry']
        polys = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
        for poly in polys:
            outer = poly[0]
            if any(lon <= x <= lon + 1 and lat <= y <= lat + 1 for x, y in outer):
                return True
            path = Path(outer)
            hits = path.contains_points(sample)
            if not hits.any():
                continue
            hole_paths = [Path(hole) for hole in poly[1:]]
            for point, hit in zip(sample, hits):
                if hit and not any(h.contains_point(point) for h in hole_paths):
                    return True
    return False


def needed_tiles(polygons):
    tiles = set()
    for feature in polygons.values():
        minx, miny, maxx, maxy = bbox(feature['geometry'])
        for lat in range(int(miny // 1), int(maxy // 1) + 1):
            for lon in range(int(minx // 1), int(maxx // 1) + 1):
                tiles.add((lat, lon))
    return {tile for tile in tiles if tile_has_land(tile, polygons)}


def main():
    user, pwd = credentials()
    session = EarthdataSession(user, pwd)
    names, polygons = district_polygons()
    needed = needed_tiles(polygons)

    r = requests.get(CMR_URL, params={
        'short_name': 'NASADEM_NC',
        'version': '001',
        'bounding_box': '87,20,94,27',
        'page_size': 200,
    }, timeout=120)
    r.raise_for_status()
    granules = {}
    for entry in r.json()['feed']['entry']:
        title = entry['title']
        m = re.fullmatch(r'NASADEM_NC_n(\d{2})([ew])(\d{3})', title)
        if not m:
            continue
        lat = int(m.group(1))
        lon = int(m.group(3)) * (1 if m.group(2) == 'e' else -1)
        granules[(lat, lon)] = title

    missing_tiles = [t for t in needed if t not in granules]
    if missing_tiles:
        raise SystemExit(f'CMR has no granule for tiles: {missing_tiles}')

    os.makedirs('data/raw/nasadem', exist_ok=True)
    print(f'{len(polygons)} districts require {len(needed)} NASADEM tiles')
    for idx, (lat, lon) in enumerate(sorted(needed), 1):
        title = granules[(lat, lon)]
        out_path = os.path.join('data/raw/nasadem', title + '.nc')
        if os.path.exists(out_path) and os.path.getsize(out_path) > 20_000_000:
            print(f'  [{idx}/{len(needed)}] cached {title}')
            continue
        url = f'{GRANULE_BASE}/{title}/{title}.nc'
        print(f'  [{idx}/{len(needed)}] downloading {title}...')
        resp = session.get(url, stream=True, timeout=600)
        if resp.status_code != 200:
            raise SystemExit(f'{title}: HTTP {resp.status_code}')
        expected = resp.headers.get('Content-Length')
        tmp = out_path + '.part'
        total = 0
        with open(tmp, 'wb') as fh:
            for chunk in resp.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    fh.write(chunk)
                    total += len(chunk)
        if expected is not None and total != int(expected):
            raise SystemExit(f'{title}: got {total} bytes, expected {expected}')
        os.replace(tmp, out_path)
        print(f'    saved {out_path} ({total} bytes)')

    meta = {
        'product': 'NASADEM_NC.001',
        'granules': sorted(granules[t] for t in needed),
        'tiles_count': len(needed),
        'district_polygons': 'HDX/OCHA COD-AB ADM2 (bgd_admin2.geojson)',
        'downloaded_at': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
    }
    with open('data/raw/nasadem/download_manifest.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)
    print('NASADEM download complete')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
