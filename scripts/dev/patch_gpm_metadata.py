"""Add exact IMERG grid-cell metadata to existing GPM cache files.

This does not download data and does not change precipitation values. It exists
because the rolling cache was generated before the grid-cell metadata was added
to ingest_gpm.py.
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from district_meta import load_district_points

LON_START = 2680
LAT_START = 1105
LONS = [round(88.05 + 0.1 * i, 2) for i in range(48)]
LATS = [round(20.55 + 0.1 * i, 2) for i in range(63)]


def grid_fields(district):
    lon_idx = int(np.argmin(np.abs(np.array(LONS) - district['lon'])))
    lat_idx = int(np.argmin(np.abs(np.array(LATS) - district['lat'])))
    return {
        'grid_cell_lat': LATS[lat_idx],
        'grid_cell_lon': LONS[lon_idx],
        'grid_lon_index': LON_START + lon_idx,
        'grid_lat_index': LAT_START + lat_idx,
        'grid_selection': 'Nearest 0.1-degree IMERG cell centre; no area aggregation.',
    }


def main():
    districts = {d['id']: d for d in load_district_points()}
    fields = {did: grid_fields(d) for did, d in districts.items()}
    metadata_extra = {
        'grid_dimensions': 'precipitation(time, lon, lat)',
        'dimension_order': 'time, lon, lat',
        'dimension_order_note': (
            'OPeNDAP request is precipitation[time][lon][lat]; the parser receives one row per '
            'longitude (48 rows) and 63 latitude values per row. District selection is '
            'arr[lon_index, lat_index], not arr[lat_index, lon_index].'
        ),
        'grid_slice': {
            'lon_start_index': LON_START,
            'lon_end_index': LON_START + len(LONS) - 1,
            'lat_start_index': LAT_START,
            'lat_end_index': LAT_START + len(LATS) - 1,
            'lon_start_degrees': LONS[0],
            'lon_end_degrees': LONS[-1],
            'lat_start_degrees': LATS[0],
            'lat_end_degrees': LATS[-1],
        },
    }
    changed = 0
    for name in os.listdir('public/cache/gpm'):
        if not name.endswith('.json'):
            continue
        path = os.path.join('public/cache/gpm', name)
        data = json.load(open(path, encoding='utf-8'))
        data.get('_metadata', {}).update(metadata_extra)
        if name == 'gpm_last30d_summary.json':
            for did, item in data.get('districts', {}).items():
                if did in fields:
                    item.update(fields[did])
        else:
            did = data.get('districtId')
            if did in fields:
                data.update(fields[did])
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        changed += 1
    print(f'Updated {changed} GPM cache files with exact grid-cell metadata')


if __name__ == '__main__':
    main()
