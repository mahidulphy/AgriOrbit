"""Extract MCD12Q1 land-cover classes at the three district HQ points.

The cache is deliberately limited to the HQ pixels and their immediate 5x5
neighbourhoods. It is not a district-wide cropland fraction and it is not used
to mask NDVI, LST or ET in Phase 10.

MCD12Q1 is a 500 m annual product. The HDF4 file is read with pyhdf, which is
installed for Python 3.12 (not 3.14). The generated JSON is checked in, so CI
does not need pyhdf.
"""
import json
import os
import sys
from datetime import datetime, timezone

import numpy as np
from pyhdf.SD import SD, SDC

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from district_meta import load_district_points

HDF_PATH = 'data/raw/mcd12q1/MCD12Q1.A2023001.h26v06.061.2024252132255.hdf'
GRANULE = 'MCD12Q1.A2023001.h26v06.061.2024252132255.hdf'
SOURCE_URL = (
    'https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/MCD12Q1.061/'
    'MCD12Q1.A2023001.h26v06.061.2024252132255/'
    'MCD12Q1.A2023001.h26v06.061.2024252132255.hdf'
)
OUT_PATH = 'public/cache/landcover/mcd12q1_hq.json'
TILE_H = 26
TILE_V = 6
SINUSOIDAL_R = 6371007.181
TILE_SIZE = 1111950.0

CLASS_NAMES = {
    1: 'Evergreen Needleleaf Forests',
    2: 'Evergreen Broadleaf Forests',
    3: 'Deciduous Needleleaf Forests',
    4: 'Deciduous Broadleaf Forests',
    5: 'Mixed Forests',
    6: 'Closed Shrublands',
    7: 'Open Shrublands',
    8: 'Woody Savannas',
    9: 'Savannas',
    10: 'Grasslands',
    11: 'Permanent Wetlands',
    12: 'Croplands',
    13: 'Urban and Built-up Lands',
    14: 'Cropland/Natural Vegetation Mosaics',
    15: 'Permanent Snow and Ice',
    16: 'Barren',
    17: 'Water Bodies',
    255: 'Unclassified',
}


def row_col(lat, lon):
    x_min = -20015109.354 + TILE_H * TILE_SIZE
    y_max = 10007554.677 - TILE_V * TILE_SIZE
    pixel = TILE_SIZE / 2400.0
    x = SINUSOIDAL_R * np.radians(lon) * np.cos(np.radians(lat))
    y = SINUSOIDAL_R * np.radians(lat)
    return int(np.floor((y_max - y) / pixel)), int(np.floor((x - x_min) / pixel))


def class_counts(values):
    unique, counts = np.unique(values, return_counts=True)
    return {int(k): int(v) for k, v in zip(unique, counts)}


def named_counts(counts):
    return {CLASS_NAMES.get(k, f'Class {k}'): v for k, v in sorted(counts.items())}


def main():
    if not os.path.exists(HDF_PATH):
        raise SystemExit(f'Missing MCD12Q1 HDF: {HDF_PATH}')
    sd = SD(HDF_PATH, SDC.READ)
    data = sd.select('LC_Type1').get()
    sd.end()

    points = {d['id']: d for d in load_district_points()}
    hq_ids = ['rangpur', 'rajshahi', 'sylhet']
    hq = {}
    for did in hq_ids:
        point = points[did]
        row, col = row_col(point['lat'], point['lon'])
        center = int(data[row, col])
        window = data[row - 2:row + 3, col - 2:col + 3]
        counts = class_counts(window.ravel())
        hq[did] = {
            'districtId': did,
            'districtName': point['name'],
            'latitude': point['lat'],
            'longitude': point['lon'],
            'tile': f'h{TILE_H:02d}v{TILE_V:02d}',
            'row': row,
            'col': col,
            'center_class_code': center,
            'center_class_name': CLASS_NAMES.get(center, f'Class {center}'),
            'center_is_urban': center == 13,
            'center_is_water': center == 17,
            'neighborhood_5x5_counts': {str(k): v for k, v in sorted(counts.items())},
            'neighborhood_5x5_named_counts': named_counts(counts),
            'neighborhood_5x5_urban_fraction': round(counts.get(13, 0) / 25.0, 2),
        }

    checks = {}
    for name, lat, lon in [
        ('dhaka', 23.8103, 90.4125),
        ('bay_of_bengal', 21.5, 90.5),
    ]:
        row, col = row_col(lat, lon)
        center = int(data[row, col])
        checks[name] = {
            'latitude': lat,
            'longitude': lon,
            'row': row,
            'col': col,
            'class_code': center,
            'class_name': CLASS_NAMES.get(center, f'Class {center}'),
        }

    metadata = {
        'product': 'MCD12Q1.061',
        'product_long_name': 'MODIS/Terra Land Cover Type Yearly L3 Global 500 m SIN Grid V061',
        'collection': '061',
        'source': 'NASA LP DAAC',
        'source_url': SOURCE_URL,
        'granule': GRANULE,
        'layer': 'LC_Type1 (IGBP classification)',
        'acquisition_year': 2023,
        'acquisition_date': '2023-01-01',
        'spatial_resolution': '500 m x 500 m',
        'temporal_resolution': 'annual',
        'tile': f'h{TILE_H:02d}v{TILE_V:02d}',
        'sampling': (
            'Nearest 500 m MCD12Q1 pixel at each district headquarters coordinate and its '
            '5x5 pixel neighbourhood (2.5 km x 2.5 km). No district-wide area fraction is '
            'computed from this point sample.'
        ),
        'class_legend': {str(k): v for k, v in CLASS_NAMES.items()},
        'caveat': (
            'A 500 m land-cover class can mix urban, cropland and water within one pixel. The '
            'HQ point class describes that pixel, not the whole district. MCD12Q1 is not used '
            'to mask NDVI, LST or ET in this report.'
        ),
        'cropland_mask_classes': [12, 14],
        'cropland_sampling_proposal': (
            'If a cropland-only series is required, exclude classes 13 and 17, retain classes '
            '12 and 14, and sample 5-10 separated 500 m cropland pixels per district or compute '
            'a cropland-area-weighted district mean. This would be a new extraction, not a '
            'correction to the current HQ point series.'
        ),
        'downloaded_at': datetime.fromtimestamp(os.path.getmtime(HDF_PATH), tz=timezone.utc).isoformat(),
        'processed_at': datetime.now(timezone.utc).isoformat(),
        'python': '3.12 (pyhdf 0.11.7)',
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'hq_points': hq, 'checks': checks}, f, indent=2)

    for did, info in hq.items():
        print(
            f"{info['districtName']}: class {info['center_class_code']} "
            f"{info['center_class_name']} at row {info['row']} col {info['col']}; "
            f"5x5 counts {info['neighborhood_5x5_counts']}"
        )
    for name, info in checks.items():
        print(f"check {name}: class {info['class_code']} {info['class_name']}")


if __name__ == '__main__':
    main()
