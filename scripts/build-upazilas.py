import re
import sys
import json
import zipfile
import urllib.request
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

def normalize(name):
    """Normalize names for fuzzy matching."""
    s = name.lower()
    # Common transliteration variations
    replacements = [
        ('gonj', 'ganj'),
        ('pur', 'pur'),
        ('para', 'para'),
        ('chhari', 'chhari'),
        ('chari', 'chhari'),
        ('khali', 'khali'),
        ('shail', 'sail'),
        ('nagar', 'nagar'),
        ('bari', 'bari'),
        ('bazar', 'bazar'),
        ('thana', ''),
        ('upazila', ''),
        ('south', 'dakkhin'),
        ('north', 'uttar'),
        ('east', 'purba'),
        ('west', 'pashchim'),
    ]
    for old, new in replacements:
        s = s.replace(old, new)
    return re.sub(r'[^a-z0-9]', '', s)

# 1. Parse bdAdmin.ts to get the 64 districts and their IDs
with open('src/data/bdAdmin.ts', 'r', encoding='utf-8') as f:
    bd_admin_content = f.read()

districts = []
for line in bd_admin_content.split('\n'):
    line = line.strip()
    if line.startswith('{ id:'):
        # Extract fields
        id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", line)
        name_en_m = re.search(r"nameEn:\s*['\"]([^'\"]+)['\"]", line)
        name_bn_m = re.search(r"nameBn:\s*['\"]([^'\"]+)['\"]", line)
        div_m = re.search(r"division:\s*['\"]([^'\"]+)['\"]", line)
        div_bn_m = re.search(r"divisionBn:\s*['\"]([^'\"]+)['\"]", line)
        lat_m = re.search(r"lat:\s*([0-9.]+)", line)
        lng_m = re.search(r"lng:\s*([0-9.]+)", line)
        if id_m and name_en_m and name_bn_m and lat_m and lng_m:
            districts.append({
                'id': id_m.group(1),
                'nameEn': name_en_m.group(1),
                'nameBn': name_bn_m.group(1),
                'division': div_m.group(1) if div_m else '',
                'divisionBn': div_bn_m.group(1) if div_bn_m else '',
                'lat': float(lat_m.group(1)),
                'lng': float(lng_m.group(1)),
            })


print(f"Loaded {len(districts)} districts from bdAdmin.ts")
assert len(districts) == 64, f"Expected 64 districts, got {len(districts)}"

# Map normalized district name to district object
dist_map = {}
for d in districts:
    dist_map[normalize(d['nameEn'])] = d
    dist_map[normalize(d['id'])] = d

# Aliases for districts
dist_map['comilla'] = dist_map['cumilla']
dist_map['chittagong'] = dist_map['chattogram']
dist_map['bogra'] = dist_map['bogura']
dist_map['jessore'] = dist_map['jashore']
dist_map['barisal'] = dist_map['barishal']
dist_map['moulvibazar'] = dist_map['moulvibazar']
dist_map['maulvibazar'] = dist_map['moulvibazar']
dist_map['moulovibazar'] = dist_map['moulvibazar']
dist_map['chapainababganj'] = dist_map['chapainawabganj']
dist_map['nawabganj'] = dist_map['chapainawabganj']
dist_map['netrakona'] = dist_map['netrokona']
dist_map['netrokona'] = dist_map['netrokona']


# 2. Fetch nuhil datasets for official Bangla names
print("Fetching nuhil/bangladesh-geocode upazilas and districts...")
req_upz = urllib.request.urlopen('https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/upazilas/upazilas.json')
nuhil_upz = json.loads(req_upz.read().decode('utf-8'))[2]['data']

req_dist = urllib.request.urlopen('https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/districts/districts.json')
nuhil_dist = {d['id']: d['name'] for d in json.loads(req_dist.read().decode('utf-8'))[2]['data']}

print(f"Loaded {len(nuhil_upz)} upazilas from nuhil")
for u in nuhil_upz:
    if 'khulna' in str(nuhil_dist.get(u['district_id'], '')).lower():
        print("  nuhil khulna upz:", u['name'], u['bn_name'])


# Build nuhil lookup: (normalized_district, normalized_upazila) -> bn_name
nuhil_lookup = {}
for u in nuhil_upz:
    did = u['district_id']
    dname = nuhil_dist.get(did, '')
    d_norm = normalize(dname)
    u_norm = normalize(u['name'])
    bn = u['bn_name'].strip()
    nuhil_lookup[(d_norm, u_norm)] = bn
    # Also without district
    if u_norm not in nuhil_lookup:
        nuhil_lookup[u_norm] = bn

# 3. Parse HDX xlsx sheet4 (adm3)
print("Parsing HDX COD-AB adm3 sheet from scripts/bgd_admin_boundaries.xlsx...")
with zipfile.ZipFile('scripts/bgd_admin_boundaries.xlsx') as z:
    strings_root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
    strings = []
    for si in strings_root.findall(f'{ns}si'):
        t_el = si.find(f'{ns}t')
        if t_el is not None and t_el.text:
            strings.append(t_el.text)
        else:
            text_parts = [t.text or '' for t in si.findall(f'.//{ns}t')]
            strings.append(''.join(text_parts))

    root = ET.fromstring(z.read('xl/worksheets/sheet4.xml'))
    hdx_rows = []
    for r in root.findall(f'.//{ns}row'):
        row_idx = r.attrib.get('r')
        if row_idx == '1':
            continue
        vals = {}
        for c in r.findall(f'{ns}c'):
            col_letter = ''.join([ch for ch in c.attrib.get('r') if ch.isalpha()])
            t = c.attrib.get('t')
            v = c.find(f'{ns}v')
            val = v.text if v is not None else ''
            if t == 's':
                val = strings[int(val)] if val.isdigit() and int(val) < len(strings) else val
            vals[col_letter] = val
        
        name_en = vals.get('A', '').strip()
        pcode = vals.get('E', '').strip()
        dist_en = vals.get('F', '').strip()
        lat_str = vals.get('AD', '').strip()
        lon_str = vals.get('AE', '').strip()
        area_str = vals.get('W', '').strip()
        
        if name_en and dist_en and lat_str and lon_str:
            hdx_rows.append({
                'name_en': name_en,
                'pcode': pcode,
                'district_en': dist_en,
                'lat': float(lat_str),
                'lon': float(lon_str),
                'area_sqkm': float(area_str) if area_str else 0.0,
            })

print(f"Loaded {len(hdx_rows)} adm3 units from HDX COD-AB")

# 4. Match HDX with Districts and nuhil Bangla names
upazilas = []
unmatched_bn = []
district_upazila_counts = {d['id']: 0 for d in districts}

for h in hdx_rows:
    d_norm = normalize(h['district_en'])
    district_obj = dist_map.get(d_norm)
    if not district_obj:
        print(f"Warning: district not found for {h['district_en']}")
        continue
    
    district_id = district_obj['id']
    u_norm = normalize(h['name_en'])
    
    # Try exact match with district
    bn = nuhil_lookup.get((d_norm, u_norm))
    if not bn:
        # Try match by upazila name only
        bn = nuhil_lookup.get(u_norm)
    
    # Special manual overrides for names where spellings differ between HDX and nuhil
    if not bn:
        # Common differences:
        name_clean = h['name_en'].lower()
        if 'sadar' in name_clean:
            bn = district_obj['nameBn'] + ' সদর'
        elif 'adarsha sadar' in name_clean:
            bn = 'আদর্শ সদর'
        elif 'sadar dakkhin' in name_clean or 'sadar dakshin' in name_clean:
            bn = 'সদর দক্ষিণ'
        elif 'karnaphuli' in name_clean:
            bn = 'কর্ণফুলী'
        elif 'matlab' in name_clean and ('dakkhin' in name_clean or 'south' in name_clean):
            bn = 'মতলব দক্ষিণ'
        elif 'matlab' in name_clean and ('uttar' in name_clean or 'north' in name_clean):
            bn = 'মতলব উত্তর'
        elif 'hatiya' in name_clean:
            bn = 'হাতিয়া'
        elif 'senbag' in name_clean:
            bn = 'সেনবাগ'
        elif 'sonaimuri' in name_clean:
            bn = 'সোনাইমুড়ী'
        elif 'parashuram' in name_clean or 'parshuram' in name_clean:
            bn = 'পরশুরাম'
        elif 'baghaichhari' in name_clean:
            bn = 'বাঘাইছড়ি'
        elif 'belaichhari' in name_clean:
            bn = 'বিলাইছড়ি'
        elif 'jurachhari' in name_clean:
            bn = 'জুরাইছড়ি'
        elif 'mithamain' in name_clean:
            bn = 'মিঠামইন'
        elif 'austagram' in name_clean or 'astagram' in name_clean:
            bn = 'অষ্টগ্রাম'
        elif 'tarash' in name_clean:
            bn = 'তাড়াশ'
        elif 'belkuchi' in name_clean:
            bn = 'বেলকুচি'
        elif 'kamarkhand' in name_clean or 'kamarkhanda' in name_clean:
            bn = 'কামারখন্দ'
        elif 'kazipur' in name_clean:
            bn = 'কাজীপুর'
        elif 'raiganj' in name_clean or 'rayganj' in name_clean:
            bn = 'রায়গঞ্জ'
        elif 'shahjadpur' in name_clean:
            bn = 'শাহজাদপুর'
        elif 'shajahanpur' in name_clean:
            bn = 'শাজাহানপুর'
        elif 'shibganj' in name_clean:
            bn = 'শিবগঞ্জ'
        elif 'sonatala' in name_clean:
            bn = 'সোনাতলা'
        elif 'dhunat' in name_clean:
            bn = 'ধুনট'
        elif 'gabtali' in name_clean:
            bn = 'গাবতলী'
        elif 'kahaloo' in name_clean or 'kahalu' in name_clean:
            bn = 'কাহালু'
        elif 'nandigram' in name_clean:
            bn = 'নন্দীগ্রাম'
        elif 'sariakandi' in name_clean:
            bn = 'সারিয়াকান্দি'
        elif 'sherpur' in name_clean and district_id == 'bogura':
            bn = 'শেরপুর'
        elif 'dakshinsurma' in name_clean or 'dakkhin surma' in name_clean or 'dakshin surma' in name_clean or 'south surma' in name_clean:
            bn = 'দক্ষিণ সুরমা'
        elif 'osmaninagar' in name_clean:
            bn = 'ওসমানী নগর'
        elif 'moheshkhali' in name_clean or 'maheshkhali' in name_clean:
            bn = 'মহেশখালী'
        elif 'pekuya' in name_clean or 'pekua' in name_clean:
            bn = 'পেকুয়া'
        elif 'ramu' in name_clean:
            bn = 'রামু'
        elif 'teknaf' in name_clean:
            bn = 'টেকনাফ'
        elif 'ukhiya' in name_clean or 'ukhia' in name_clean:
            bn = 'উখিয়া'
        elif 'kutubdia' in name_clean:
            bn = 'কুতুবদিয়া'
        elif 'chakaria' in name_clean:
            bn = 'চকরিয়া'
        elif 'naikkhongchhari' in name_clean or 'naikhongchhari' in name_clean:
            bn = 'নাইক্ষ্যংছড়ি'
        elif 'rowangchhari' in name_clean:
            bn = 'রোয়াংছড়ি'
        elif 'thanchi' in name_clean:
            bn = 'থানচি'
        elif 'ruma' in name_clean:
            bn = 'রুমা'
        elif 'lama' in name_clean:
            bn = 'লামা'
        elif 'alikadam' in name_clean:
            bn = 'আলীকদম'
        elif 'bijoynagar' in name_clean:
            bn = 'বিজয়নগর'
        elif 'banchharampur' in name_clean or 'bancharampur' in name_clean:
            bn = 'বাঞ্ছারামপুর'
        elif 'lakkhichhari' in name_clean or 'lakshmichhari' in name_clean:
            bn = 'লক্ষ্মীছড়ি'
        elif 'mahalchhari' in name_clean:
            bn = 'মহালছড়ি'
        elif 'manikchhari' in name_clean:
            bn = 'মানিকছড়ি'
        elif 'panchhari' in name_clean:
            bn = 'পানছড়ি'
        elif 'dighinala' in name_clean:
            bn = 'দিঘীনালা'
        elif 'matiranga' in name_clean:
            bn = 'মাটিরাঙ্গা'
        elif 'ramgarh' in name_clean:
            bn = 'রামগড়'
        elif 'guimara' in name_clean:
            bn = 'গুইমারা'
        # Additional mappings
        elif 'mirsarai' in name_clean or 'mirsharai' in name_clean:
            bn = 'মীরসরাই'
        elif 'manoharganj' in name_clean or 'monohargonj' in name_clean:
            bn = 'মনোহরগঞ্জ'
        elif 'ghior' in name_clean:
            bn = 'ঘিওর'
        elif 'shibalay' in name_clean:
            bn = 'শিবালয়'
        elif 'singair' in name_clean:
            bn = 'সিংগাইর'
        elif 'gazaria' in name_clean:
            bn = 'গজারিয়া'
        elif 'louhajang' in name_clean:
            bn = 'লৌহজং'
        elif 'manohardi' in name_clean:
            bn = 'মনোহরদী'
        elif 'pangsha' in name_clean:
            bn = 'পাংশা'
        elif 'bhuanpur' in name_clean or 'bhuapur' in name_clean:
            bn = 'ভূঞাপুর'
        elif 'morelganj' in name_clean or 'morrelganj' in name_clean:
            bn = 'মোরেলগঞ্জ'
        elif 'sharankhola' in name_clean:
            bn = 'শরণখোলা'
        elif 'bagharpara' in name_clean or 'bagherpara' in name_clean:
            bn = 'বাঘারপাড়া'
        elif 'chaugachha' in name_clean or 'chougachha' in name_clean:
            bn = 'চৌগাছা'
        elif 'jhikargachha' in name_clean or 'jhikargacha' in name_clean:
            bn = 'ঝিকরগাছা'
        elif 'maheshpur' in name_clean or 'moheshpur' in name_clean:
            bn = 'মহেশপুর'
        elif 'batiaghata' in name_clean or 'botiaghata' in name_clean:
            bn = 'বটিয়াঘাটা'
        elif 'dacope' in name_clean or 'dakop' in name_clean:
            bn = 'দাকোপ'
        elif 'dighalia' in name_clean or 'digholia' in name_clean:
            bn = 'দিঘলিয়া'
        elif 'paikgachha' in name_clean or 'paikgasa' in name_clean:
            bn = 'পাইকগাছা'
        elif 'phultala' in name_clean or 'fultola' in name_clean:
            bn = 'ফুলতলা'
        elif 'rupsa' in name_clean or 'rupsha' in name_clean:
            bn = 'রূপসা'
        elif 'ashashuni' in name_clean or 'assasuni' in name_clean:
            bn = 'আশাশুনি'
        elif 'dupchachia' in name_clean or 'dhupchanchia' in name_clean:
            bn = 'দুপচাঁচিয়া'
        elif 'gomastapur' in name_clean:
            bn = 'গোমস্তাপুর'
        elif 'nachole' in name_clean or 'nachol' in name_clean:
            bn = 'নাচোল'
        elif 'badalgachhi' in name_clean or 'badalgachi' in name_clean:
            bn = 'বদলগাছী'
        elif 'mahadebpur' in name_clean or 'mohadevpur' in name_clean:
            bn = 'মহাদেবপুর'
        elif 'atgharia' in name_clean or 'atghoria' in name_clean:
            bn = 'আটঘরিয়া'
        elif 'ishwardi' in name_clean:
            bn = 'ঈশ্বরদী'
        elif 'mohanpur' in name_clean or 'mohonpur' in name_clean:
            bn = 'মোহনপুর'
        elif 'chouhali' in name_clean or 'chowhali' in name_clean:
            bn = 'চৌহালী'
        elif 'patharghata' in name_clean or 'pathorghata' in name_clean:
            bn = 'পাথরঘাটা'
        elif 'gaurnadi' in name_clean or 'gournadi' in name_clean:
            bn = 'গৌরনদী'
        elif 'hijla' in name_clean or 'hizla' in name_clean:
            bn = 'হিজলা'
        elif 'ujirpur' in name_clean or 'wazirpur' in name_clean:
            bn = 'উজিরপুর'
        elif 'borhanuddin' in name_clean or 'burhanuddin' in name_clean:
            bn = 'বোরহানউদ্দিন'
        elif 'charfasson' in name_clean or 'charfesson' in name_clean:
            bn = 'চরফ্যাশন'
        elif 'daulatkhan' in name_clean or 'doulatkhan' in name_clean:
            bn = 'দৌলতখান'
        elif 'kanthalia' in name_clean or 'kathalia' in name_clean:
            bn = 'কাঠালিয়া'
        elif 'nalchhity' in name_clean or 'nalchity' in name_clean:
            bn = 'নলছিটি'
        elif 'indurkani' in name_clean or 'zianagar' in name_clean:
            bn = 'ইন্দুরকানী'
        elif 'nesarabad' in name_clean or 'swarupkathi' in name_clean:
            bn = 'নেছারাবাদ'
        elif 'bakshiganj' in name_clean or 'bokshiganj' in name_clean:
            bn = 'বকশীগঞ্জ'
        elif 'melandaha' in name_clean or 'melandah' in name_clean:
            bn = 'মেলান্দহ'
        elif 'fulpur' in name_clean or 'phulpur' in name_clean:
            bn = 'ফুলপুর'
        elif 'ishwarganj' in name_clean or 'ishwargonj' in name_clean:
            bn = 'ঈশ্বরগঞ্জ'
        elif 'muktagachha' in name_clean or 'muktagacha' in name_clean:
            bn = 'মুক্তাগাছা'
        elif 'mohanganj' in name_clean or 'mohonganj' in name_clean:
            bn = 'মোহনগঞ্জ'
        elif 'nakla' in name_clean or 'nokla' in name_clean:
            bn = 'নকলা'
        elif 'sreebardi' in name_clean or 'sribardi' in name_clean:
            bn = 'শ্রীবরদী'
        elif 'kaharole' in name_clean or 'kaharol' in name_clean:
            bn = 'কাহারোল'
        elif 'nababganj' in name_clean and district_id == 'dinajpur':
            bn = 'নবাবগঞ্জ'
        elif 'fulchhari' in name_clean or 'phulchhari' in name_clean:
            bn = 'ফুলছড়ি'
        elif 'rajibpur' in name_clean:
            bn = 'চর রাজিবপুর'
        elif 'roumari' in name_clean or 'rowmari' in name_clean:
            bn = 'রৌমারী'
        elif 'kishoreganj' in name_clean and district_id == 'nilphamari':
            bn = 'কিশোরগঞ্জ'
        elif 'saidpur' in name_clean or 'syedpur' in name_clean:
            bn = 'সৈয়দপুর'
        elif 'atowari' in name_clean or 'atwari' in name_clean:
            bn = 'আটোয়ারী'
        elif 'tentulia' in name_clean or 'tetulia' in name_clean:
            bn = 'তেঁতুলিয়া'
        elif 'pirgachha' in name_clean or 'pirgacha' in name_clean:
            bn = 'পীরগাছা'
        elif 'ranishankail' in name_clean or 'ranisankail' in name_clean:
            bn = 'রাণীশংকৈল'
        elif 'shayestaganj' in name_clean or 'sayestaganj' in name_clean:
            bn = 'শায়েস্তাগঞ্জ'
        elif 'baralekha' in name_clean or 'barlekha' in name_clean:
            bn = 'বড়লেখা'
        elif 'kamalganj' in name_clean or 'komolganj' in name_clean:
            bn = 'কমলগঞ্জ'
        elif 'bishwambharpur' in name_clean or 'bishwamvarpur' in name_clean:
            bn = 'বিশ্বম্ভরপুর'
        elif 'shantiganj' in name_clean or 'south sunamganj' in name_clean:
            bn = 'শান্তিগঞ্জ'
        elif 'jaintapur' in name_clean or 'jaintiapur' in name_clean:
            bn = 'জৈন্তাপুর'
        # City Corporations
        elif 'chattogram city corporation' in name_clean:
            bn = 'চট্টগ্রাম সিটি কর্পোরেশন'
        elif 'cumilla city corporation' in name_clean:
            bn = 'কুমিল্লা সিটি কর্পোরেশন'
        elif 'dhaka north city corporation' in name_clean:
            bn = 'ঢাকা উত্তর সিটি কর্পোরেশন'
        elif 'dhaka south city corporation' in name_clean:
            bn = 'ঢাকা দক্ষিণ সিটি কর্পোরেশন'
        elif 'gazipur city corporation' in name_clean:
            bn = 'গাজীপুর সিটি কর্পোরেশন'
        elif 'narayanganj city corporation' in name_clean:
            bn = 'নারায়ণগঞ্জ সিটি কর্পোরেশন'
        elif 'khulna city corporation' in name_clean:
            bn = 'খুলনা সিটি কর্পোরেশন'
        elif 'rajshahi city corporation' in name_clean:
            bn = 'রাজশাহী সিটি কর্পোরেশন'
        elif 'barishal city corporation' in name_clean:
            bn = 'বরিশাল সিটি কর্পোরেশন'
        elif 'mymensingh city corporation' in name_clean:
            bn = 'ময়মনসিংহ সিটি কর্পোরেশন'
        elif 'rangpur city corporation' in name_clean:
            bn = 'রংপুর সিটি কর্পোরেশন'
        elif 'sylhet city corporation' in name_clean:
            bn = 'সিলেট সিটি কর্পোরেশন'


    if not bn:
        # Check thana in Dhaka/Chattogram metropolitan areas
        thana_bn_map = {
            'adabor': 'আদাবর',
            'badda': 'বাড্ডা',
            'bangshal': 'বংশাল',
            'biman bandar': 'বিমানবন্দর',
            'cantonment': 'সেনানিবাস',
            'chakbazar': 'চকবাজার',
            'dakshinkhan': 'দক্ষিণখান',
            'darus salam': 'দারুস সালাম',
            'demra': 'ডেমরা',
            'dhanmondi': 'ধানমন্ডি',
            'gendaria': 'গেন্ডারিয়া',
            'gulshan': 'গুলশান',
            'hazaribagh': 'হাজারীবাগ',
            'jatrabari': 'যাত্রাবাড়ী',
            'kadamtali': 'কদমতলী',
            'kafrul': 'কাফরুল',
            'kalabagan': 'কলাবাগান',
            'kamrangirchar': 'কামরাঙ্গীরচর',
            'khilgaon': 'খিলগাঁও',
            'khilkhet': 'খিলক্ষেত',
            'kotwali': 'কোতোয়ালী',
            'lalbagh': 'লালবাগ',
            'mirpur': 'মিরপুর',
            'mohammadpur': 'মোহাম্মদপুর',
            'motijheel': 'মতিঝিল',
            'new market': 'নিউ মার্কেট',
            'pallabi': 'পল্লবী',
            'paltan': 'পল্টন',
            'ramna': 'রমনা',
            'rampura': 'রামপুরা',
            'sabujbagh': 'সবুজবাগ',
            'shah ali': 'শাহ আলী',
            'shahbagh': 'শাহবাগ',
            'sher-e-bangla nagar': 'শেরেবাংলা নগর',
            'shyampur': 'শ্যামপুর',
            'sutrapur': 'সূত্রাপুর',
            'tejgaon': 'তেজগাঁও',
            'tejgaon industrial area': 'তেজগাঁও শিল্পাঞ্চল',
            'turag': 'তুরাগ',
            'uttara': 'উত্তরা',
            'uttarkhan': 'উত্তরখান',
            'bakalia': 'বাকলিয়া',
            'bayejid bostami': 'বায়েজিদ বোস্তামী',
            'chandgaon': 'চাঁদগাঁও',
            'double mooring': 'ডবল মুরিং',
            'halishahar': 'হালিশহর',
            'khulshi': 'খুলশী',
            'panchlaish': 'পাঁচলাইশ',
            'pahartali': 'পাহাড়তলী',
            'patenga': 'পতেঙ্গা',
            'akbar shah': 'আকবর শাহ',
            'chawkbazar': 'চকবাজার',
            'karnaphuli': 'কর্ণফুলী',
            'boalia': 'বোয়ালিয়া',
            'motihar': 'মতিহার',
            'rajpara': 'রাজপাড়া',
            'shah makhdum': 'শাহ মখদুম',
        }
        for tk, tv in thana_bn_map.items():
            if tk in h['name_en'].lower():
                bn = tv
                break

    if not bn:
        unmatched_bn.append(h)
        # Fallback to name_en if no Bengali string
        bn = h['name_en']

    # Generate a clean slug id
    slug = re.sub(r'[^a-z0-9]+', '-', h['name_en'].lower()).strip('-')
    upazila_id = f"{district_id}_{slug}"

    upazila_item = {
        'id': upazila_id,
        'pcode': h['pcode'],
        'district_id': district_id,
        'name_en': h['name_en'],
        'name_bn': bn,
        'lat': round(h['lat'], 6),
        'lon': round(h['lon'], 6),
        'area_sqkm': round(h['area_sqkm'], 2),
        'source': 'HDX/OCHA COD-AB adm3 (centroid) x nuhil/bangladesh-geocode (Bangla)',
    }
    upazilas.append(upazila_item)
    district_upazila_counts[district_id] += 1

print(f"\nFinal Upazila Count: {len(upazilas)}")
print(f"Unmatched Bangla names remaining: {len(unmatched_bn)}")
if unmatched_bn:
    for u in unmatched_bn:
        print(f"  Unmatched: {u['district_en']} -> {u['name_en']}")

# Check counts per district
districts_without_upazilas = [d for d, c in district_upazila_counts.items() if c == 0]
print(f"\nDistricts covered: {len([d for d, c in district_upazila_counts.items() if c > 0])}/64")
print(f"Districts with 0 upazilas: {districts_without_upazilas}")

# Verify hand test cases
print("\n--- Hand Verification of User's Test Cases ---")
for dist_id, upz_substr in [('faridpur', 'nagarkanda'), ('rangpur', 'pirganj'), ('rangpur', 'mithapukur'), ('sylhet', 'companiganj'), ('khulna', 'dacope')]:
    matches = [u for u in upazilas if u['district_id'] == dist_id and upz_substr in u['id']]
    print(f"{dist_id} -> {upz_substr}:", matches)

# Write output to src/data/upazilas.json
output_path = 'src/data/upazilas.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(upazilas, f, ensure_ascii=False, indent=2)

import os
os.makedirs('src/data/upazilas', exist_ok=True)
for d in districts:
    d_upzs = [u for u in upazilas if u['district_id'] == d['id']]
    with open(f"src/data/upazilas/{d['id']}.json", 'w', encoding='utf-8') as f:
        json.dump(d_upzs, f, ensure_ascii=False, indent=2)

print(f"\nSuccessfully wrote {len(upazilas)} upazilas to {output_path} (file size: {round(len(json.dumps(upazilas, ensure_ascii=False))/1024, 1)} KB) and per-district files in src/data/upazilas/")

