"""Backfill daily GPM IMERG precipitation for all 64 district headquarters.

Product choice follows the Phase 10 rule "Late, or Final where available":
  * GPM_3IMERGDF.07 (Final, V07B) for 2001-01-01 .. 2025-09-30
  * GPM_3IMERGDL.07 (Late,  V07C) for 2025-10-01 .. the rolling-window end

The script checkpoints one JSON line per fetched date in
data/raw/gpm/history/points.jsonl and resumes without re-downloading.
If any date fails after retries, the run stops with the exact error and the
final public cache is not overwritten.

Outputs:
  public/cache/gpm/history/{district}.json
  public/cache/gpm/gpm_history_summary.json
"""
import argparse
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import numpy as np
import requests
from dotenv import dotenv_values

from district_meta import load_district_points

FINAL_PRODUCT = 'GPM_3IMERGDF.07'
LATE_PRODUCT = 'GPM_3IMERGDL.07'
FINAL_END = '2025-09-30'
FINAL_VERSION = 'V07B'
LATE_VERSION = 'V07C'
GES_BASE = 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3'

LON_START_IDX, LON_END_IDX = 2680, 2727
LAT_START_IDX, LAT_END_IDX = 1105, 1167
GRID_LONS = [round(88.05 + 0.1 * i, 2) for i in range(LON_END_IDX - LON_START_IDX + 1)]
GRID_LATS = [round(20.55 + 0.1 * i, 2) for i in range(LAT_END_IDX - LAT_START_IDX + 1)]

CHECKPOINT = 'data/raw/gpm/history/points.jsonl'


def credentials():
    cfg = dotenv_values('.env.local')
    user = os.environ.get('EARTHDATA_USERNAME') or cfg.get('EARTHDATA_USERNAME')
    pwd = os.environ.get('EARTHDATA_PASSWORD') or cfg.get('EARTHDATA_PASSWORD')
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
        if 'earthdata.nasa.gov' in prepared_request.url:
            prepared_request.headers['Authorization'] = requests.auth._basic_auth_str(self._user, self._pwd)


_local = threading.local()
USER, PWD = credentials()


def session():
    if not hasattr(_local, 's'):
        _local.s = EarthdataSession(USER, PWD)
    return _local.s


def product_for(date):
    return FINAL_PRODUCT if date <= FINAL_END else LATE_PRODUCT


def url_for(date):
    product = product_for(date)
    ymd = date.replace('-', '')
    year, month = date[:4], date[5:7]
    if product == FINAL_PRODUCT:
        name = f'3B-DAY.MS.MRG.3IMERG.{ymd}-S000000-E235959.{FINAL_VERSION}.nc4.ascii'
    else:
        name = f'3B-DAY-L.MS.MRG.3IMERG.{ymd}-S000000-E235959.{LATE_VERSION}.nc4.ascii'
    constraint = f'precipitation[0:0][{LON_START_IDX}:{LON_END_IDX}][{LAT_START_IDX}:{LAT_END_IDX}]'
    return f'{GES_BASE}/{product}/{year}/{month}/{name}?{constraint}'


def parse_grid(text):
    grid = []
    for line in text.strip().split('\n'):
        line = line.strip()
        if 'precipitation.precipitation[' in line:
            parts = line.split(',')
            grid.append([float(x.strip()) for x in parts[1:]])
    if len(grid) != len(GRID_LONS):
        raise ValueError(f'expected {len(GRID_LONS)} longitude rows, got {len(grid)}')
    arr = np.array(grid)
    if arr.shape != (len(GRID_LONS), len(GRID_LATS)):
        raise ValueError(f'expected shape {(len(GRID_LONS), len(GRID_LATS))}, got {arr.shape}')
    if np.isnan(arr).any() or (arr < -1).any():
        raise ValueError('fill or negative precipitation values in slice')
    return arr


def fetch_date(date, district_grid_pos, retries=4):
    url = url_for(date)
    last = None
    for attempt in range(retries):
        try:
            r = session().get(url, timeout=60)
            if r.status_code != 200:
                last = f'HTTP {r.status_code}'
                if r.status_code in (429, 500, 502, 503, 504):
                    time.sleep(2 ** attempt)
                    continue
                raise RuntimeError(last)
            arr = parse_grid(r.text)
            values = {}
            for did, (lon_idx, lat_idx) in district_grid_pos.items():
                values[did] = round(max(0.0, float(arr[lon_idx, lat_idx])), 2)
            return {
                'date': date,
                'product': product_for(date),
                'values': values,
            }
        except Exception as exc:
            last = f'{type(exc).__name__}: {exc}'
            time.sleep(1 + attempt)
    raise RuntimeError(f'{date} ({product_for(date)}) failed after {retries} attempts: {last}')


def date_range(start, end):
    d = datetime.strptime(start, '%Y-%m-%d').date()
    e = datetime.strptime(end, '%Y-%m-%d').date()
    out = []
    while d <= e:
        out.append(d.isoformat())
        d += timedelta(days=1)
    return out


def load_checkpoint():
    done = {}
    if not os.path.exists(CHECKPOINT):
        return done
    with open(CHECKPOINT, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            if rec.get('date'):
                done[rec['date']] = rec
    return done


def append_checkpoint(records):
    os.makedirs(os.path.dirname(CHECKPOINT), exist_ok=True)
    with open(CHECKPOINT, 'a', encoding='utf-8') as f:
        for rec in records:
            f.write(json.dumps(rec, separators=(',', ':')) + '\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', default='2001-01-01')
    parser.add_argument('--end', default=None,
                        help='default: today UTC minus 2 days (same as the rolling cache)')
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()

    end = args.end or (datetime.now(timezone.utc) - timedelta(days=2)).date().isoformat()
    dates = date_range(args.start, end)
    districts = load_district_points()
    grid_lons = np.array(GRID_LONS)
    grid_lats = np.array(GRID_LATS)
    district_grid_pos = {}
    for d in districts:
        district_grid_pos[d['id']] = (
            int(np.argmin(np.abs(grid_lons - d['lon']))),
            int(np.argmin(np.abs(grid_lats - d['lat']))),
        )

    done = load_checkpoint()
    pending = [d for d in dates if d not in done]
    print(f'Requested {len(dates)} days ({dates[0]}..{dates[-1]}); '
          f'{len(done)} checkpointed; {len(pending)} to fetch.')

    batch_size = max(args.workers * 4, 8)
    try:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for i in range(0, len(pending), batch_size):
                batch = pending[i:i + batch_size]
                records = list(pool.map(
                    lambda d: fetch_date(d, district_grid_pos), batch))
                append_checkpoint(records)
                done.update({r['date']: r for r in records})
                batch_no = i // batch_size
                if batch_no % 10 == 0 or i + len(batch) >= len(pending):
                    print(f'  {min(i + len(batch), len(pending))}/{len(pending)} fetched', flush=True)
    except Exception as exc:
        raise SystemExit(f'GPM history backfill aborted: {exc}. '
                         f'Checkpoint retained at {CHECKPOINT}.')

    missing = [d for d in dates if d not in done]
    if missing:
        raise SystemExit(f'GPM history incomplete; missing dates: {missing[:10]}'
                         f'{"..." if len(missing) > 10 else ""}')

    points = {d['id']: d for d in districts}
    series_by = {d['id']: [] for d in districts}
    for date in dates:
        rec = done[date]
        for did, val in rec['values'].items():
            series_by[did].append({'date': date, 'precip_mm': val})

    final_dates = [d for d in dates if d <= FINAL_END]
    late_dates = [d for d in dates if d > FINAL_END]
    metadata = {
        'product': f'{FINAL_PRODUCT} (Final) + {LATE_PRODUCT} (Late)',
        'product_long_name': (
            'GPM IMERG Final/Late Precipitation L3 1 day 0.1 degree x 0.1 degree V07'
        ),
        'final_product': FINAL_PRODUCT,
        'final_version': FINAL_VERSION,
        'final_period': [final_dates[0], final_dates[-1]] if final_dates else None,
        'late_product': LATE_PRODUCT,
        'late_version': LATE_VERSION,
        'late_period': [late_dates[0], late_dates[-1]] if late_dates else None,
        'source': 'NASA GES DISC',
        'source_url': f'{GES_BASE}/',
        'variable': 'precipitation (daily accumulated liquid-equivalent precipitation in mm)',
        'spatial_resolution': '0.1 degree x 0.1 degree (~10 km)',
        'sampling': (
            'Nearest 0.1 degree IMERG grid cell to each district headquarters coordinate '
            '(docs/data/district_points.csv); no area aggregation.'
        ),
        'date_range': [dates[0], dates[-1]],
        'days_count': len(dates),
        'negative_value_handling': (
            'Negative IMERG retrieval values are set to 0.0; no other adjustment, '
            'smoothing, gap filling or interpolation is applied.'
        ),
        'checkpoint_file': CHECKPOINT,
        'processed_at': datetime.now(timezone.utc).isoformat(),
        'districts_count': len(districts),
    }

    out_dir = 'public/cache/gpm/history'
    os.makedirs(out_dir, exist_ok=True)
    summary = {}
    for did, d in points.items():
        series = series_by[did]
        extreme = sum(1 for o in series if o['precip_mm'] >= 50.0)
        total = round(sum(o['precip_mm'] for o in series), 1)
        summary[did] = {
            'districtId': did,
            'districtName': d['name'],
            'coordinates': {'latitude': d['lat'], 'longitude': d['lon']},
            'first_date': series[0]['date'],
            'latest_date': series[-1]['date'],
            'days_count': len(series),
            'total_precip_mm': total,
            'extreme_rain_days_count': extreme,
            'extreme_rain_threshold_mm': 50.0,
        }
        with open(os.path.join(out_dir, f'{did}.json'), 'w', encoding='utf-8') as f:
            json.dump({
                '_metadata': metadata,
                'districtId': did,
                'districtName': d['name'],
                'coordinates': {'latitude': d['lat'], 'longitude': d['lon']},
                'series_length': len(series),
                'first_date': series[0]['date'],
                'latest_date': series[-1]['date'],
                'extreme_rain_days_count': extreme,
                'extreme_rain_threshold_mm': 50.0,
                'total_precip_mm': total,
                'daily_series': series,
            }, f, indent=2)

    with open('public/cache/gpm/gpm_history_summary.json', 'w', encoding='utf-8') as f:
        json.dump({'_metadata': metadata, 'districts': summary}, f, indent=2)

    print(f'Wrote full daily history for {len(points)} districts to {out_dir}/')
    for did in ['rangpur', 'rajshahi', 'sylhet']:
        s = summary[did]
        print(f"  {s['districtName']}: {s['days_count']} days, total {s['total_precip_mm']} mm, "
              f"{s['extreme_rain_days_count']} days >= 50 mm, latest {s['latest_date']}")


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
