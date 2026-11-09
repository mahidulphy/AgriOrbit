async function checkGpmGranules() {
  const collId = 'C2723754859-GES_DISC'; // Late
  const res = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${collId}&page_size=3&sort_key=-start_date`);
  const data = await res.json();
  console.log('Latest Late Granules found:', data.feed?.entry?.length);
  for (const g of (data.feed?.entry || [])) {
    console.log(`- ${g.title}`);
    console.log('  Time:', g.time_start);
    const links = g.links?.map(l => l.href);
    console.log('  OPeNDAP / Data links:', links?.filter(l => l.includes('opendap') || l.endsWith('.nc4') || l.endsWith('.HDF5')));
  }
}
checkGpmGranules().catch(console.error);
