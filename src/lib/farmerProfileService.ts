import { supabase, isSupabaseConfigured } from './supabase';
import type { FarmerPriorityId } from '../types';
import { BD_DISTRICTS } from '../data/districts';
import { getDistrictAdmin, type DistrictId } from '../data/bdAdmin';
import { getUpazila, DISTRICT_WIDE_UPAZILA } from './location';

export interface FarmField {
  id: string;
  name: string;
  division: string;
  district: string;
  upazila: string;
  upazilaId?: string;
  districtId?: string;
  village: string;
  latitude: number;
  longitude: number;
  area: number;
  unit: 'bigha' | 'acre' | 'decimal' | 'hectare';
  elevation: 'high' | 'medium_high' | 'medium_low' | 'low';
  soilType: 'loam' | 'clay_loam' | 'sandy_loam' | 'clay' | 'silt_loam';
  irrigation: 'deep_tubewell' | 'shallow_tubewell' | 'canal_surface' | 'rainfed';
  waterSource: 'groundwater' | 'river' | 'pond' | 'rainwater';
  currentCrop: string;
  previousCrop: string;
  plannedNextCrop: string;
  growingSeason: 'rabi' | 'kharif1' | 'kharif2';
  isPrimary: boolean;
  notes: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmerProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  preferredLanguage: 'bn' | 'en';
  communicationMethod: 'email' | 'in_app' | 'sms' | 'voice' | 'whatsapp';
  primaryPriority: FarmerPriorityId;
  priorities: FarmerPriorityId[];
  pastDamages: string[];
  pastDamageNotes: string;
  upazilaId?: string;
  districtId?: string;
  onboardingCompleted?: boolean;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const COMMUNICATION_METHODS = [
  { id: 'email', en: 'Email Alerts (Recommended)', bn: 'ইমেইল সতর্কতা (সুপারিশকৃত)', disabled: false },
  { id: 'in_app', en: 'In-App Notifications', bn: 'অ্যাপ নোটিফিকেশন', disabled: false },
  { id: 'sms', en: 'SMS Mobile Alert (Coming Soon)', bn: 'এসএমএস বার্তা (শীঘ্রই আসছে)', disabled: true },
  { id: 'whatsapp', en: 'WhatsApp Alert (Coming Soon)', bn: 'হোয়াটসঅ্যাপ বার্তা (শীঘ্রই আসছে)', disabled: true },
  { id: 'voice', en: 'Automated Voice Call (Coming Soon)', bn: 'ভয়েস কল (শীঘ্রই আসছে)', disabled: true },
] as const;

export const DEFAULT_INITIAL_FIELD: FarmField = {
  id: 'field_primary_default',
  name: '',
  division: '',
  district: '',
  upazila: '',
  village: '',
  latitude: 25.7439,
  longitude: 89.2752,
  area: 2.5,
  unit: 'bigha',
  elevation: 'medium_high',
  soilType: 'loam',
  irrigation: 'deep_tubewell',
  waterSource: 'groundwater',
  currentCrop: 'aman',
  previousCrop: 'jute',
  plannedNextCrop: 'mustard',
  growingSeason: 'rabi',
  isPrimary: true,
  notes: 'উর্বর পলি দোআঁশ মাটি, রবি মৌসুমে সরিষা ও বোরো আবর্তনের জন্য উপযুক্ত।',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_FARMER_PROFILE_DATA: FarmerProfileData = {
  id: 'guest_user',
  fullName: '',
  email: '',
  phone: '',
  avatarUrl: '',
  preferredLanguage: 'bn',
  communicationMethod: 'email',
  primaryPriority: 'save_water',
  priorities: ['save_water', 'improve_soil'],
  pastDamages: ['drought'],
  pastDamageNotes: 'গত বছর খরার কারণে বোরো মৌসুমে সেচ খরচ বেড়েছিল।',
  emailAlerts: true,
  smsAlerts: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const PROFILE_CACHE_KEY = 'agriorbit_farmer_profile_v2';
const FIELDS_CACHE_KEY = 'agriorbit_farmer_fields_v2';

/**
 * Calculates a profile completeness percentage (0 - 100%)
 */
export function calculateProfileCompletion(
  profile: FarmerProfileData,
  fields: FarmField[]
): number {
  let score = 0;
  if (profile.fullName && profile.fullName.trim().length > 2) score += 20;
  if (profile.phone && profile.phone.trim().length >= 8) score += 15;
  if (profile.avatarUrl && profile.avatarUrl.trim().length > 0) score += 15;
  if (profile.priorities && profile.priorities.length > 0) score += 20;
  if (fields && fields.length > 0) {
    score += 20;
    // Extra completeness if at least one field has coordinates and soil type
    if (fields[0].latitude && fields[0].soilType) score += 10;
  }
  return Math.min(100, score);
}

const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any)._agriorbit_mem_storage) {
    return (globalThis as any)._agriorbit_mem_storage;
  }
  const store = new Map<string, string>();
  const memStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
  };
  if (typeof globalThis !== 'undefined') {
    (globalThis as any)._agriorbit_mem_storage = memStorage;
  }
  return memStorage;
};

/**
 * Loads the Farmer Profile and all associated Farm Fields
 */
export async function loadFarmerProfile(
  userId?: string
): Promise<{ profile: FarmerProfileData; fields: FarmField[]; error?: string }> {
  // 1. Check local cache first for instant UI response
  let cachedProfile: FarmerProfileData | null = null;
  let cachedFields: FarmField[] = [];
  let queryError: string | undefined = undefined;
  const storage = getStorage();

  try {
    const rawProfile = storage.getItem(`${PROFILE_CACHE_KEY}_${userId || 'default'}`);
    if (rawProfile) cachedProfile = JSON.parse(rawProfile);

    const rawFields = storage.getItem(`${FIELDS_CACHE_KEY}_${userId || 'default'}`);
    if (rawFields) cachedFields = JSON.parse(rawFields);
  } catch (err) {
    console.error('Local cache read error:', err);
  }

  // 2. If Supabase is configured and user is authenticated, query Supabase
  if (isSupabaseConfigured() && userId && userId !== 'guest_user') {
    try {
      // Query profiles table, falling back to farmer_profiles
      let profileRow: any = null;
      let profileErr: any = null;

      const pRes = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!pRes.error && pRes.data) {
        profileRow = pRes.data;
      } else {
        const fpRes = await supabase
          .from('farmer_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!fpRes.error && fpRes.data) {
          profileRow = fpRes.data;
        } else {
          profileErr = pRes.error || fpRes.error;
        }
      }

      // Query fields table, falling back to farmer_fields
      let fieldsRows: any[] | null = null;
      let fieldsErr: any = null;

      const fRes = await supabase
        .from('fields')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('updated_at', { ascending: false });

      if (!fRes.error && fRes.data) {
        fieldsRows = fRes.data;
      } else {
        const ffRes = await supabase
          .from('farmer_fields')
          .select('*')
          .eq('user_id', userId)
          .order('is_primary', { ascending: false })
          .order('updated_at', { ascending: false });
        if (!ffRes.error && ffRes.data) {
          fieldsRows = ffRes.data;
        } else {
          fieldsErr = fRes.error || ffRes.error;
        }
      }

      if (profileErr || fieldsErr) {
        queryError = profileErr?.message || fieldsErr?.message || 'Failed to retrieve profile data';
      }

      if (profileRow && !profileErr) {
        cachedProfile = {
          id: profileRow.id,
          fullName: profileRow.full_name || '',
          email: '', // populated from auth user
          phone: profileRow.phone || '',
          avatarUrl: profileRow.avatar_url || '',
          preferredLanguage: profileRow.preferred_language || 'bn',
          communicationMethod: (profileRow.communication_method as any) || (profileRow.email_alerts !== false ? 'email' : 'in_app'),
          primaryPriority: (profileRow.primary_priority as FarmerPriorityId) || 'save_water',
          priorities: (profileRow.priorities as FarmerPriorityId[]) || ['save_water'],
          pastDamages: profileRow.past_damages || [],
          pastDamageNotes: profileRow.past_damage_notes || '',
          upazilaId: profileRow.upazila_id || '',
          districtId: profileRow.district_id || '',
          onboardingCompleted: Boolean(profileRow.onboarding_completed),
          emailAlerts: Boolean(profileRow.email_alerts),
          smsAlerts: Boolean(profileRow.sms_alerts),
          createdAt: profileRow.created_at,
          updatedAt: profileRow.updated_at,
        };
      }

      if (fieldsRows && !fieldsErr && fieldsRows.length > 0) {
        cachedFields = fieldsRows.map((f: any) => ({
          id: f.id,
          name: f.name,
          division: f.division,
          district: f.district,
          districtId: f.district_id || f.district || '',
          upazila: f.upazila || f.upazila_id || '',
          upazilaId: f.upazila_id || f.upazila || '',
          village: f.village || '',
          latitude: f.latitude,
          longitude: f.longitude,
          area: f.area,
          unit: f.unit,
          elevation: f.elevation,
          soilType: f.soil_type,
          irrigation: f.irrigation,
          waterSource: f.water_source,
          currentCrop: f.current_crop,
          previousCrop: f.previous_crop,
          plannedNextCrop: f.planned_next_crop,
          growingSeason: f.growing_season,
          isPrimary: f.is_primary,
          notes: f.notes || '',
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        }));
      }

      // Reconcile single source of truth between profiles and fields:
      const resolvedDistrict = (cachedFields.length > 0 && cachedFields[0].district)
        ? cachedFields[0].district
        : profileRow?.district_id || cachedProfile?.districtId;

      const resolvedUpazila = (cachedFields.length > 0 && cachedFields[0].upazila)
        ? cachedFields[0].upazila
        : profileRow?.upazila_id || cachedProfile?.upazilaId || DISTRICT_WIDE_UPAZILA;

      if (resolvedDistrict && (cachedFields.length === 0 || !cachedFields[0].district)) {
        const dAdmin = getDistrictAdmin(resolvedDistrict as DistrictId);
        const upz = resolvedUpazila !== DISTRICT_WIDE_UPAZILA ? getUpazila(resolvedDistrict as DistrictId, resolvedUpazila) : null;
        cachedFields = [{
          id: crypto.randomUUID(),
          name: `${dAdmin?.nameEn || 'Primary'} Plot 1`,
          division: dAdmin?.division || '',
          district: resolvedDistrict,
          districtId: resolvedDistrict,
          upazila: resolvedUpazila,
          upazilaId: resolvedUpazila,
          village: '',
          latitude: upz?.lat || dAdmin?.lat || 23.685,
          longitude: upz?.lng || dAdmin?.lng || 90.3563,
          area: 1.5,
          unit: 'bigha',
          elevation: 'medium_high',
          soilType: 'loam',
          irrigation: 'deep_tubewell',
          waterSource: 'groundwater',
          currentCrop: 'aman',
          previousCrop: 'jute',
          plannedNextCrop: 'mustard',
          growingSeason: 'rabi',
          isPrimary: true,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }];
      } else if (cachedFields.length > 0 && cachedFields[0].district && cachedProfile) {
        cachedProfile.districtId = cachedFields[0].district;
        cachedProfile.upazilaId = cachedFields[0].upazila;
      }

      // Also check auth user metadata for fallback
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        if (!cachedProfile) {
          const meta = authData.user.user_metadata || {};
          cachedProfile = {
            ...DEFAULT_FARMER_PROFILE_DATA,
            id: authData.user.id,
            fullName: meta.full_name || authData.user.email?.split('@')[0] || 'Farmer',
            email: authData.user.email || '',
            avatarUrl: meta.avatar_url || '',
          };
        } else {
          cachedProfile.email = authData.user.email || '';
          if (!cachedProfile.avatarUrl && authData.user.user_metadata?.avatar_url) {
            cachedProfile.avatarUrl = authData.user.user_metadata.avatar_url;
          }
        }
      }
    } catch (err: any) {
      console.warn('Database query error, using local fallback:', err);
      queryError = err?.message || 'Database connection error';
    }
  }

  // 3. Fallback to default if nothing found
  const finalProfile: FarmerProfileData = cachedProfile || {
    ...DEFAULT_FARMER_PROFILE_DATA,
    id: userId || 'default',
  };

  const finalFields: FarmField[] = cachedFields.length > 0 ? cachedFields : [];

  if (finalFields.length > 0 && finalFields[0].district) {
    finalProfile.districtId = finalFields[0].district;
    finalProfile.upazilaId = finalFields[0].upazila || DISTRICT_WIDE_UPAZILA;
  }

  // Update local cache
  try {
    storage.setItem(
      `${PROFILE_CACHE_KEY}_${userId || 'default'}`,
      JSON.stringify(finalProfile)
    );
    storage.setItem(
      `${FIELDS_CACHE_KEY}_${userId || 'default'}`,
      JSON.stringify(finalFields)
    );
  } catch (e) {
    // ignore local storage errors
  }

  return { profile: finalProfile, fields: finalFields };
}

/**
 * Saves the Farmer Profile
 */
export async function saveFarmerProfile(
  profile: Partial<FarmerProfileData>,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storage = getStorage();
    const key = `${PROFILE_CACHE_KEY}_${userId || 'default'}`;
    const raw = storage.getItem(key);
    const existing = raw ? JSON.parse(raw) : DEFAULT_FARMER_PROFILE_DATA;

    // If Supabase is configured and user is authenticated (Supabase is source of truth)
    if (isSupabaseConfigured() && userId && userId !== 'guest_user') {
      // 1. Update Supabase Auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profile.fullName || existing.fullName,
            phone: profile.phone || existing.phone,
            avatar_url: profile.avatarUrl || existing.avatarUrl,
            preferred_language: profile.preferredLanguage || existing.preferredLanguage,
            primary_priority: profile.primaryPriority || existing.primaryPriority,
          },
        });
      } catch (authErr) {
        // non-critical warning
      }

      const basePayload: any = {
        id: userId,
        full_name: profile.fullName ?? existing.fullName,
        phone: profile.phone ?? existing.phone,
        avatar_url: profile.avatarUrl ?? existing.avatarUrl,
        preferred_language: profile.preferredLanguage ?? existing.preferredLanguage,
        communication_method: profile.communicationMethod ?? existing.communicationMethod,
        primary_priority: profile.primaryPriority ?? existing.primaryPriority,
        priorities: profile.priorities ?? existing.priorities,
        past_damages: profile.pastDamages ?? existing.pastDamages,
        past_damage_notes: profile.pastDamageNotes ?? existing.pastDamageNotes,
        onboarding_completed: profile.onboardingCompleted ?? existing.onboardingCompleted ?? false,
        email_alerts: profile.emailAlerts ?? existing.emailAlerts ?? false,
        sms_alerts: profile.smsAlerts ?? existing.smsAlerts ?? false,
        updated_at: new Date().toISOString(),
      };

      const fullPayload = {
        ...basePayload,
        upazila_id: profile.upazilaId ?? existing.upazilaId ?? null,
        district_id: profile.districtId ?? existing.districtId ?? null,
      };

      // 2. Upsert to public.profiles table (resilient to unmigrated upazila_id/district_id and legacy check constraints)
      const safeUpsertProfile = async (tableName: string) => {
        let res = await supabase.from(tableName).upsert(fullPayload);
        if (res.error && (res.error.code === '42703' || res.error.message?.includes('upazila_id') || res.error.message?.includes('district_id') || res.error.message?.includes('schema cache'))) {
          res = await supabase.from(tableName).upsert(basePayload);
        }
        if (res.error && (res.error.code === '23514' || res.error.message?.includes('communication_method'))) {
          console.warn(`AgriOrbit: communication_method check constraint in ${tableName} lacks 'email', falling back to 'in_app' in DB...`);
          const fallbackBase = { ...basePayload, communication_method: 'in_app' };
          const fallbackFull = { ...fullPayload, communication_method: 'in_app' };
          res = await supabase.from(tableName).upsert(fallbackFull);
          if (res.error && (res.error.code === '42703' || res.error.message?.includes('upazila_id') || res.error.message?.includes('district_id') || res.error.message?.includes('schema cache'))) {
            res = await supabase.from(tableName).upsert(fallbackBase);
          }
        }
        return res;
      };

      let { error: pErr } = await safeUpsertProfile('profiles');
      if (pErr) {
        console.error('Failed to save profile to database:', pErr.message);
        // Try fallback table
        let { error: fpErr } = await safeUpsertProfile('farmer_profiles');
        if (fpErr) {
          console.error('Failed to save profile to fallback database:', fpErr.message);
          return { success: false, error: pErr.message || fpErr.message };
        }
      }
    }

    // Only update localStorage cache if Supabase save succeeded (or user is guest)
    const updated: FarmerProfileData = {
      ...existing,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    storage.setItem(key, JSON.stringify(updated));
    try {
      if (userId && userId !== 'guest_user') {
        storage.setItem(`agriorbit_farmer_profile_${userId}`, JSON.stringify({
          fullName: updated.fullName,
          phone: updated.phone,
          emailAlerts: updated.emailAlerts,
          smsAlerts: updated.smsAlerts,
          updatedAt: updated.updatedAt,
        }));
      }
    } catch {}

    if (updated.primaryPriority) {
      storage.setItem('agriorbit_selected_priority', updated.primaryPriority);
    }

    if (updated.districtId) {
      // Keep local fields cache in sync with profile's updated district/upazila
      try {
        const rawFields = storage.getItem(`${FIELDS_CACHE_KEY}_${userId || 'default'}`);
        if (rawFields) {
          const cachedFieldsList: FarmField[] = JSON.parse(rawFields);
          const dAdmin = getDistrictAdmin(updated.districtId as DistrictId);
          const upz = updated.upazilaId && updated.upazilaId !== DISTRICT_WIDE_UPAZILA
            ? getUpazila(updated.districtId as DistrictId, updated.upazilaId)
            : null;
          let touched = false;
          for (const f of cachedFieldsList) {
            if (f.isPrimary) {
              f.district = updated.districtId;
              f.districtId = updated.districtId;
              f.upazila = updated.upazilaId || DISTRICT_WIDE_UPAZILA;
              f.upazilaId = updated.upazilaId || DISTRICT_WIDE_UPAZILA;
              if (dAdmin) f.division = dAdmin.division;
              if (upz?.lat && upz?.lng) {
                f.latitude = upz.lat;
                f.longitude = upz.lng;
              } else if (dAdmin?.lat && dAdmin?.lng) {
                f.latitude = dAdmin.lat;
                f.longitude = dAdmin.lng;
              }
              f.updatedAt = new Date().toISOString();
              touched = true;
            }
          }
          if (touched) {
            storage.setItem(`${FIELDS_CACHE_KEY}_${userId || 'default'}`, JSON.stringify(cachedFieldsList));
          }
        }
      } catch {}
    }

    if (updated.districtId && userId && userId !== 'guest_user') {
      try {
        const dAdmin = getDistrictAdmin(updated.districtId as DistrictId);
        const upz = updated.upazilaId && updated.upazilaId !== DISTRICT_WIDE_UPAZILA
          ? getUpazila(updated.districtId as DistrictId, updated.upazilaId)
          : null;
        const updatePayload: any = {
          district: updated.districtId,
          district_id: updated.districtId,
          upazila: updated.upazilaId || DISTRICT_WIDE_UPAZILA,
          upazila_id: updated.upazilaId || DISTRICT_WIDE_UPAZILA,
          updated_at: new Date().toISOString(),
        };
        if (dAdmin) updatePayload.division = dAdmin.division;
        if (upz?.lat && upz?.lng) {
          updatePayload.latitude = upz.lat;
          updatePayload.longitude = upz.lng;
        } else if (dAdmin?.lat && dAdmin?.lng) {
          updatePayload.latitude = dAdmin.lat;
          updatePayload.longitude = dAdmin.lng;
        }
        await supabase.from('fields').update(updatePayload).eq('user_id', userId).eq('is_primary', true);
        await supabase.from('farmer_fields').update(updatePayload).eq('user_id', userId).eq('is_primary', true);
      } catch {}
    }

    if (typeof window !== 'undefined' && updated.districtId) {
      window.dispatchEvent(
        new CustomEvent('agriorbit_location_changed', {
          detail: {
            district: updated.districtId,
            upazila: updated.upazilaId,
          },
        })
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception saving profile:', err?.message || 'Save error');
    return { success: false, error: err?.message || 'Failed to save profile' };
  }
}

/**
 * Saves or updates a Farm Field
 */
export async function saveFarmField(
  field: FarmField,
  userId?: string
): Promise<{ field: FarmField; error?: string }> {
  try {
    let fieldToSave = { ...field, updatedAt: new Date().toISOString() };
    fieldToSave.districtId = fieldToSave.districtId || fieldToSave.district;
    fieldToSave.upazilaId = fieldToSave.upazilaId || fieldToSave.upazila || DISTRICT_WIDE_UPAZILA;
    const storage = getStorage();

    // 1. Coordinates and admin resolution
    const dAdmin = fieldToSave.district ? getDistrictAdmin(fieldToSave.district as DistrictId) : null;
    if (dAdmin) {
      if (!fieldToSave.division) fieldToSave.division = dAdmin.division;
      if (!fieldToSave.name) fieldToSave.name = `${dAdmin.nameEn} Plot 1`;

      const hasSpecificUpazila = Boolean(fieldToSave.upazila && fieldToSave.upazila !== DISTRICT_WIDE_UPAZILA);
      if (hasSpecificUpazila) {
        const upz = getUpazila(fieldToSave.district as DistrictId, fieldToSave.upazila);
        if (upz && upz.lat && upz.lng && (!fieldToSave.latitude || (fieldToSave.district !== 'rangpur' && fieldToSave.latitude === 25.7439))) {
          fieldToSave.latitude = upz.lat;
          fieldToSave.longitude = upz.lng;
        }
      } else if (!fieldToSave.latitude || (fieldToSave.district !== 'rangpur' && fieldToSave.latitude === 25.7439)) {
        fieldToSave.latitude = dAdmin.lat;
        fieldToSave.longitude = dAdmin.lng;
      }
    }

    // 2. Sync to Supabase if configured (Supabase is single source of truth)
    if (isSupabaseConfigured() && userId && userId !== 'guest_user') {
      let resolvedId = fieldToSave.id;
      if (!resolvedId || resolvedId.startsWith('field_')) {
        // Query to check if the user already has an active primary field in Supabase
        const { data: existingPrimary } = await supabase
          .from('fields')
          .select('id')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (existingPrimary && existingPrimary.length > 0 && existingPrimary[0].id) {
          resolvedId = existingPrimary[0].id;
        } else {
          const { data: fbPrimary } = await supabase
            .from('farmer_fields')
            .select('id')
            .eq('user_id', userId)
            .eq('is_primary', true)
            .order('updated_at', { ascending: false })
            .limit(1);
          if (fbPrimary && fbPrimary.length > 0 && fbPrimary[0].id) {
            resolvedId = fbPrimary[0].id;
          } else {
            resolvedId = crypto.randomUUID();
          }
        }
      }

      fieldToSave.id = resolvedId;

      const baseFieldPayload: any = {
        id: resolvedId,
        user_id: userId,
        name: fieldToSave.name,
        division: fieldToSave.division,
        district: fieldToSave.district,
        upazila: fieldToSave.upazila || DISTRICT_WIDE_UPAZILA,
        village: fieldToSave.village || '',
        latitude: fieldToSave.latitude,
        longitude: fieldToSave.longitude,
        area: fieldToSave.area || 1.0,
        unit: fieldToSave.unit || 'bigha',
        elevation: fieldToSave.elevation || 'medium_high',
        soil_type: fieldToSave.soilType || 'loam',
        irrigation: fieldToSave.irrigation || 'deep_tubewell',
        water_source: fieldToSave.waterSource || 'groundwater',
        current_crop: fieldToSave.currentCrop || 'aman',
        previous_crop: fieldToSave.previousCrop || 'jute',
        planned_next_crop: fieldToSave.plannedNextCrop || 'mustard',
        growing_season: fieldToSave.growingSeason || 'rabi',
        is_primary: fieldToSave.isPrimary ?? true,
        priority: fieldToSave.priority || 'save_water',
        notes: fieldToSave.notes || '',
        updated_at: new Date().toISOString(),
      };

      const fullFieldPayload = {
        ...baseFieldPayload,
        district_id: fieldToSave.districtId || fieldToSave.district,
        upazila_id: fieldToSave.upazilaId || fieldToSave.upazila || DISTRICT_WIDE_UPAZILA,
      };

      // Ensure other fields are not primary if this is primary
      if (fieldToSave.isPrimary) {
        try {
          await supabase.from('fields').update({ is_primary: false }).eq('user_id', userId).neq('id', resolvedId);
          await supabase.from('farmer_fields').update({ is_primary: false }).eq('user_id', userId).neq('id', resolvedId);
        } catch {}
      }

      let { data: savedRow, error: fErr } = await supabase
        .from('fields')
        .upsert(fullFieldPayload)
        .select()
        .maybeSingle();

      if (fErr && (fErr.code === '42703' || fErr.message?.includes('upazila_id') || fErr.message?.includes('district_id') || fErr.message?.includes('schema cache'))) {
        const retryRes = await supabase
          .from('fields')
          .upsert(baseFieldPayload)
          .select()
          .maybeSingle();
        fErr = retryRes.error;
        if (retryRes.data) savedRow = retryRes.data;
      }

      if (fErr) {
        console.warn('AgriOrbit: Falling back to farmer_fields table:', fErr.message);
        let { data: fbSaved, error: ffErr } = await supabase
          .from('farmer_fields')
          .upsert(fullFieldPayload)
          .select()
          .maybeSingle();
        if (ffErr && (ffErr.code === '42703' || ffErr.message?.includes('upazila_id') || ffErr.message?.includes('district_id') || ffErr.message?.includes('schema cache'))) {
          const retryFf = await supabase
            .from('farmer_fields')
            .upsert(baseFieldPayload)
            .select()
            .maybeSingle();
          ffErr = retryFf.error;
          if (retryFf.data) fbSaved = retryFf.data;
        }
        if (ffErr) {
          console.error('Failed to save field to database:', fErr.message || ffErr.message);
          return { field: fieldToSave, error: fErr.message || ffErr.message };
        }
        if (fbSaved?.id) fieldToSave.id = fbSaved.id;
      } else if (savedRow?.id) {
        fieldToSave.id = savedRow.id;
      }

      // CRITICAL SYNC TO PROFILES TABLE
      if (fieldToSave.isPrimary && fieldToSave.district) {
        try {
          const profPayload: any = {
            district_id: fieldToSave.districtId || fieldToSave.district,
            upazila_id: fieldToSave.upazilaId || fieldToSave.upazila || null,
            updated_at: new Date().toISOString(),
          };
          await supabase.from('profiles').update(profPayload).eq('id', userId);
          await supabase.from('farmer_profiles').update(profPayload).eq('id', userId);
        } catch (e) {
          console.warn('Non-fatal: failed to sync field location to profiles table:', e);
        }
      }
    }

    // Only update localStorage cache after Supabase save succeeds (or guest)
    const key = `${FIELDS_CACHE_KEY}_${userId || 'default'}`;
    const raw = storage.getItem(key);
    const existing: FarmField[] = raw ? JSON.parse(raw) : [];

    const idx = existing.findIndex((f) => f.id === fieldToSave.id || (fieldToSave.isPrimary && f.isPrimary));
    let updatedList: FarmField[];

    if (idx >= 0) {
      updatedList = existing.map((f, i) => (i === idx ? fieldToSave : (fieldToSave.isPrimary ? { ...f, isPrimary: false } : f)));
    } else {
      updatedList = fieldToSave.isPrimary
        ? [...existing.map((f) => ({ ...f, isPrimary: false })), fieldToSave]
        : [...existing, fieldToSave];
    }

    storage.setItem(key, JSON.stringify(updatedList));

    // Also update profile cache
    const pKey = `${PROFILE_CACHE_KEY}_${userId || 'default'}`;
    const pRaw = storage.getItem(pKey);
    if (pRaw) {
      try {
        const pObj = JSON.parse(pRaw);
        pObj.districtId = fieldToSave.district;
        pObj.upazilaId = fieldToSave.upazila;
        storage.setItem(pKey, JSON.stringify(pObj));
      } catch {}
    }

    // Broadcast location change to active React components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('agriorbit_location_changed', {
          detail: {
            district: fieldToSave.district,
            upazila: fieldToSave.upazila,
            latitude: fieldToSave.latitude,
            longitude: fieldToSave.longitude,
          },
        })
      );
    }

    return { field: fieldToSave };
  } catch (err: any) {
    console.error('Exception saving field:', err?.message || 'Save error');
    return { field, error: err?.message || 'Failed to save field' };
  }
}

/**
 * Deletes a Farm Field
 */
export async function deleteFarmField(
  fieldId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storage = getStorage();
    const key = `${FIELDS_CACHE_KEY}_${userId || 'default'}`;
    const raw = storage.getItem(key);
    const existing: FarmField[] = raw ? JSON.parse(raw) : [];

    const updated = existing.filter((f) => f.id !== fieldId);
    // If deleted field was primary, make the first remaining field primary
    if (updated.length > 0 && !updated.some((f) => f.isPrimary)) {
      updated[0].isPrimary = true;
    }

    storage.setItem(key, JSON.stringify(updated));

    if (isSupabaseConfigured() && userId && userId !== 'guest_user') {
      try {
        await supabase.from('fields').delete().eq('id', fieldId).eq('user_id', userId);
      } catch {
        // ignore
      }
      try {
        await supabase.from('farmer_fields').delete().eq('id', fieldId).eq('user_id', userId);
      } catch {
        // ignore
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete field' };
  }
}

/**
 * Uploads an avatar image (with size & format validation)
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url?: string; error?: string }> {
  // 1. Validation
  const maxBytes = 2 * 1024 * 1024; // 2 MB
  if (file.size > maxBytes) {
    return { error: 'Image file size must be less than 2MB' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG, and WebP images are supported' };
  }

  // 2. Try Supabase Storage upload
  if (isSupabaseConfigured() && userId && userId !== 'guest_user') {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

      const { data, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (!uploadErr && data) {
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          return { url: publicData.publicUrl };
        }
      }
    } catch (storageErr) {
      console.warn('Storage bucket upload failed, using local DataURL fallback:', storageErr);
    }
  }

  // 3. Fallback to base64 DataURL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result as string });
    reader.onerror = () => resolve({ error: 'Failed to read image file' });
    reader.readAsDataURL(file);
  });
}

/**
 * Returns the active/primary field
 */
export function getActiveField(fields: FarmField[]): FarmField {
  if (!fields || fields.length === 0) return DEFAULT_INITIAL_FIELD;
  const primary = fields.find((f) => f.isPrimary);
  return primary || fields[0];
}
