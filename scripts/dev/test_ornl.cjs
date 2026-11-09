async function testOrnl() {
  const lat = 25.7439;
  const lon = 89.2752;
  const res = await fetch(`https://modis.ornl.gov/rst/api/v1/MOD13Q1/dates?latitude=${lat}&longitude=${lon}`);
  const data = await res.json();
  console.log('MOD13Q1 dates count:', data.dates?.length);
  if (data.dates?.length) {
    console.log('Earliest:', data.dates[0]);
    console.log('Latest:', data.dates[data.dates.length - 1]);
  }
}
testOrnl().catch(console.error);
