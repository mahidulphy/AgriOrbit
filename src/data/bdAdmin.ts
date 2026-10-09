// Bangladesh administrative structure: Division → District.
// 64 districts with HQ coordinates used for map navigation and as the
// geometric fallback for reverse geocoding. Detailed agronomy profiles
// (AEZ, soil, upazilas) live in agriData.ts for coverage districts.

export interface BDDistrict {
  id: string;
  nameEn: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  lat: number;
  lng: number;
}

export interface BDDivision {
  nameEn: string;
  nameBn: string;
}

export const BD_DIVISIONS: BDDivision[] = [
  { nameEn: 'Dhaka', nameBn: 'ঢাকা' },
  { nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম' },
  { nameEn: 'Rajshahi', nameBn: 'রাজশাহী' },
  { nameEn: 'Khulna', nameBn: 'খুলনা' },
  { nameEn: 'Barishal', nameBn: 'বরিশাল' },
  { nameEn: 'Sylhet', nameBn: 'সিলেট' },
  { nameEn: 'Rangpur', nameBn: 'রংপুর' },
  { nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
];

export const BD_DISTRICTS = [
  // Dhaka Division (13)
  { id: 'dhaka', nameEn: 'Dhaka', nameBn: 'ঢাকা', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.8103, lng: 90.4125 },
  { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 24.0023, lng: 90.4266 },
  { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.6239, lng: 90.4997 },
  { id: 'munshiganj', nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.5529, lng: 90.5337 },
  { id: 'narsingdi', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.9227, lng: 90.7172 },
  { id: 'manikganj', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.8617, lng: 90.0003 },
  { id: 'tangail', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 24.2499, lng: 89.9167 },
  { id: 'kishoreganj', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 24.4447, lng: 90.7763 },
  { id: 'faridpur', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.6071, lng: 89.8426 },
  { id: 'rajbari', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.7132, lng: 89.6482 },
  { id: 'shariatpur', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.2423, lng: 90.4348 },
  { id: 'madaripur', nameEn: 'Madaripur', nameBn: 'মাদারীপুর', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.1641, lng: 90.1894 },
  { id: 'gopalganj', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', division: 'Dhaka', divisionBn: 'ঢাকা', lat: 23.0055, lng: 89.8266 },
  // Chattogram Division (11)
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 22.3569, lng: 91.7832 },
  { id: 'coxsbazar', nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 21.4272, lng: 92.0058 },
  { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 23.4683, lng: 91.1788 },
  { id: 'chandpur', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 23.2333, lng: 90.671 },
  { id: 'noakhali', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 22.8698, lng: 91.0995 },
  { id: 'feni', nameEn: 'Feni', nameBn: 'ফেনী', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 23.0159, lng: 91.3976 },
  { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 22.9444, lng: 90.8282 },
  { id: 'brahmanbaria', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 23.9575, lng: 91.1119 },
  { id: 'rangamati', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 22.7324, lng: 92.2985 },
  { id: 'khagrachari', nameEn: 'Khagrachari', nameBn: 'খাগড়াছড়ি', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 23.1193, lng: 91.9847 },
  { id: 'bandarban', nameEn: 'Bandarban', nameBn: 'বান্দরবান', division: 'Chattogram', divisionBn: 'চট্টগ্রাম', lat: 22.1951, lng: 92.2184 },
  // Rajshahi Division (8)
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 24.3745, lng: 88.6042 },
  { id: 'bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 24.851, lng: 89.3711 },
  { id: 'pabna', nameEn: 'Pabna', nameBn: 'পাবনা', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 24.0129, lng: 89.2598 },
  { id: 'sirajganj', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 24.4534, lng: 89.6991 },
  { id: 'natore', nameEn: 'Natore', nameBn: 'নাটোর', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 24.4102, lng: 89.0076 },
  { id: 'naogaon', nameEn: 'Naogaon', nameBn: 'নওগাঁ', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 24.9132, lng: 88.7531 },
  { id: 'chapainawabganj', nameEn: 'Chapai Nawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 24.5962, lng: 88.277 },
  { id: 'joypurhat', nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', division: 'Rajshahi', divisionBn: 'রাজশাহী', lat: 25.0947, lng: 89.0945 },
  // Khulna Division (10)
  { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', division: 'Khulna', divisionBn: 'খুলনা', lat: 22.8456, lng: 89.5403 },
  { id: 'jashore', nameEn: 'Jashore', nameBn: 'যশোর', division: 'Khulna', divisionBn: 'খুলনা', lat: 23.1697, lng: 89.2148 },
  { id: 'satkhira', nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', division: 'Khulna', divisionBn: 'খুলনা', lat: 22.7185, lng: 89.0707 },
  { id: 'bagerhat', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', division: 'Khulna', divisionBn: 'খুলনা', lat: 22.6516, lng: 89.7856 },
  { id: 'kushtia', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', division: 'Khulna', divisionBn: 'খুলনা', lat: 23.8907, lng: 89.1301 },
  { id: 'jhenaidah', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', division: 'Khulna', divisionBn: 'খুলনা', lat: 23.5454, lng: 89.153 },
  { id: 'magura', nameEn: 'Magura', nameBn: 'মাগুরা', division: 'Khulna', divisionBn: 'খুলনা', lat: 23.4859, lng: 89.4194 },
  { id: 'narail', nameEn: 'Narail', nameBn: 'নড়াইল', division: 'Khulna', divisionBn: 'খুলনা', lat: 23.1725, lng: 89.5126 },
  { id: 'meherpur', nameEn: 'Meherpur', nameBn: 'মেহেরপুর', division: 'Khulna', divisionBn: 'খুলনা', lat: 23.7623, lng: 88.6318 },
  { id: 'chuadanga', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', division: 'Khulna', divisionBn: 'খুলনা', lat: 23.6407, lng: 88.8417 },
  // Barishal Division (6)
  { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', division: 'Barishal', divisionBn: 'বরিশাল', lat: 22.7029, lng: 90.3466 },
  { id: 'patuakhali', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', division: 'Barishal', divisionBn: 'বরিশাল', lat: 22.3596, lng: 90.3299 },
  { id: 'bhola', nameEn: 'Bhola', nameBn: 'ভোলা', division: 'Barishal', divisionBn: 'বরিশাল', lat: 22.1785, lng: 90.71 },
  { id: 'pirojpur', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', division: 'Barishal', divisionBn: 'বরিশাল', lat: 22.584, lng: 89.9723 },
  { id: 'jhalokati', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', division: 'Barishal', divisionBn: 'বরিশাল', lat: 22.6417, lng: 90.1987 },
  { id: 'barguna', nameEn: 'Barguna', nameBn: 'বরগুনা', division: 'Barishal', divisionBn: 'বরিশাল', lat: 22.159, lng: 90.1278 },
  // Sylhet Division (4)
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', division: 'Sylhet', divisionBn: 'সিলেট', lat: 24.8999, lng: 91.8721 },
  { id: 'moulvibazar', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', division: 'Sylhet', divisionBn: 'সিলেট', lat: 24.4829, lng: 91.764 },
  { id: 'habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', division: 'Sylhet', divisionBn: 'সিলেট', lat: 24.3749, lng: 91.4152 },
  { id: 'sunamganj', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', division: 'Sylhet', divisionBn: 'সিলেট', lat: 25.0711, lng: 91.3994 },
  // Rangpur Division (8)
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', division: 'Rangpur', divisionBn: 'রংপুর', lat: 25.7439, lng: 89.2752 },
  { id: 'dinajpur', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', division: 'Rangpur', divisionBn: 'রংপুর', lat: 25.6217, lng: 88.6355 },
  { id: 'kurigram', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', division: 'Rangpur', divisionBn: 'রংপুর', lat: 25.8072, lng: 89.6292 },
  { id: 'gaibandha', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', division: 'Rangpur', divisionBn: 'রংপুর', lat: 25.3288, lng: 89.5281 },
  { id: 'lalmonirhat', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', division: 'Rangpur', divisionBn: 'রংপুর', lat: 25.9923, lng: 89.2847 },
  { id: 'nilphamari', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', division: 'Rangpur', divisionBn: 'রংপুর', lat: 25.931, lng: 88.8562 },
  { id: 'panchagarh', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', division: 'Rangpur', divisionBn: 'রংপুর', lat: 26.3411, lng: 88.5542 },
  { id: 'thakurgaon', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', division: 'Rangpur', divisionBn: 'রংপুর', lat: 26.0418, lng: 88.4285 },
  // Mymensingh Division (4)
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', lat: 24.7471, lng: 90.4203 },
  { id: 'jamalpur', nameEn: 'Jamalpur', nameBn: 'জামালপুর', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', lat: 24.9376, lng: 89.9371 },
  { id: 'netrokona', nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', lat: 24.8831, lng: 90.7297 },
  { id: 'sherpur', nameEn: 'Sherpur', nameBn: 'শেরপুর', division: 'Mymensingh', divisionBn: 'ময়মনসিংহ', lat: 25.0203, lng: 90.0156 },
] as const;

export type DistrictId = (typeof BD_DISTRICTS)[number]['id'];

export function getDistrictAdmin(id: string): BDDistrict | undefined {
  return (BD_DISTRICTS as readonly BDDistrict[]).find((d) => d.id === id);
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.sqrt(s));
}

export function nearestDistrict(lat: number, lng: number): BDDistrict {
  let best = BD_DISTRICTS[0] as BDDistrict;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const d of BD_DISTRICTS as readonly BDDistrict[]) {
    const dist = haversineKm(lat, lng, d.lat, d.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

/** Rough Bangladesh bounding box for sanity checks (not a boundary). */
export const BANGLADESH_BBOX = { minLat: 20.3, maxLat: 26.7, minLng: 87.9, maxLng: 92.8 };

export function insideBangladeshBBox(lat: number, lng: number): boolean {
  return (
    lat >= BANGLADESH_BBOX.minLat &&
    lat <= BANGLADESH_BBOX.maxLat &&
    lng >= BANGLADESH_BBOX.minLng &&
    lng <= BANGLADESH_BBOX.maxLng
  );
}
