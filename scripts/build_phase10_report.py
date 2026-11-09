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


def main():
    gpm = {d: load(f'public/cache/gpm/{d}.json') for d in DISTRICTS}
    nasadem = {d: load(f'public/cache/nasadem/{d}.json') for d in DISTRICTS}
    grace_summary = load('public/cache/grace/grace_summary.json')
    eco = {d: load(f'public/cache/ecostress/{d}.json') for d in DISTRICTS}
    mod = {d: load(f'public/cache/modis_ndvi/mod13q1/{d}.json') for d in DISTRICTS}
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
    add(f"- Full-history status: {'ingested' if history else 'NOT YET INGESTED (rolling 30-day cache only)'}")
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
    add(f"- Effective resolution: {g['effective_spatial_resolution']}; {g['grid_sampling']}")
    add(f"- Baseline: {g['baseline']}; variable: {g['variable']}")
    add(f"- Period: {g['period_start']} to {g['period_end']}")
    add(f"- Gap: {g['gap']['start']} to {g['gap']['end']} — {g['gap']['note']}")
    add(f"- Deseasonalization: {g['deseasonalization']}")
    add('')
    add('| District | Mascon region | Cell lat/lon | Districts sharing cell | Latest TWS anomaly (cm) | '
        'Latest date | Deseasonalized 2002-2010 trend (cm/yr) | Deseasonalized 2016-present trend (cm/yr) | Months used |')
    add('|---|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        m = grace_summary['district_region_map'][d]
        r = grace_summary['regions'][m['regionId']]
        t1, t2 = r['trend_2002_2010'], r['trend_2016_present']
        add(f"| {m['districtName']} | {r['regionName']} | {r['mascon_cell_lat']:.2f}, "
            f"{r['mascon_cell_lon']:.2f} | {r['districts_count']} | "
            f"{fmt(r['latest_observation']['lwe_cm'], 2)} | {r['latest_observation']['date']} | "
            f"{t1['slope_cm_per_year']:+.2f} ± {t1['standard_error_cm_per_year']:.2f} | "
            f"{t2['slope_cm_per_year']:+.2f} ± {t2['standard_error_cm_per_year']:.2f} | "
            f"{t1['months_used']} / {t2['months_used']} |")
    shared_cells = []
    for d in DISTRICTS:
        m = grace_summary['district_region_map'][d]
        r = grace_summary['regions'][m['regionId']]
        if r['districts_count'] > 1:
            names = ', '.join(x['name'] for x in r['districts'])
            shared_cells.append(f"{r['regionName']} ({names})")
    add('')
    add('GRACE measures total water storage (groundwater + soil moisture + surface water + snow/ice + '
        'vegetation water), not groundwater alone. These are regional trends, not district-level trends.')
    if shared_cells:
        add('Districts that share a mascon cell receive **identical** GRACE TWS values, series, and '
            'trend estimates; the values are not independently estimated per district. Shared cells '
            'among the target districts: ' + '; '.join(shared_cells) + '.')
    else:
        add('Each target district maps to its own mascon cell here; for any cell shared by multiple '
            'districts, all districts receive identical GRACE values and trends by construction.')
    add('The 2017-07..2018-05 gap is absent from all trend fits; no values were interpolated across it.')
    add('')

    add('## 3. NASADEM elevation and slope (district polygons)')
    add('')
    n = nasadem['rangpur']['_metadata']
    add(f"- Product: `{n['product']}` — {n['product_long_name']}")
    add(f"- Source: {n['source']} — {n['source_url']}")
    add(f"- Resolution: {n['spatial_resolution']}; polygons: {n['district_polygons']}")
    add(f"- Method: {n['method']}")
    add('')
    add('| District | Mean elevation (m) | Min (m) | Max (m) | Mean slope (deg) | Mean slope (%) | '
        'Sampled area (km2) | Elevation pixels |')
    add('|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        x = nasadem[d]
        add(f"| {x['districtName']} | {fmt(x['mean_elevation_m'], 1)} | "
            f"{fmt(x['min_elevation_m'], 1)} | {fmt(x['max_elevation_m'], 1)} | "
            f"{fmt(x['mean_slope_degrees'], 3)} | {fmt(x['mean_slope_percent'], 2)} | "
            f"{fmt(x['sampled_area_km2'], 2)} | {x['elevation_pixel_count']} |")
    add('')

    add('## 4. ECOSTRESS evapotranspiration and land surface temperature')
    add('')
    e = eco['rangpur']['_metadata']
    add(f"- ET product: `{e['et_product']}` — {e['et_product_long_name']} ({e['et_doi']})")
    add(f"- LST product: `{e['lst_product']}` — {e['lst_product_long_name']} ({e['lst_doi']})")
    add(f"- Source: {e['source']} — {e['source_url']}; resolution: {e['spatial_resolution']}")
    add(f"- Period requested: {e['period']}; sampling: {e['sampling']}")
    add(f"- Temporal note: {e['temporal_note']}")
    add(f"- Units: {e['units']['et_daily_mm_per_day']}; {e['units']['lst_celsius']}")
    add(f"- Unit note: {e['unit_note']}")
    add(f"- QC: {e['qc_rules']['et']} {e['qc_rules']['lst']}")
    add('')
    add('| District | ET observations | Latest ET date | Latest ET (mm/day) | Latest PTJPLSMinst (W/m2) | '
        'LST observations | Latest LST date | Latest LST (C) | LST accuracy |')
    add('|---|---|---|---|---|---|---|---|---|')
    for d in DISTRICTS:
        x = eco[d]
        et, lst = x['latest_et'], x['latest_lst']
        add(f"| {x['districtName']} | {x['et_observations_count']} | "
            f"{et['date'] if et else 'n/a'} | {fmt(et['et_daily_mm_per_day'] if et else None, 3)} | "
            f"{fmt(et['ptjplsm_instantaneous_w_m2'] if et else None, 2)} | "
            f"{x['lst_observations_count']} | {lst['date'] if lst else 'n/a'} | "
            f"{fmt(lst['lst_celsius'] if lst else None, 2)} | "
            f"{lst['lst_accuracy'] if lst else 'n/a'} |")
    add('')
    add('ECOSTRESS revisits are discrete and irregular (ISS orbit); the table reports the latest '
        'valid observation, not a daily composite. Cloudy/fill LST pixels are excluded, not filled.')
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

    add('## 6. Phase 10 requirement checklist')
    add('')
    add('| Requirement | Status |')
    add('|---|---|')
    add('| GPM rolling last-30-days + extreme-rain count | Complete |')
    add(f"| GPM daily 2001-present | {'Complete' if history else 'Pending: backfill script ready; GES DISC timeout'} |")
    add('| NASADEM mean elevation/slope per district | Complete (polygon means) |')
    add('| GRACE monthly TWS, regional label, gap marked | Complete |')
    add('| ECOSTRESS ET + LST, discrete revisits | Complete |')
    add('| MOD13Q1 Terra 16-day NDVI | Complete |')
    add(f"| MYD13Q1 Aqua 16-day NDVI | {'Complete' if myd else 'Pending: AppEEARS task processing'} |")
    add('| `public/cache/{dataset}/` metadata | Complete |')
    add('| GitHub Actions daily/monthly pipeline | Configured for rolling GPM, GRACE, AppEEARS download/process |')
    if history:
        add('| GPM full-history automation | `scripts/backfill_gpm_history.py` complete |')
    else:
        add('| GPM full-history automation | Manual `scripts/backfill_gpm_history.py` ready |')
    add('')
    add('## 7. Data quality notes')
    add('')
    if not history:
        add('- GES DISC was unreachable (connection timeout) during the GPM full-history attempt on '
            '2026-11-09; the existing rolling 30-day cache was fetched successfully earlier.')
    add('- ECOSTRESS LST rows are heavily cloud-filtered: '
        f"{e['qc_rules']['lst_rows_rejected']} of 51,473 LSTE rows were rejected across all 64 districts. "
        'This is expected for thermal infrared in monsoon conditions.')
    add('- GRACE has no data for 2017-07..2018-05 (GRACE/GRACE-FO gap); those months are absent, '
        'not interpolated.')
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
    add('- NASADEM elevations below -10 m are excluded as ocean/void artefacts; no terrestrial '
        'district is below -10 m. No interpolation is used.')
    add('')
    add('## 8. Cache locations')
    add('')
    add('- `public/cache/gpm/` — rolling 30-day per district + summary; full history in '
        '`public/cache/gpm/history/` once ingested.')
    add('- `public/cache/grace/` — `grace_regions.json`, `grace_summary.json`.')
    add('- `public/cache/nasadem/` — per-district elevation/slope + summary.')
    add('- `public/cache/ecostress/` — per-district ET/LST series + summary.')
    add('- `public/cache/modis_ndvi/mod13q1/` and `myd13q1/` — per-district NDVI + summaries.')
    add('')
    add('## 9. Source citations')
    add('')
    add('- GPM IMERG: `GPM_3IMERGDF.07` / `GPM_3IMERGDL.07`, NASA GES DISC.')
    add('- GRACE: `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`, NASA PO.DAAC / JPL.')
    add('- NASADEM: `NASADEM_NC.001`, NASA LP DAAC.')
    add('- ECOSTRESS: `ECO_L3T_JET.002`, `ECO_L2T_LSTE.002`, NASA LP DAAC via AppEEARS.')
    add('- MODIS: `MOD13Q1.061`, `MYD13Q1.061`, NASA LP DAAC via AppEEARS.')
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
