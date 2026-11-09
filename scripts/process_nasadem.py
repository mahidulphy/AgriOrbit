"""Compute NASADEM mean elevation and mean slope inside district polygons.

Input : data/raw/nasadem/NASADEM_NC_n{lat}e{lon}.nc (native 1 arc-second)
Polygons: data/raw/boundaries/bgd_admin2.geojson (HDX/OCHA COD-AB ADM2)
Output : public/cache/nasadem/{district}.json + nasadem_elevation_slope_summary.json

Zonal statistic = all NASADEM_HGT grid nodes whose location falls inside the
ADM2 polygon. Slope is computed from the 1 arc-second DEM with central
differences and averaged over interior pixels (all four neighbours valid).
Nothing is interpolated or estimated.
"""
import json
import os
import sys
from datetime import datetime, timezone

import numpy as np
import xarray as xr
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_nasadem import district_polygons, bbox  # noqa: E402

M_PER_ARCSEC = 30.87
SLOPE_BIN_WIDTH = 0.01
SLOPE_BINS = int(round(90.0 / SLOPE_BIN_WIDTH))


def hist_median(hist, bin_width=SLOPE_BIN_WIDTH):
    total = float(hist.sum())
    if total <= 0:
        return None
    cum = np.cumsum(hist)
    idx = int(np.searchsorted(cum, total / 2.0))
    idx = min(idx, len(hist) - 1)
    prev = float(cum[idx - 1]) if idx > 0 else 0.0
    within = (total / 2.0 - prev) / float(hist[idx]) if hist[idx] > 0 else 0.0
    return round(idx * bin_width + within * bin_width, 3)


def polygons_of(geometry):
    if geometry['type'] == 'Polygon':
        return [geometry['coordinates']]
    if geometry['type'] == 'MultiPolygon':
        return geometry['coordinates']
    raise ValueError(geometry['type'])


def rasterize(feature, lat_north, lon_west, size=3601):
    img = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(img)
    for poly in polygons_of(feature['geometry']):
        outer = [((x - lon_west) * (size - 1), (lat_north - y) * (size - 1)) for x, y in poly[0]]
        draw.polygon(outer, fill=1)
        for hole in poly[1:]:
            inner = [((x - lon_west) * (size - 1), (lat_north - y) * (size - 1)) for x, y in hole]
            draw.polygon(inner, fill=0)
    mask = np.array(img, dtype=bool)
    # Each NASADEM node is shared by adjacent tiles on the north and east edges.
    mask[0, :] = False
    mask[:, -1] = False
    return mask


def main():
    names, polygons = district_polygons()
    manifest_path = 'data/raw/nasadem/download_manifest.json'
    manifest = json.load(open(manifest_path, encoding='utf-8')) if os.path.exists(manifest_path) else {}

    acc = {
        did: {
            'districtId': did,
            'districtName': names[did],
            'sum_elev': 0.0,
            'n_elev': 0,
            'min_elev': None,
            'max_elev': None,
            'sum_slope': 0.0,
            'n_slope': 0,
            'slope_hist': np.zeros(SLOPE_BINS, dtype=np.int64),
            'slope_hist_area': np.zeros(SLOPE_BINS, dtype=np.float64),
            'n_slope_area_weight': 0.0,
            'n_slope_gt2': 0,
            'n_slope_gt5': 0,
            'slope_area_gt2': 0.0,
            'slope_area_gt5': 0.0,
            'area_m2': 0.0,
            'tiles': set(),
        }
        for did in polygons
    }

    tiles = sorted(manifest.get('granules', []))
    if not tiles:
        raise SystemExit('No NASADEM tiles listed in data/raw/nasadem/download_manifest.json')

    for tile in tiles:
        path = os.path.join('data/raw/nasadem', tile + '.nc')
        if not os.path.exists(path):
            raise SystemExit(f'Missing tile file: {path}')
        ds = xr.open_dataset(path)
        lat_vals = ds['lat'].values
        lon_vals = ds['lon'].values
        elev = ds['NASADEM_HGT'].values.astype(np.float64)
        ds.close()
        lat_north = float(lat_vals[0])
        lat_south = float(lat_vals[-1])
        lon_west = float(lon_vals[0])
        lon_east = float(lon_vals[-1])

        dy = M_PER_ARCSEC
        dx = M_PER_ARCSEC * np.cos(np.radians(lat_vals))
        gy = np.gradient(elev, axis=0) / dy
        gx = np.gradient(elev, axis=1) / dx[:, None]
        slope_deg = np.degrees(np.arctan(np.hypot(gx, gy)))

        # NASADEM carries bathymetric/ocean artefacts over the Bay of Bengal and
        # some rivers; no terrestrial Bangladesh district lies below -10 m.
        valid = np.isfinite(elev) & (elev >= -10.0)
        slope_valid = np.zeros_like(valid)
        slope_valid[1:-1, 1:-1] = (
            valid[1:-1, 1:-1]
            & valid[:-2, 1:-1]
            & valid[2:, 1:-1]
            & valid[1:-1, :-2]
            & valid[1:-1, 2:]
        )

        for did, feature in polygons.items():
            minx, miny, maxx, maxy = bbox(feature['geometry'])
            if maxx < lon_west or minx > lon_east or maxy < lat_south or miny > lat_north:
                continue
            mask = rasterize(feature, lat_north, lon_west)

            elev_mask = mask & valid
            n_elev = int(elev_mask.sum())
            if n_elev:
                a = acc[did]
                a['sum_elev'] += float(elev[elev_mask].sum())
                a['n_elev'] += n_elev
                lo = float(elev[elev_mask].min())
                hi = float(elev[elev_mask].max())
                a['min_elev'] = lo if a['min_elev'] is None else min(a['min_elev'], lo)
                a['max_elev'] = hi if a['max_elev'] is None else max(a['max_elev'], hi)
                counts = elev_mask.sum(axis=1)
                a['area_m2'] += float(np.sum(counts * (dy * dx)))
                a['tiles'].add(tile)

            slope_mask = mask & slope_valid
            n_slope = int(slope_mask.sum())
            if n_slope:
                a = acc[did]
                vals = slope_deg[slope_mask]
                weights = np.broadcast_to(
                    np.cos(np.radians(lat_vals))[:, None], slope_deg.shape
                )[slope_mask]
                a['sum_slope'] += float(vals.sum())
                a['n_slope'] += n_slope
                a['n_slope_area_weight'] += float(weights.sum())
                a['n_slope_gt2'] += int(np.count_nonzero(vals > 2.0))
                a['n_slope_gt5'] += int(np.count_nonzero(vals > 5.0))
                a['slope_area_gt2'] += float(weights[vals > 2.0].sum())
                a['slope_area_gt5'] += float(weights[vals > 5.0].sum())
                bin_idx = np.clip((vals / SLOPE_BIN_WIDTH).astype(np.int64), 0, SLOPE_BINS - 1)
                a['slope_hist'] += np.bincount(bin_idx, minlength=SLOPE_BINS)
                a['slope_hist_area'] += np.bincount(bin_idx, weights=weights, minlength=SLOPE_BINS)
                a['tiles'].add(tile)

        print(f'processed {tile}')

    metadata = {
        'product': 'NASADEM_NC.001',
        'product_long_name': 'NASADEM Merged DEM Global 1 arc second V001',
        'source': 'NASA LP DAAC',
        'source_url': 'https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_NC.001',
        'access_url': 'https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_NC.001/',
        'variable': 'NASADEM_HGT (elevation above WGS84 ellipsoid, metres)',
        'spatial_resolution': '1 arc-second (~30 m)',
        'district_polygons': 'HDX/OCHA COD-AB ADM2 bgd_admin2.geojson (valid_on 2023-05-21)',
        'method': (
            'Mean of NASADEM_HGT nodes whose coordinates fall inside the ADM2 polygon; '
            'slope from central-difference gradients of the 1 arc-second DEM, averaged over '
            'interior pixels with all four neighbours valid. NASADEM values below -10 m are '
            'excluded as ocean/void artefacts (no terrestrial district lies below -10 m); '
            'they are excluded, never replaced. No interpolation or estimation.'
        ),
        'slope_units': 'degrees from horizontal (also reported as percent)',
        'slope_area_weighting': 'cos(latitude), proportional to 30 m pixel area',
        'median_method': 'Area-weighted median from a 0.01-degree slope histogram; unweighted median also stored.',
        'main_erosion_indicator': 'area_pct_slope_gt5_degrees',
        'terrain_caveat': (
            'Slope is a relative terrain indicator, not an absolute erosion rate. In the flat delta, '
            'small slope differences below 2 degrees matter; the share of area above 5 degrees is '
            'reported as the main erosion indicator.'
        ),
        'tile_count': len(tiles),
        'tiles': tiles,
        'downloaded_at': manifest.get('downloaded_at'),
        'processed_at': datetime.now(timezone.utc).isoformat(),
        'districts_count': len(acc),
    }

    summary = {}
    os.makedirs('public/cache/nasadem', exist_ok=True)
    for did, a in acc.items():
        if a['n_elev'] == 0:
            raise SystemExit(f'No NASADEM pixels inside polygon for {did}')
        if a['n_slope'] == 0:
            raise SystemExit(f'No valid slope pixels inside polygon for {did}')
        mean_elev = round(a['sum_elev'] / a['n_elev'], 1)
        mean_slope = round(a['sum_slope'] / a['n_slope'], 3)
        median_slope = hist_median(a['slope_hist_area'])
        median_slope_unweighted = hist_median(a['slope_hist'])
        area_pct_gt2 = round(100.0 * a['slope_area_gt2'] / a['n_slope_area_weight'], 2)
        area_pct_gt5 = round(100.0 * a['slope_area_gt5'] / a['n_slope_area_weight'], 2)
        out = {
            'districtId': did,
            'districtName': a['districtName'],
            'mean_elevation_m': mean_elev,
            'min_elevation_m': round(a['min_elev'], 1),
            'max_elevation_m': round(a['max_elev'], 1),
            'mean_slope_degrees': mean_slope,
            'mean_slope_percent': round(float(np.tan(np.radians(mean_slope)) * 100), 2),
            'median_slope_degrees': median_slope,
            'median_slope_degrees_unweighted': median_slope_unweighted,
            'median_slope_percent': round(float(np.tan(np.radians(median_slope)) * 100), 2) if median_slope is not None else None,
            'area_pct_slope_gt2_degrees': area_pct_gt2,
            'area_pct_slope_gt5_degrees': area_pct_gt5,
            'pixel_pct_slope_gt2_degrees': round(100.0 * a['n_slope_gt2'] / a['n_slope'], 2),
            'pixel_pct_slope_gt5_degrees': round(100.0 * a['n_slope_gt5'] / a['n_slope'], 2),
            'main_erosion_indicator': 'area_pct_slope_gt5_degrees',
            'elevation_pixel_count': a['n_elev'],
            'slope_pixel_count': a['n_slope'],
            'sampled_area_km2': round(a['area_m2'] / 1e6, 2),
            'tiles': sorted(a['tiles']),
        }
        summary[did] = {k: v for k, v in out.items() if k != 'tiles'}
        with open(f'public/cache/nasadem/{did}.json', 'w', encoding='utf-8') as f:
            json.dump({'_metadata': metadata, **out}, f, indent=2)

    with open('public/cache/nasadem/nasadem_elevation_slope_summary.json', 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'districts': summary}, f, indent=2)

    print('\nNASADEM zonal statistics complete')
    for did in ['rangpur', 'rajshahi', 'sylhet']:
        d = summary[did]
        print(
            f"{d['districtName']}: mean elevation {d['mean_elevation_m']} m, "
            f"mean slope {d['mean_slope_degrees']} deg, median {d['median_slope_degrees']} deg, "
            f">2 deg {d['area_pct_slope_gt2_degrees']}% area, "
            f">5 deg {d['area_pct_slope_gt5_degrees']}% area, "
            f"{d['elevation_pixel_count']} pixels, {d['sampled_area_km2']} km2"
        )


if __name__ == '__main__':
    main()
