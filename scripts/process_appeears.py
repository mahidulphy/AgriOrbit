"""Process downloaded AppEEARS bundles into public/cache JSON.

Supported tasks:
  ecostress : ECO_L3T_JET.002 (ETdaily, PTJPLSMinst) + ECO_L2T_LSTE.002 (LST, QC, cloud)
  mod13q1   : MOD13Q1.061 Terra NDVI 16-day 250 m
  myd13q1   : MYD13Q1.061 Aqua  NDVI 16-day 250 m

No interpolation is applied. ECOSTRESS revisits stay discrete. MODIS values
are the published 16-day composites, with pixel reliability retained.
"""
import csv
import json
import math
import os
import sys
from datetime import datetime, timezone

from district_meta import load_district_points

try:
    from zoneinfo import ZoneInfo
    DHAKA_TZ = ZoneInfo('Asia/Dhaka')
except Exception:
    from datetime import timedelta
    DHAKA_TZ = timezone(timedelta(hours=6))

RAW = 'data/raw/appeears'
OUT_ECO = 'public/cache/ecostress'
OUT_NDVI = 'public/cache/modis_ndvi'

ECO_TASK = 'eb4fcd8a-53bd-4707-b8ba-7991d7e78960'
MOD_TASK = '681b0ec9-0e86-4f27-8f5e-39d38ce2c014'
MYD_TASK = '82e2e7e6-c38e-4210-92e5-8e470bd23e0f'

def downloaded_at(path):
    return datetime.fromtimestamp(os.path.getmtime(path), tz=timezone.utc).isoformat()


def read_csv(path):
    with open(path, encoding='utf-8') as f:
        return list(csv.DictReader(f))


def write_json(path, payload):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2)


def num(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() == 'none':
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_utc(stamp):
    text = stamp.strip()
    if text.endswith(' UTC'):
        text = text[:-4].strip()
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S'):
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise ValueError(f'Unrecognised ECOSTRESS timestamp: {stamp!r}')


def solar_elevation_deg(dt_utc, lat, lon):
    jd = dt_utc.timestamp() / 86400.0 + 2440587.5
    n = jd - 2451545.0
    mean_lon = (280.460 + 0.9856474 * n) % 360.0
    mean_anom = math.radians((357.528 + 0.9856003 * n) % 360.0)
    ecliptic_lon = math.radians(
        (mean_lon + 1.915 * math.sin(mean_anom) + 0.020 * math.sin(2 * mean_anom)) % 360.0
    )
    obliquity = math.radians(23.439 - 0.0000004 * n)
    right_ascension = math.atan2(
        math.cos(obliquity) * math.sin(ecliptic_lon), math.cos(ecliptic_lon)
    )
    declination = math.asin(math.sin(obliquity) * math.sin(ecliptic_lon))
    gmst_hours = (18.697374558 + 24.06570982441908 * n) % 24.0
    local_sidereal = math.radians((gmst_hours * 15.0 + lon) % 360.0)
    hour_angle = local_sidereal - right_ascension
    lat_rad = math.radians(lat)
    altitude = math.asin(
        math.sin(lat_rad) * math.sin(declination)
        + math.cos(lat_rad) * math.cos(declination) * math.cos(hour_angle)
    )
    return math.degrees(altitude)


def observation_time_fields(stamp, lat, lon):
    dt_utc = parse_utc(stamp)
    dt_local = dt_utc.astimezone(DHAKA_TZ)
    elevation = round(solar_elevation_deg(dt_utc, lat, lon), 1)
    return {
        'datetime_utc': dt_utc.isoformat(timespec='seconds'),
        'date': dt_utc.date().isoformat(),
        'datetime_local': dt_local.isoformat(timespec='seconds'),
        'local_time': dt_local.strftime('%H:%M'),
        'solar_elevation_deg': elevation,
        'day_night': 'day' if elevation > 0 else 'night',
    }


def process_ecostress():
    et_path = os.path.join(RAW, 'ecostress', 'agriorbit-ecostress-bd-districts-ECO-L3T-JET-002-results.csv')
    lst_path = os.path.join(RAW, 'ecostress', 'agriorbit-ecostress-bd-districts-ECO-L2T-LSTE-002-results.csv')
    if not (os.path.exists(et_path) and os.path.exists(lst_path)):
        print('ECOSTRESS bundles missing; skipping')
        return

    et_rows = read_csv(et_path)
    lst_rows = read_csv(lst_path)
    print(f'ECOSTRESS raw rows: ET {len(et_rows)}, LST {len(lst_rows)}')

    points = {d['id']: d for d in load_district_points()}
    et_by = {}
    et_rejected = 0
    for r in et_rows:
        did = (r.get('ID') or '').strip().lower()
        stamp = (r.get('Date') or '').strip()
        et_w = num(r.get('ECO_L3T_JET_002_ETdaily'))
        pt_inst = num(r.get('ECO_L3T_JET_002_PTJPLSMinst'))
        if not did or not stamp or et_w is None:
            et_rejected += 1
            continue
        if not (0.0 <= et_w <= 100.0):
            et_rejected += 1
            continue
        point = points.get(did, {})
        lat = num(r.get('Latitude'))
        lon = num(r.get('Longitude'))
        lat = point.get('lat') if lat is None else lat
        lon = point.get('lon') if lon is None else lon
        if lat is None or lon is None:
            et_rejected += 1
            continue
        try:
            time_fields = observation_time_fields(stamp, lat, lon)
        except ValueError:
            et_rejected += 1
            continue
        et_by.setdefault(did, []).append({
            **time_fields,
            'et_daily_mm_per_day': round(et_w, 3),
            'ptjplsm_instantaneous_w_m2': round(pt_inst, 2) if pt_inst is not None else None,
        })

    lst_by = {}
    lst_rejected = 0
    for r in lst_rows:
        did = (r.get('ID') or '').strip().lower()
        stamp = (r.get('Date') or '').strip()
        lst_k = num(r.get('ECO_L2T_LSTE_002_LST'))
        cloud_mask = (r.get('ECO_L2T_LSTE_002_cloud_Cloud_Mask_Description') or '').strip()
        l1b_quality = (r.get('ECO_L2T_LSTE_002_QC_Data_quality_flag_Description') or '').strip()
        mandatory_qa = (r.get('ECO_L2T_LSTE_002_QC_Mandatory_QA_flags_Description') or '').strip()
        lst_accuracy = (r.get('ECO_L2T_LSTE_002_QC_LST_accuracy_Description') or '').strip()
        if not did or not stamp or lst_k is None:
            lst_rejected += 1
            continue
        if cloud_mask != 'Clear':
            lst_rejected += 1
            continue
        if l1b_quality != 'Good quality L1B data':
            lst_rejected += 1
            continue
        if not mandatory_qa.startswith('Pixel produced by TES'):
            lst_rejected += 1
            continue
        if lst_accuracy.startswith('>2 K'):
            lst_rejected += 1
            continue
        if not (250.0 < lst_k < 350.0):
            lst_rejected += 1
            continue
        point = points.get(did, {})
        lat = num(r.get('Latitude'))
        lon = num(r.get('Longitude'))
        lat = point.get('lat') if lat is None else lat
        lon = point.get('lon') if lon is None else lon
        if lat is None or lon is None:
            lst_rejected += 1
            continue
        try:
            time_fields = observation_time_fields(stamp, lat, lon)
        except ValueError:
            lst_rejected += 1
            continue
        lst_by.setdefault(did, []).append({
            **time_fields,
            'lst_celsius': round(lst_k - 273.15, 2),
            'lst_accuracy': lst_accuracy,
            'l1b_quality': l1b_quality,
            'cloud_mask': cloud_mask,
        })

    metadata = {
        'source': 'NASA LP DAAC via AppEEARS',
        'source_url': f'https://appeears.earthdatacloud.nasa.gov/api/task/{ECO_TASK}',
        'et_product': 'ECO_L3T_JET.002',
        'et_product_long_name': 'ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m v002',
        'et_collection': '002',
        'et_doi': 'https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002',
        'lst_product': 'ECO_L2T_LSTE.002',
        'lst_product_long_name': 'ECOSTRESS Tiled Land Surface Temperature and Emissivity Instantaneous L2 Global 70 m v002',
        'lst_collection': '002',
        'lst_doi': 'https://doi.org/10.5067/ECOSTRESS/ECO_L2T_LSTE.002',
        'platform': 'International Space Station (ISS)',
        'spatial_resolution': '70 m x 70 m',
        'period': '2019-01-01 to 2026-11-08',
        'sampling': 'Point extraction at each district headquarters coordinate; one 70 m pixel per overpass.',
        'temporal_note': (
            'ECOSTRESS has a non-sun-synchronous, precessing ISS orbit; revisit times are irregular and '
            'vary from hours to days. Discrete observations are kept as-is; no temporal interpolation.'
        ),
        'timezone': 'Asia/Dhaka (UTC+06:00; Bangladesh has no daylight saving)',
        'solar_elevation_method': (
            'NOAA approximate solar position from UTC timestamp and overpass latitude/longitude; '
            'used only for the day/night flag.'
        ),
        'day_night_rule': 'solar_elevation_deg > 0 = day; solar_elevation_deg <= 0 = night.',
        'lst_daytime_series_note': (
            'lst_series_daytime contains only LST observations with solar elevation > 0. The full '
            'lst_series retains both day and night overpasses; no interpolation.'
        ),
        'et_day_night_note': (
            'ETdaily is a daylight-integrated daily product; the day/night flag describes the '
            'overpass timestamp, not the ET integration window.'
        ),
        'units': {
            'et_daily_mm_per_day': (
                'mm/day (native ECO_L3T_JET.002 ETdaily; LP DAAC ECO_L2-4 Grid Tile User Guide '
                'V2 section 5.4 defines ETdaily as the daily integrated ET in millimeters per day)'
            ),
            'ptjplsm_instantaneous_w_m2': 'W/m2 (native instantaneous PT-JPL-SM ET)',
            'lst_celsius': 'degrees C (converted from native Kelvin)',
        },
        'unit_note': (
            'The Earthdata catalog table labels ETdaily as W/m2, but the LP DAAC User Guide V2 '
            'section 5.4 defines ETdaily as the daily ET integrated over daylight hours in mm/day. '
            'The downloaded values (0-5.93, median 1.86) are consistent with mm/day. Native values '
            'are reported as mm/day without rescaling.'
        ),
        'qc_rules': {
            'et': 'ETdaily retained when 0 <= ETdaily <= 100 mm/day; no QC layer exists in ECO_L3T_JET.002.',
            'lst': (
                'LST retained only when cloud mask is Clear, L1B data quality is Good, the mandatory '
                'QA flag confirms the pixel was produced by TES, LST accuracy is not ">2 K (poor)", '
                'and 250 K < LST < 350 K.'
            ),
            'et_rows_rejected': et_rejected,
            'lst_rows_rejected': lst_rejected,
        },
        'downloaded_at': max(downloaded_at(et_path), downloaded_at(lst_path)),
        'processed_at': datetime.now(timezone.utc).isoformat(),
    }

    all_ids = sorted(set(et_by) | set(lst_by))
    summary = {}
    for did in all_ids:
        et_series = sorted(et_by.get(did, []), key=lambda x: x['datetime_utc'])
        lst_series = sorted(lst_by.get(did, []), key=lambda x: x['datetime_utc'])
        lst_series_daytime = [o for o in lst_series if o['day_night'] == 'day']
        point = points.get(did, {})
        location = {
            'latitude': point.get('lat'),
            'longitude': point.get('lon'),
        }
        out = {
            'districtId': did,
            'districtName': point.get('name'),
            'coordinates': location,
            'et_observations_count': len(et_series),
            'lst_observations_count': len(lst_series),
            'et_observations_daytime_count': sum(1 for o in et_series if o['day_night'] == 'day'),
            'lst_observations_daytime_count': len(lst_series_daytime),
            'latest_et': et_series[-1] if et_series else None,
            'latest_lst': lst_series[-1] if lst_series else None,
            'latest_daytime_lst': lst_series_daytime[-1] if lst_series_daytime else None,
            'et_series': et_series,
            'lst_series': lst_series,
            'lst_series_daytime': lst_series_daytime,
        }
        summary[did] = {
            k: v for k, v in out.items()
            if not k.endswith('_series') and k != 'lst_series_daytime'
        }
        write_json(os.path.join(OUT_ECO, f'{did}.json'), {'_metadata': metadata, **out})

    write_json(os.path.join(OUT_ECO, 'ecostress_summary.json'), {'_metadata': metadata, 'districts': summary})
    print(f'Wrote ECOSTRESS cache for {len(all_ids)} districts to {OUT_ECO}/')


def modis_metadata(product, task_id, long_name, period):
    return {
        'product': product,
        'product_long_name': long_name,
        'collection': '061',
        'source': 'NASA LP DAAC via AppEEARS',
        'source_url': f'https://appeears.earthdatacloud.nasa.gov/api/task/{task_id}',
        'spatial_resolution': '250 m',
        'temporal_resolution': '16-day composite',
        'period_requested': period,
        'sampling': 'Point extraction at each district headquarters coordinate; native 250 m MODIS pixel.',
        'date_label_note': (
            'Dates are MODIS 16-day composite start dates as delivered by AppEEARS. The first and last '
            'composites can extend beyond the requested start/end because composites overlap those boundaries.'
        ),
        'qa_rule': (
            'pixel_reliability 0 (good) and 1 (marginal) are marked valid; 2 (snow/ice) and '
            '3 (cloudy) are retained in the series with valid=false and excluded from latest_valid. '
            'Composite dates with no usable source value are listed as missing, never filled.'
        ),
        'units': 'NDVI, dimensionless (MODIS scale factor 0.0001 already applied by AppEEARS)',
    }


def process_modis(csv_path, product, folder, task_id, long_name, period):
    if not os.path.exists(csv_path):
        print(f'{product} bundle missing; skipping')
        return None
    rows = read_csv(csv_path)
    print(f'{product} raw rows: {len(rows)}')
    by = {}
    for r in rows:
        did = (r.get('ID') or '').strip().lower()
        date = (r.get('Date') or '').strip()[:10]
        ndvi = num(r.get(f'{product}_061__250m_16_days_NDVI'))
        qa = num(r.get(f'{product}_061__250m_16_days_pixel_reliability'))
        if not did or not date or ndvi is None:
            continue
        if ndvi < -0.2 or ndvi > 1.0:
            continue
        qa_int = int(qa) if qa is not None else 3
        by.setdefault(did, []).append({
            'date': date,
            'ndvi': round(ndvi, 4),
            'pixel_reliability': qa_int,
            'valid': qa_int in (0, 1),
        })

    meta = modis_metadata(product, task_id, long_name, period)
    meta['downloaded_at'] = downloaded_at(csv_path)
    meta['processed_at'] = datetime.now(timezone.utc).isoformat()

    points = {d['id']: d for d in load_district_points()}
    out_dir = os.path.join(OUT_NDVI, folder)
    all_dates = sorted({o['date'] for series in by.values() for o in series})
    summary = {}
    for did, series in sorted(by.items()):
        series.sort(key=lambda x: x['date'])
        valid = [o for o in series if o['valid']]
        district_dates = {o['date'] for o in series}
        missing_dates = [d for d in all_dates if d not in district_dates]
        point = points.get(did, {})
        location = {
            'latitude': point.get('lat'),
            'longitude': point.get('lon'),
        }
        summary[did] = {
            'districtId': did,
            'districtName': point.get('name'),
            'coordinates': location,
            'total_steps': len(series),
            'expected_steps': len(all_dates),
            'missing_dates_count': len(missing_dates),
            'missing_dates': missing_dates,
            'valid_steps': len(valid),
            'first_date': series[0]['date'],
            'latest_date': series[-1]['date'],
            'latest_valid_date': valid[-1]['date'] if valid else None,
            'latest_valid_ndvi': valid[-1]['ndvi'] if valid else None,
        }
        write_json(os.path.join(out_dir, f'{did}.json'), {
            '_metadata': meta,
            'districtId': did,
            'districtName': point.get('name'),
            'coordinates': location,
            'series_length': len(series),
            'expected_series_length': len(all_dates),
            'missing_composite_dates': missing_dates,
            'valid_series_length': len(valid),
            'time_series': series,
        })

    write_json(os.path.join(out_dir, f'{folder}_summary.json'), {'_metadata': meta, 'districts': summary})
    print(f'Wrote {product} NDVI cache for {len(summary)} districts to {out_dir}/')
    return summary


def main():
    process_ecostress()
    process_modis(
        os.path.join(RAW, 'mod13q1', 'agriorbit-mod13q1-timeseries-bd-districts-MOD13Q1-061-results.csv'),
        'MOD13Q1', 'mod13q1', MOD_TASK,
        'MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061',
        '2001-01-01 to 2026-11-08',
    )
    process_modis(
        os.path.join(RAW, 'myd13q1', 'agriorbit-myd13q1-timeseries-bd-districts-MYD13Q1-061-results.csv'),
        'MYD13Q1', 'myd13q1', MYD_TASK,
        'MODIS/Aqua Vegetation Indices 16-Day L3 Global 250m SIN Grid V061',
        '2002-07-04 to 2026-11-08',
    )


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
