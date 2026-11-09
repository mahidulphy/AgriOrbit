"""Build the Phase 10 data report for Rangpur, Rajshahi and Sylhet from cache."""
import json
import os
import sys
from datetime import datetime, timezone

DISTRICTS = ['rangpur', 'rajshahi', 'sylhet']
OUT = 'docs/reports/phase10_data_report.md'


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def fmt(value, digits=2, suffix=''):
    if value is None:
        return 'n/a'
    return f'{value:.{digits}f}{suffix}'


def local_stamp(obs):
    if not obs:
        return 'n/a'
    return obs['datetime_local'][:16].replace('T', ' ')


def trend_text(trend):
    if not trend:
        return 'n/a'
    se = trend.get('standard_error_cm_per_year')
    if se is None:
        return f"{trend['slope_cm_per_year']:+.2f}"
    return f"{trend['slope_cm_per_year']:+.2f} ± {se:.2f}"


def power_daily(district_id):
    path = f'public/cache/{district_id}.json'
    if not os.path.exists(path):
        return {}
    payload = load(path)
    raw = payload.get('daily', {}).get('PRECTOTCORR', {})
    out = {}
    for key, value in raw.items():
        date = f'{key[:4]}-{key[4:6]}-{key[6:8]}' if len(key) == 8 and key.isdigit() else key
        out[date] = value
    return out


def main():
    gpm = {d: load(f'public/cache/gpm/{d}.json') for d in DISTRICTS}
    nasadem = {d: load(f'public/cache/nasadem/{d}.json') for d in DISTRICTS}
    grace_summary = load('public/cache/grace/grace_summary.json')
    grace_regions = load('public/cache/grace/grace_regions.json')
    eco = {d: load(f'public/cache/ecostress/{d}.json') for d in DISTRICTS}
    mod = {d: load(f'public/cache/modis_ndvi/mod13q1/{d}.json') for d in DISTRICTS}
    landcover = load('public/cache/landcover/mcd12q1_hq.json')
    myd = {}
    for d in DISTRICTS:
        path = f'public/cache/modis_ndvi/myd13q1/{d}.json'
        if os.path.exists(path):
            myd[d] = load(path)
    history = {}
    for d in DISTRICTS:
        path = f'public/cache/gpm/history/{d}.json'
        if os.path.exists(path):
            history[d] = load(path)

    lines = []
    add = lines.append
    add('# Phase 10 — NASA Earth Observation Ingest')
    add('')
    add(f'Generated: {datetime.now(timezone.utc).isoformat()}')
    add('')
    add('Target districts: Rangpur, Rajshahi, Sylhet (all 64 districts are cached).')
    add('')
    add('> All values below come from downloaded NASA products. No value is estimated, '
        'interpolated, or synthesized. Where a source has no value, the report says so.')
    add('')

    add('## 1. GPM IMERG daily precipitation')
    add('')
    gmeta = next(iter(gpm.values()))['_metadata']
    add(f"- Rolling product: `{gmeta['product']}` ({gmeta['version']})")
    add(f"- Run: {gmeta['run_type']}")
    add(f"- Resolution: {gmeta['spatial_resolution']}; sampling: {gmeta['sampling']}")
    add(f"- Rolling window: {gmeta['window_start']} to {gmeta['window_end']} "
        f"({gpm['rangpur']['days_count']} days)")
    add(f"- Grid dimensions: `{gmeta['grid_dimensions']}`; selection: `{gmeta['dimension_order_note']}`")
    add(f"- Full-history status: {'ingested' if history else 'NOT YET INGESTED (rolling 30-day cache only)'}")
    add('')
    add('| District | HQ latitude | HQ longitude | Nearest 0.1° cell | Absolute lon index | '
        'Absolute lat index | GPM cell centre used |')
    add('|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        x = gpm[d]
        add(f"| {x['districtName']} | {x['latitude']:.4f} | {x['longitude']:.4f} | "
            f"{x['grid_cell_lat']:.2f}, {x['grid_cell_lon']:.2f} | {x['grid_lon_index']} | "
            f"{x['grid_lat_index']} | {x['grid_cell_lat']:.2f}N, {x['grid_cell_lon']:.2f}E |")
    add('')
    add('The IMERG array is ordered `precipitation(time, lon, lat)`; district values are read as '
        '`arr[lon_index, lat_index]`, not `arr[lat_index, lon_index]`. The slice covers 48 longitude '
        'columns and 63 latitude values. The exact absolute indices are recorded in each district JSON.')
    add('')
    add('| District | GPM 30-day total (mm) | POWER 30-day total (mm) | POWER window | '
        'GPM same-window (mm) | POWER same-window (mm) | Difference, same window (mm) | '
        'Days in same window | Extreme days >= 50 mm (30 d) |')
    add('|---|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        x = gpm[d]
        add(f"| {x['districtName']} | {fmt(x['gpm_30d_total_mm'], 1)} | "
            f"{fmt(x['power_30d_total_mm'], 1)} | {x['power_30d_window'][0]} to {x['power_30d_window'][1]} | "
            f"{fmt(x['gpm_same_window_total_mm'], 1)} | {fmt(x['power_same_window_total_mm'], 1)} | "
            f"{fmt(x['difference_same_window_mm'], 1)} | {x['power_same_window_days']} | "
            f"{x['extreme_rain_days_count']} |")
    add('')
    add('The same-window columns compare GPM and POWER only on dates present in both sources; '
        'POWER daily data ends 2026-11-05 while GPM ends 2026-11-07. The POWER 30-day column is '
        'POWER\'s own last-30-day window and is not the same period.')
    add('')
    add('On 28–30 October, GPM recorded 22.74, 39.70 and 14.24 mm in Rangpur, while POWER recorded '
        '0.00, 0.20 and 2.08 mm on the same dates. **POWER did not capture this event.**')
    add('')
    add('### GPM vs POWER daily values, 9 October–5 November 2026')
    add('')
    gpm_series = {
        d: {p['date']: p['precip_mm'] for p in gpm[d]['daily_series']}
        for d in DISTRICTS
    }
    power_series = {d: power_daily(d) for d in DISTRICTS}
    dates = [
        p['date'] for p in gpm['rangpur']['daily_series']
        if '2026-10-09' <= p['date'] <= '2026-11-05'
    ]
    add('| Date | Rangpur GPM | Rangpur POWER | Rajshahi GPM | Rajshahi POWER | '
        'Sylhet GPM | Sylhet POWER |')
    add('|---|---|---|---|---|---|---|')
    for date in dates:
        cells = [date]
        for d in DISTRICTS:
            cells.append(fmt(gpm_series[d].get(date), 2))
            power_value = power_series[d].get(date)
            cells.append('n/a' if power_value is None or power_value < -900 else fmt(power_value, 2))
        add('| ' + ' | '.join(cells) + ' |')
    add('')
    add('All values are mm/day. GPM values are the downloaded IMERG Late daily accumulation; '
        'POWER values are the downloaded `PRECTOTCORR` daily values. Blank or `-999` POWER values '
        'are shown as `n/a`, not replaced.')
    add('')
    if history:
        add('### Full daily history (2001-present)')
        add('')
        hmeta = next(iter(history.values()))['_metadata']
        add(f"- Final Run period: {hmeta['final_period'][0]} to {hmeta['final_period'][1]} "
            f"(`{hmeta['final_product']}`, {hmeta['final_version']})")
        add(f"- Late Run period: {hmeta['late_period'][0]} to {hmeta['late_period'][1]} "
            f"(`{hmeta['late_product']}`, {hmeta['late_version']})")
        add('')
        add('| District | Days | First date | Latest date | Total (mm) | Extreme days >= 50 mm |')
        add('|---|---|---|---|---|---|')
        for d in DISTRICTS:
            x = history[d]
            add(f"| {x['districtName']} | {x['series_length']} | {x['first_date']} | "
                f"{x['latest_date']} | {fmt(x['total_precip_mm'], 1)} | "
                f"{x['extreme_rain_days_count']} |")
        add('')
    else:
        add('**Gap:** the full 2001-present daily series has not been ingested. The backfill '
            'script `scripts/backfill_gpm_history.py` is ready and uses Final through '
            '2025-09-30 and Late from 2025-10-01. A GES DISC connection timeout prevented '
            'running it during this report.')
        add('')

    add('## 2. GRACE / GRACE-FO total water storage (regional)')
    add('')
    g = grace_summary['_metadata']
    add(f"- Product: `{g['product']}`")
    add(f"- Source: {g['source']} — {g['source_url']}")
    add(f"- Effective resolution: {g['effective_spatial_resolution']}; native: {g['native_resolution']}")
    add(f"- Sampling: {g['grid_sampling']}")
    add(f"- Baseline: {g['baseline']}; variable: {g['variable']}")
    add(f"- Period: {g['period_start']} to {g['period_end']}")
    add(f"- Gap: {g['gap']['start']} to {g['gap']['end']} — {g['gap']['note']}")
    add(f"- Deseasonalization: {g['deseasonalization']}")
    add(f"- Area method: {g['area_pct_method']}")
    add('')
    add('### The five JPL mascons at district headquarters')
    add('')
    add('| Mascon | Area inside Bangladesh | Districts at HQ | District names |')
    add('|---|---|---|---|')
    for region in grace_summary['regions'].values():
        names = ', '.join(x['name'] for x in region['districts'])
        add(f"| {region['regionName']} (`{region['mascon_id']}`) | "
            f"{fmt(region['area_pct_inside_bangladesh'], 2, '%')} | {region['districts_count']} | {names} |")
    add('')
    adjacent = g.get('adjacent_mascons', [])
    if adjacent:
        add('Adjacent mascons that intersect Bangladesh but contain no district HQ: ' +
            '; '.join(
                f"`{x['mascon_id']}` ({fmt(x['area_pct_inside_bangladesh'], 2, '%')})"
                for x in adjacent
            ) + '. These are metadata only and are not counted as target regions.')
        add('')
    add('| District | Mascon | District cell lat/lon | Area inside BD | Districts sharing mascon | '
        'Latest TWS anomaly (cm) | Latest date | Deseasonalized 2002-2010 trend (cm/yr) | '
        'Deseasonalized 2016-present trend (cm/yr) | Months used |')
    add('|---|---|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        m = grace_summary['district_region_map'][d]
        r = grace_summary['regions'][m['regionId']]
        t1, t2 = r['trend_2002_2010'], r['trend_2016_present']
        add(f"| {m['districtName']} | {r['regionName']} | {m['representative_cell_lat']:.2f}, "
            f"{m['representative_cell_lon']:.2f} | {fmt(r['area_pct_inside_bangladesh'], 2, '%')} | "
            f"{r['districts_count']} | {fmt(r['latest_observation']['lwe_cm'], 2)} | "
            f"{r['latest_observation']['date']} | {trend_text(t1)} | {trend_text(t2)} | "
            f"{t1['months_used']} / {t2['months_used']} |")
    add('')
    add('GRACE measures total water storage (groundwater + soil moisture + surface water + snow/ice + '
        'vegetation water), not groundwater alone. These are regional trends, not district-level trends.')
    add('')
    add('The 0.5° CRI grid is not independent data. The product attributes state the native resolution '
        'is 3° equal-area mascons; all 0.5° cells inside one mascon carry the same TWS value. The 64 '
        'district HQs therefore map to **5** mascons, not 64 regions. All districts in a mascon receive '
        'identical values and trends by construction; the 46 districts in mascon 1321 share one series.')
    add('')
    add('The 2017-07..2018-05 gap is absent from all trend fits; no values were interpolated across it.')
    add('')
    add('### Rangpur recent monthly values (mascon 1214)')
    add('')
    rangpur_region = grace_regions['regions']['mascon_1214']
    recent = [r for r in rangpur_region['monthly_series'] if r['lwe_cm'] is not None][-12:]
    add('| Month | TWS anomaly (cm) | Deseasonalized anomaly (cm) |')
    add('|---|---|---|')
    for row in recent:
        add(f"| {row['month']} | {fmt(row['lwe_cm'], 2)} | {fmt(row['deseasonalized_cm'], 2)} |")
    add('')
    august = [r['lwe_cm'] for r in rangpur_region['monthly_series']
              if r['month'][5:7] == '08' and r['lwe_cm'] is not None]
    aug_mean = sum(august) / len(august) if august else None
    latest_aug = next((r['lwe_cm'] for r in reversed(rangpur_region['monthly_series'])
                       if r['month'].endswith('-08') and r['lwe_cm'] is not None), None)
    if aug_mean is not None and latest_aug is not None:
        add(f'August climatology for mascon 1214 is {aug_mean:+.2f} cm; August 2026 is '
            f'{latest_aug:+.2f} cm, an anomaly of {latest_aug - aug_mean:+.2f} cm versus the '
            'August mean. The recent values are the downloaded monthly mascon series, not a '
            'district-level estimate.')
        add('')
    for d in DISTRICTS:
        m = grace_summary['district_region_map'][d]
        region = grace_regions['regions'][m['regionId']]
        aug = [r['lwe_cm'] for r in region['monthly_series']
               if r['month'][5:7] == '08' and r['lwe_cm'] is not None]
        latest = next((r['lwe_cm'] for r in reversed(region['monthly_series'])
                       if r['month'].endswith('-08') and r['lwe_cm'] is not None), None)
        if aug and latest is not None:
            mean_aug = sum(aug) / len(aug)
            add(f"- {region['regionName']}: August 2026 {latest:+.2f} cm vs August mean "
                f"{mean_aug:+.2f} cm ({latest - mean_aug:+.2f} cm).")
    add('')

    add('## 3. NASADEM elevation and slope (district polygons)')
    add('')
    n = nasadem['rangpur']['_metadata']
    add(f"- Product: `{n['product']}` — {n['product_long_name']}")
    add(f"- Source: {n['source']} — {n['source_url']}")
    add(f"- Resolution: {n['spatial_resolution']}; polygons: {n['district_polygons']}")
    add(f"- Method: {n['method']}")
    add(f"- Slope weighting: {n['slope_area_weighting']}; median method: {n['median_method']}")
    add(f"- Main erosion indicator: `{n['main_erosion_indicator']}`")
    add(f"- Caveat: {n['terrain_caveat']}")
    add('')
    add('| District | Mean elevation (m) | Min (m) | Max (m) | Mean slope (deg) | Median slope (deg) | '
        'Area >2° (%) | Area >5° (%) | Sampled area (km2) | Elevation pixels |')
    add('|---|---|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        x = nasadem[d]
        add(f"| {x['districtName']} | {fmt(x['mean_elevation_m'], 1)} | "
            f"{fmt(x['min_elevation_m'], 1)} | {fmt(x['max_elevation_m'], 1)} | "
            f"{fmt(x['mean_slope_degrees'], 3)} | {fmt(x['median_slope_degrees'], 3)} | "
            f"{fmt(x['area_pct_slope_gt2_degrees'], 2)} | {fmt(x['area_pct_slope_gt5_degrees'], 2)} | "
            f"{fmt(x['sampled_area_km2'], 2)} | {x['elevation_pixel_count']} |")
    add('')
    add('Area shares are area-weighted by `cos(latitude)`; unweighted median values are stored in the '
        'per-district JSON. The area above 5° is reported as the main erosion indicator. Slope is a '
        'relative terrain indicator, not an erosion rate; in the flat delta, differences below 2° are '
        'also meaningful. Elevations below -10 m are excluded as ocean/void artefacts, never replaced.')
    add('')

    add('## 4. ECOSTRESS evapotranspiration and land surface temperature')
    add('')
    e = eco['rangpur']['_metadata']
    add(f"- ET product: `{e['et_product']}` — {e['et_product_long_name']} ({e['et_doi']})")
    add(f"- LST product: `{e['lst_product']}` — {e['lst_product_long_name']} ({e['lst_doi']})")
    add(f"- Source: {e['source']} — {e['source_url']}; resolution: {e['spatial_resolution']}")
    add(f"- Period requested: {e['period']}; sampling: {e['sampling']}")
    add(f"- Timezone: {e['timezone']}; day/night rule: {e['day_night_rule']}")
    add(f"- Solar elevation: {e['solar_elevation_method']}")
    add(f"- Temporal note: {e['temporal_note']}")
    add(f"- Units: {e['units']['et_daily_mm_per_day']}; {e['units']['lst_celsius']}")
    add(f"- Unit note: {e['unit_note']}")
    add(f"- QC: {e['qc_rules']['et']} {e['qc_rules']['lst']}")
    add('')
    add('| District | ET obs (day/night) | Latest ET local time | ET flag | Latest ET (mm/day) | '
        'LST obs (day/night) | Latest LST local time | LST flag | Latest LST (C) |')
    add('|---|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        x = eco[d]
        et, lst = x['latest_et'], x['latest_lst']
        add(f"| {x['districtName']} | {x['et_observations_count']} "
            f"({x['et_observations_daytime_count']}/{x['et_observations_count'] - x['et_observations_daytime_count']}) | "
            f"{local_stamp(et)} | {et['day_night'] if et else 'n/a'} | "
            f"{fmt(et['et_daily_mm_per_day'] if et else None, 3)} | "
            f"{x['lst_observations_count']} "
            f"({x['lst_observations_daytime_count']}/{x['lst_observations_count'] - x['lst_observations_daytime_count']}) | "
            f"{local_stamp(lst)} | {lst['day_night'] if lst else 'n/a'} | "
            f"{fmt(lst['lst_celsius'] if lst else None, 2)} |")
    add('')
    add('| District | Daytime LST obs (solar elevation > 0) | Latest daytime LST local time | '
        'Latest daytime LST (C) |')
    add('|---|---|---|---|')
    for d in DISTRICTS:
        x = eco[d]
        lst_day = x.get('latest_daytime_lst')
        add(f"| {x['districtName']} | {x['lst_observations_daytime_count']} | "
            f"{local_stamp(lst_day)} | {fmt(lst_day['lst_celsius'] if lst_day else None, 2)} |")
    add('')
    add('ECOSTRESS revisits are discrete and irregular (ISS orbit); the tables report the latest valid '
        'observations, not daily composites. The latest LST is a nighttime overpass for all three '
        'targets; the daytime-only series is kept separately in `lst_series_daytime`. Every ET and LST '
        'observation in the JSON has UTC time, Dhaka local time, solar elevation and a day/night flag. '
        'ETdaily is a daylight-integrated daily product; the flag describes the overpass timestamp, '
        'not the ET integration window. Cloudy/fill LST pixels are excluded, not filled.')
    add('')

    add('## 5. MODIS NDVI 16-day composites')
    add('')
    m = mod['rangpur']['_metadata']
    add(f"- Terra product: `{m['product']}` — {m['product_long_name']} ({m['collection']})")
    add(f"- Source: {m['source']} — {m['source_url']}; resolution: {m['spatial_resolution']}; "
        f"{m['temporal_resolution']}")
    add(f"- Sampling: {m['sampling']}")
    add(f"- Date labels: {m['date_label_note']}")
    add(f"- QA: {m['qa_rule']}")
    add('')
    if myd:
        mmeta = myd['rangpur']['_metadata']
        add(f"- Aqua product: `{mmeta['product']}` — {mmeta['product_long_name']} ({mmeta['collection']})")
        add(f"- Aqua source: {mmeta['source']} — {mmeta['source_url']}")
        add('')
    add('| Product | District | Steps | Expected | Missing composites | Valid steps | First date | '
        'Latest date | Latest valid date | Latest valid NDVI |')
    add('|---|---|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        x = mod[d]
        valid = [o for o in x['time_series'] if o['valid']]
        latest_valid = valid[-1] if valid else None
        add(f"| MOD13Q1 (Terra) | {x['districtName']} | {x['series_length']} | "
            f"{x['expected_series_length']} | {len(x['missing_composite_dates'])} | "
            f"{x['valid_series_length']} | {x['time_series'][0]['date']} | "
            f"{x['time_series'][-1]['date']} | "
            f"{latest_valid['date'] if latest_valid else 'n/a'} | "
            f"{fmt(latest_valid['ndvi'] if latest_valid else None, 4)} |")
    if myd:
        for d in DISTRICTS:
            x = myd[d]
            valid = [o for o in x['time_series'] if o['valid']]
            latest_valid = valid[-1] if valid else None
            add(f"| MYD13Q1 (Aqua) | {x['districtName']} | {x['series_length']} | "
                f"{x['expected_series_length']} | {len(x['missing_composite_dates'])} | "
                f"{x['valid_series_length']} | {x['time_series'][0]['date']} | "
                f"{x['time_series'][-1]['date']} | {latest_valid['date'] if latest_valid else 'n/a'} | "
                f"{fmt(latest_valid['ndvi'] if latest_valid else None, 4)} |")
    else:
        add('| MYD13Q1 (Aqua) | all three | pending | — | — | — | — | — | — | — |')
    add('')
    for d in DISTRICTS:
        x = mod[d]
        if x['missing_composite_dates']:
            add(f"Source gap: {x['districtName']} has no usable MOD13Q1 value on "
                f"{', '.join(x['missing_composite_dates'])}. The date is listed as missing, not filled.")
            add('')
    if not myd:
        add('**Aqua status:** AppEEARS task `82e2e7e6-c38e-4210-92e5-8e470bd23e0f` was still '
            'processing when this report was generated. No Aqua values are shown.')
        add('')

    add('## 6. MCD12Q1 land cover at the district headquarters')
    add('')
    lc_meta = landcover['_metadata']
    add(f"- Product: `{lc_meta['product']}` — {lc_meta['product_long_name']} ({lc_meta['collection']})")
    add(f"- Source: {lc_meta['source']} — {lc_meta['source_url']}")
    add(f"- Granule: `{lc_meta['granule']}`; year: {lc_meta['acquisition_year']}; "
        f"resolution: {lc_meta['spatial_resolution']}")
    add(f"- Sampling: {lc_meta['sampling']}")
    add(f"- Caveat: {lc_meta['caveat']}")
    add('')
    add('| District | Centre class | Centre class name | Urban? | Water? | 5x5 counts (code:count) | '
        '5x5 urban fraction |')
    add('|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        info = landcover['hq_points'][d]
        counts = ', '.join(f"{k}:{v}" for k, v in info['neighborhood_5x5_counts'].items())
        add(f"| {info['districtName']} | {info['center_class_code']} | {info['center_class_name']} | "
            f"{'yes' if info['center_is_urban'] else 'no'} | {'yes' if info['center_is_water'] else 'no'} | "
            f"{counts} | {fmt(info['neighborhood_5x5_urban_fraction'], 2)} |")
    add('')
    add('Class codes: 9 Savannas, 12 Croplands, 13 Urban and Built-up Lands, '
        '14 Cropland/Natural Vegetation Mosaics, 17 Water Bodies. Checks: Dhaka is class 13; '
        'the Bay of Bengal check is class 17 (water).')
    add('')
    add('All three headquarters pixels are **urban**, so the current NDVI, LST and ET point series '
        'describe urban pixels, not cropland. **Proposal only, not implemented:** exclude classes 13 '
        'and 17, retain classes 12 and 14, and sample 5-10 separated 500 m cropland pixels per district '
        'or compute a cropland-area-weighted district mean. MCD12Q1 is not used to mask NDVI, LST or ET '
        'in this report.')
    add('')

    add('## 7. Phase 10 requirement checklist')
    add('')
    add('| Requirement | Status |')
    add('|---|---|')
    add('| GPM rolling last-30-days + extreme-rain count | Complete |')
    add('| GPM exact 0.1° cell, dimension order and daily GPM-vs-POWER appendix | Complete |')
    add(f"| GPM daily 2001-present | {'Complete' if history else 'Pending: backfill script ready; GES DISC timeout'} |")
    add('| NASADEM mean elevation/slope per district | Complete (polygon means) |')
    add('| NASADEM median and area shares >2° / >5° | Complete; >5° reported as main erosion indicator |')
    add('| GRACE monthly TWS, regional label, gap marked | Complete |')
    add('| GRACE true 5 mascons, area % inside Bangladesh, district membership | Complete |')
    add('| ECOSTRESS ET + LST, discrete revisits | Complete |')
    add('| ECOSTRESS local overpass time, solar elevation, day/night, daytime LST series | Complete |')
    add('| MOD13Q1 Terra 16-day NDVI | Complete |')
    add(f"| MYD13Q1 Aqua 16-day NDVI | {'Complete' if myd else 'Pending: AppEEARS task processing'} |")
    add('| MCD12Q1 HQ land-cover check | Complete (three HQ pixels urban) |')
    add('| `public/cache/{dataset}/` metadata | Complete |')
    add('| GitHub Actions daily/monthly pipeline | Configured for rolling GPM, GRACE, AppEEARS download/process |')
    if history:
        add('| GPM full-history automation | `scripts/backfill_gpm_history.py` complete |')
    else:
        add('| GPM full-history automation | Manual `scripts/backfill_gpm_history.py` ready |')
    add('')
    add('## 8. Data quality notes')
    add('')
    if not history:
        add('- GES DISC was unreachable (connection timeout) during the GPM full-history attempt on '
            '2026-11-09; the existing rolling 30-day cache was fetched successfully earlier.')
    add('- GPM cells are 0.1° and point-sampled at the HQ; the exact cell centres and absolute indices '
        'are in the GPM JSON. On 28–30 October 2026, POWER is near zero in Rangpur while GPM records '
        'the event; POWER did not capture this event.')
    add('- GRACE is a regional mascon product. The older 46-cell grouping was a display-grid duplicate; '
        'the corrected cache groups all districts by `mascon_ID` into 5 regions. Mascon 1321 contains '
        '46 district HQs, so those districts necessarily share one series.')
    add('- GRACE area percentages are computed by subpixel intersection with the HDX ADM0 boundary; '
        'the adjacent mascons 1322 and 1430 also touch Bangladesh but have no district HQ and are not '
        'counted as target regions.')
    add('- NASADEM slope is a relative terrain indicator, not an erosion rate. The >5° area share is the '
        'main indicator; >2° is context. Median values come from a 0.01° slope histogram and are '
        'area-weighted by `cos(latitude)`; unweighted medians are also stored.')
    add('- ECOSTRESS latest LST is a nighttime overpass for all three districts. The daytime-only LST '
        'series (`lst_series_daytime`) is separate and uses solar elevation > 0. Solar elevation is an '
        'astronomical approximation used only for the flag.')
    add('- MCD12Q1 is a 500 m annual product; the three HQ pixels are urban. This is a point check, not '
        'a district-wide cropland fraction. No cropland resampling has been implemented.')
    add('- ECOSTRESS LST rows are heavily cloud-filtered: '
        f"{e['qc_rules']['lst_rows_rejected']} of 51,473 LSTE rows were rejected across all 64 districts. "
        'This is expected for thermal infrared in monsoon conditions.')
    add('- MODIS pixel reliability 2/3 rows remain in the time series with `valid=false`; they are '
        'retained for transparency and excluded from latest-valid values.')
    mod_dir = 'public/cache/modis_ndvi/mod13q1'
    for name in sorted(os.listdir(mod_dir)):
        if not name.endswith('.json') or 'summary' in name:
            continue
        d = load(os.path.join(mod_dir, name))
        if d['missing_composite_dates']:
            add(f"- Source gap: {d['districtName']} MOD13Q1 has no usable value on "
                f"{', '.join(d['missing_composite_dates'])}; the date is missing, not filled.")
    add('')
    add('## 9. Cache locations')
    add('')
    add('- `public/cache/gpm/` — rolling 30-day per district + summary; full history in '
        '`public/cache/gpm/history/` once ingested.')
    add('- `public/cache/grace/` — `grace_regions.json`, `grace_summary.json` (5 mascons).')
    add('- `public/cache/nasadem/` — per-district elevation/slope + summary.')
    add('- `public/cache/ecostress/` — per-district ET/LST series + summary.')
    add('- `public/cache/modis_ndvi/mod13q1/` and `myd13q1/` — per-district NDVI + summaries.')
    add('- `public/cache/landcover/mcd12q1_hq.json` — HQ land-cover check and 5x5 counts.')
    add('')
    add('## 10. Source citations')
    add('')
    add('- GPM IMERG: `GPM_3IMERGDF.07` / `GPM_3IMERGDL.07`, NASA GES DISC.')
    add('- GRACE: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`, NASA PO.DAAC / JPL.')
    add('- NASADEM: `NASADEM_NC.001`, NASA LP DAAC.')
    add('- ECOSTRESS: `ECO_L3T_JET.002`, `ECO_L2T_LSTE.002`, NASA LP DAAC via AppEEARS.')
    add('- MODIS: `MOD13Q1.061`, `MYD13Q1.061`, NASA LP DAAC via AppEEARS.')
    add('- Land cover: `MCD12Q1.061`, NASA LP DAAC.')
    add('- District polygons: HDX/OCHA COD-AB `bgd_admin2.geojson` (valid_on 2023-05-21).')
    add('')

    text = '\n'.join(lines)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'Wrote {OUT} ({len(text)} chars)')
    print('MYD13Q1 present:', bool(myd), '| GPM history present:', bool(history))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
