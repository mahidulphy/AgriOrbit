async function checkOrnlEndpoints() {
  const res = await fetch('https://modis.ornl.gov/rst/api/v1/products');
  console.log('ORNL products status:', res.status);
  const data = await res.json();
  console.log('Products:', data.products?.filter(p => p.includes('MOD13') || p.includes('MYD13')));
}
checkOrnlEndpoints().catch(console.error);
