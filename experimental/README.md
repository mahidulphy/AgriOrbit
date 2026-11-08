# Experimental Partner Data Ingestion & Sync

> [!WARNING]
> **NOT USED IN PRODUCTION; NO REAL DATA CONNECTED YET.**
> These scripts, serverless sync routes, and test suites are developmental prototypes for potential future integrations with international space agency partners. They are not part of the AgriOrbit production decision pipeline.

## Status Summary

1. **ESA Sentinel-1 C-SAR (`scripts/fetch-sentinel1.ts`, `api/sync-sentinel1.ts`)**:
   - Prototype client for Copernicus Data Space Ecosystem (CDSE) OData OpenSearch API.
   - Requires paid/enterprise or restricted CDSE credentials (`CDSE_CLIENT_ID`, `CDSE_CLIENT_SECRET`) to process 10m GRD VV/VH backscatter and calculate flooded cropland %.
   - **Status**: Not connected to live production data; excluded from active AgriOrbit scoring.

2. **ESA Sentinel-2 MSI (`scripts/fetch-sentinel2.ts`, `api/sync-sentinel2.ts`)**:
   - Prototype client for Copernicus Sentinel-2 L2A optical 10m NDVI.
   - Requires cloud-free scene availability and CDSE API authentication.
   - **Status**: Not connected to live production data; excluded from active AgriOrbit scoring.

3. **JAXA Earth API (`scripts/fetch-jaxa.ts`, `api/sync-jaxa.ts`)**:
   - Prototype client for JAXA GSMaP rainfall and AMSR2 soil moisture.
   - Requires JAXA Earth API developer keys and G-Portal FTP authorization.
   - **Status**: Not connected to live production data; excluded from active AgriOrbit scoring.

4. **ISRO MOSDAC & NISAR (`scripts/fetch-insat.ts`, `api/sync-insat.ts`)**:
   - Prototype client for ISRO INSAT-3DR thermal LST and NASA-ISRO NISAR L3 provisional 200m SAR.
   - NISAR is not yet operationally streaming daily 200m agricultural SAR over Bangladesh, and MOSDAC requires IMD meteorological access.
   - **Status**: Not connected to live production data; excluded from active AgriOrbit scoring.

---

## Production Data Pipeline
Production AgriOrbit relies strictly on verified, accessible Earth observation sources:
- **NASA POWER**: Real-time daily agrometeorology point API (`https://power.larc.nasa.gov/api/temporal/daily/point`).
- **NASA SMAP L3**: AppEEARS 9 km passive microwave soil moisture (`SPL3SMP_E.006`).
- **NASA MODIS**: ORNL DAAC & AppEEARS 250m NDVI (`MOD13Q1.061`) and 1 km LST (`MOD11A2.061`).
- **ESA CCI**: 30-year Climate Change Initiative combined soil moisture data record v09.1.
- **Open-Meteo**: High-resolution 7-day weather forecast API.
- **BARI / BRRI**: Agro-ecological crop suitability and fertilizer management guidelines.
