async function timeSlice() {
  const lat = 25.7439;
  const lon = 89.2752;
  const t0 = Date.now();
  const url = `https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude=${lat}&longitude=${lon}&startDate=A2026193&endDate=A2026289&kmAboveBelow=0&kmLeftRight=0`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  console.log('Status:', res.status, 'Time ms:', Date.now() - t0);
  if (res.ok) {
    const data = await res.json();
    const ndvi = data.subset?.find(s => s.band === '250m_16_days_NDVI');
    const qa = data.subset?.find(s => s.band === '250m_16_days_pixel_reliability');
    console.log('Dates in slice:', ndvi?.data?.length);
    console.log('NDVI raw:', ndvi?.data);
    console.log('QA raw:', qa?.data);
  }
}
timeSlice().catch(console.error);
