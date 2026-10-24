import { supabase, isSupabaseConfigured } from './supabase';
import type { FarmerPriorityId } from '../types';
import { BD_DISTRICTS } from '../data/districts';

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
  communicationMethod: 'in_app' | 'sms' | 'voice' | 'whatsapp';
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
  { id: 'in_app', en: 'In-App Notifications', bn: 'অ্যাপ নোটিফিকেশন' },
  { id: 'sms', en: 'SMS Mobile Alert', bn: 'এসএমএস বার্তা' },
  { id: 'whatsapp', en: 'WhatsApp Alert', bn: 'হোয়াটসঅ্যাপ বার্তা' },
  { id: 'voice', en: 'Automated Voice Call', bn: 'ভয়েস কল' },
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
  communicationMethod: 'in_app',
  primaryPriority: 'save_water',
  priorities: ['save_water', 'improve_soil'],
  pastDamages: ['drought'],
  pastDamageNotes: 'গত বছর খরার কারণে বোরো মৌসুমে সেচ খরচ বেড়েছিল।',
  emailAlerts: false,
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

/**
 * Loads the Farmer Profile and all associated Farm Fields
 */
export async function loadFarmerProfile(
  userId?: string
): Promise<{ profile: FarmerProfileData; fields: FarmField[] }> {
  // 1. Check local cache first for instant UI response
  let cachedProfile: FarmerProfileData | null = null;
  let cachedFields: FarmField[] = [];

  try {
    const rawProfile = localStorage.getItem(`${PROFILE_CACHE_KEY}_${userId || 'default'}`);
    if (rawProfile) cachedProfile = JSON.parse(rawProfile);

    const rawFields = localStorage.getItem(`${FIELDS_CACHE_KEY}_${userId || 'default'}`);
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
        .order('is_primary', { ascending: false });

      if (!fRes.error && fRes.data && fRes.data.length > 0) {
        fieldsRows = fRes.data;
      } else {
        const ffRes = await supabase
          .from('farmer_fields')
          .select('*')
          .eq('user_id', userId)
          .order('is_primary', { ascending: false });
        if (!ffRes.error && ffRes.data) {
          fieldsRows = ffRes.data;
        } else {
          fieldsErr = fRes.error || ffRes.error;
        }
      }

      if (profileRow && !profileErr) {
        cachedProfile = {
          id: profileRow.id,
          fullName: profileRow.full_name || '',
          email: '', // populated from auth user
          phone: profileRow.phone || '',
          avatarUrl: profileRow.avatar_url || '',
          preferredLanguage: profileRow.preferred_language || 'bn',
          communicationMethod: profileRow.communication_method || 'in_app',
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
    } catch (err) {
      console.warn('Database query error, using local fallback:', err);
    }
  }

  // 3. Fallback to default if nothing found
  const finalProfile: FarmerProfileData = cachedProfile || {
    ...DEFAULT_FARMER_PROFILE_DATA,
    id: userId || 'default',
  };

  const finalFields: FarmField[] = cachedFields.length > 0 ? cachedFields : [];

  // Update local cache
  try {
    localStorage.setItem(
      `${PROFILE_CACHE_KEY}_${userId || 'default'}`,
      JSON.stringify(finalProfile)
    );
    localStorage.setItem(
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
    const key = `${PROFILE_CACHE_KEY}_${userId || 'default'}`;
    const raw = localStorage.getItem(key);
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

      const profilePayload = {
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
        upazila_id: profile.upazilaId ?? existing.upazilaId ?? null,
        district_id: profile.districtId ?? existing.districtId ?? null,
        onboarding_completed: profile.onboardingCompleted ?? existing.onboardingCompleted ?? false,
        email_alerts: profile.emailAlerts ?? existing.emailAlerts ?? false,
        sms_alerts: profile.smsAlerts ?? existing.smsAlerts ?? false,
        updated_at: new Date().toISOString(),
      };

      // 2. Upsert to public.profiles table
      const { error: pErr } = await supabase.from('profiles').upsert(profilePayload);
      if (pErr) {
        console.error('Failed to save profile to database:', pErr.message);
        // Try fallback table
        const { error: fpErr } = await supabase.from('farmer_profiles').upsert(profilePayload);
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

    localStorage.setItem(key, JSON.stringify(updated));
    try {
      if (userId && userId !== 'guest_user') {
        localStorage.setItem(`agriorbit_farmer_profile_${userId}`, JSON.stringify({
          fullName: updated.fullName,
          phone: updated.phone,
          emailAlerts: updated.emailAlerts,
          smsAlerts: updated.smsAlerts,
          updatedAt: updated.updatedAt,
        }));
      }
    } catch {}

    if (updated.primaryPriority) {
      localStorage.setItem('agriorbit_selected_priority', updated.primaryPriority);
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
    const fieldToSave = { ...field, updatedAt: new Date().toISOString() };

    // Sync to Supabase if configured (Supabase is source of truth)
    if (isSupabaseConfigured() && userId && userId !== 'guest_user') {
      const fieldPayload = {
        id: fieldToSave.id.startsWith('field_') ? undefined : fieldToSave.id,
        user_id: userId,
        name: fieldToSave.name,
        division: fieldToSave.division,
        district: fieldToSave.district,
        district_id: fieldToSave.districtId || fieldToSave.district,
        upazila: fieldToSave.upazila,
        upazila_id: fieldToSave.upazilaId || fieldToSave.upazila,
        village: fieldToSave.village,
        latitude: fieldToSave.latitude,
        longitude: fieldToSave.longitude,
        area: fieldToSave.area,
        unit: fieldToSave.unit,
        elevation: fieldToSave.elevation,
        soil_type: fieldToSave.soilType,
        irrigation: fieldToSave.irrigation,
        water_source: fieldToSave.waterSource,
        current_crop: fieldToSave.currentCrop,
        previous_crop: fieldToSave.previousCrop,
        planned_next_crop: fieldToSave.plannedNextCrop,
        growing_season: fieldToSave.growingSeason,
        is_primary: fieldToSave.isPrimary,
        priority: fieldToSave.priority || 'save_water',
        notes: fieldToSave.notes,
        updated_at: new Date().toISOString(),
      };

      const { error: fErr } = await supabase.from('fields').upsert(fieldPayload);
      if (fErr) {
        console.error('Failed to save field to database:', fErr.message);
        const { error: ffErr } = await supabase.from('farmer_fields').upsert(fieldPayload);
        if (ffErr) {
          console.error('Failed to save field to fallback database:', ffErr.message);
          return { field, error: fErr.message || ffErr.message };
        }
      }
    }

    // Only update localStorage cache after Supabase save succeeds
    const key = `${FIELDS_CACHE_KEY}_${userId || 'default'}`;
    const raw = localStorage.getItem(key);
    const existing: FarmField[] = raw ? JSON.parse(raw) : [];

    const idx = existing.findIndex((f) => f.id === field.id);
    let updatedList: FarmField[];

    if (idx >= 0) {
      updatedList = existing.map((f) => (f.id === field.id ? fieldToSave : f));
    } else {
      updatedList = [...existing, fieldToSave];
    }

    if (fieldToSave.isPrimary) {
      updatedList = updatedList.map((f) => ({
        ...f,
        isPrimary: f.id === fieldToSave.id,
      }));
    }

    localStorage.setItem(key, JSON.stringify(updatedList));

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
    const key = `${FIELDS_CACHE_KEY}_${userId || 'default'}`;
    const raw = localStorage.getItem(key);
    const existing: FarmField[] = raw ? JSON.parse(raw) : [];

    const updated = existing.filter((f) => f.id !== fieldId);
    // If deleted field was primary, make the first remaining field primary
    if (updated.length > 0 && !updated.some((f) => f.isPrimary)) {
      updated[0].isPrimary = true;
    }

    localStorage.setItem(key, JSON.stringify(updated));

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
