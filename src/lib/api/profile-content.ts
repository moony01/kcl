import { getSupabase } from '@/lib/supabase/client';

export const PROFILE_IMAGE_BUCKET = 'profile-images';
export const PROFILE_SHORTS_BUCKET = 'profile-shorts';
export const PROFILE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PROFILE_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const PROFILE_VIDEO_MAX_SECONDS = 60;
export const PROFILE_CAPTION_MAX_LENGTH = 240;

export const PROFILE_ACTIVITY_CATEGORIES = [
  'training',
  'audition',
  'showcase',
  'education',
  'other',
] as const;

export type ProfileActivityCategory = (typeof PROFILE_ACTIVITY_CATEGORIES)[number];
export type ProfileMediaType = 'image' | 'short';

export interface ProfileActivityRecord {
  id: string;
  user_id: string;
  title: string;
  organization: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  category: ProfileActivityCategory;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfilePostRecord {
  id: string;
  user_id: string;
  media_type: ProfileMediaType;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds: number | null;
  caption: string | null;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  media_url: string;
}

export interface PublicProfilePostRecord {
  id: string;
  media_type: ProfileMediaType;
  caption: string | null;
  created_at: string;
  media_url: string;
}

export interface ProfileFeedCursor {
  created_at: string;
  id: string;
}

export interface PublicProfileFeedPage {
  posts: PublicProfilePostRecord[];
  nextCursor: ProfileFeedCursor | null;
}

export interface ListPublicProfilePostsOptions {
  cursor?: ProfileFeedCursor | null;
  limit?: number;
  mediaType?: ProfileMediaType;
}

export const PROFILE_FEED_PAGE_SIZE = 4;

export interface ProfileActivityInput {
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  category: ProfileActivityCategory;
  description: string;
}

export class ProfileContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileContentError';
  }
}

function createProfileContentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  const randomPart = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
    .replace(/[^a-f0-9]/gi, '')
    .padStart(12, '0')
    .slice(-12);
  return `00000000-0000-4000-8000-${randomPart}`;
}

function getProfileMediaBucket(mediaType: ProfileMediaType): string {
  return mediaType === 'image' ? PROFILE_IMAGE_BUCKET : PROFILE_SHORTS_BUCKET;
}

export function validateProfileMediaFile(file: File | null): string | null {
  if (!file) return '파일을 선택해주세요.';

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
  const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

  if (!allowedImageTypes.has(file.type) && !allowedVideoTypes.has(file.type)) {
    return 'JPG, PNG, WebP, HEIC 이미지 또는 MP4, WebM, MOV 영상만 업로드할 수 있습니다.';
  }

  if (isImage && file.size > PROFILE_IMAGE_MAX_BYTES) {
    return '이미지는 10MB 이하만 업로드할 수 있습니다.';
  }

  if (isVideo && file.size > PROFILE_VIDEO_MAX_BYTES) {
    return '숏츠는 50MB 이하만 업로드할 수 있습니다.';
  }

  return null;
}

export function buildProfileFeedPath(userId: string, file: File, contentId = createProfileContentId()): string {
  const extensionFromName = file.name.split('.').pop()?.toLowerCase();
  const extensionByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  const extension = extensionFromName && /^[a-z0-9]+$/.test(extensionFromName)
    ? extensionFromName
    : extensionByType[file.type] || 'bin';
  return `${userId}/${contentId}.${extension}`;
}

export function readProfileVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (duration <= 0) {
        reject(new ProfileContentError('영상 길이를 확인할 수 없습니다.'));
        return;
      }
      resolve(Math.ceil(duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ProfileContentError('영상 파일을 읽을 수 없습니다.'));
    };
    video.src = objectUrl;
  });
}

function getPublicMediaUrl(mediaType: ProfileMediaType, storagePath: string): string {
  return getSupabase().storage.from(getProfileMediaBucket(mediaType)).getPublicUrl(storagePath).data.publicUrl;
}

type ProfilePostRow = Omit<ProfilePostRecord, 'media_url'>;
type PublicProfilePostRow = Pick<
  ProfilePostRecord,
  'id' | 'media_type' | 'storage_path' | 'caption' | 'created_at'
>;

function mapPost(record: ProfilePostRow): ProfilePostRecord {
  return {
    ...record,
    media_url: getPublicMediaUrl(record.media_type, record.storage_path),
  };
}

function mapPublicPost(record: PublicProfilePostRow): PublicProfilePostRecord {
  return {
    id: record.id,
    media_type: record.media_type,
    caption: record.caption,
    created_at: record.created_at,
    media_url: getPublicMediaUrl(record.media_type, record.storage_path),
  };
}

export async function listProfileActivities(userId: string): Promise<ProfileActivityRecord[]> {
  const { data, error } = await getSupabase()
    .from('profile_activities')
    .select('*')
    .eq('user_id', userId)
    .order('is_current', { ascending: false })
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ProfileActivityRecord[];
}

export async function createProfileActivity(
  userId: string,
  input: ProfileActivityInput,
): Promise<ProfileActivityRecord> {
  const { data, error } = await getSupabase()
    .from('profile_activities')
    .insert({
      user_id: userId,
      title: input.title.trim(),
      organization: input.organization.trim() || null,
      start_date: input.startDate,
      end_date: input.isCurrent ? null : input.endDate || null,
      is_current: input.isCurrent,
      category: input.category,
      description: input.description.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as ProfileActivityRecord;
}

export async function updateProfileActivity(
  userId: string,
  activityId: string,
  input: ProfileActivityInput,
): Promise<ProfileActivityRecord> {
  const { data, error } = await getSupabase()
    .from('profile_activities')
    .update({
      title: input.title.trim(),
      organization: input.organization.trim() || null,
      start_date: input.startDate,
      end_date: input.isCurrent ? null : input.endDate || null,
      is_current: input.isCurrent,
      category: input.category,
      description: input.description.trim() || null,
    })
    .eq('id', activityId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as ProfileActivityRecord;
}

export async function deleteProfileActivity(userId: string, activityId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('profile_activities')
    .delete()
    .eq('id', activityId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function listProfilePosts(userId: string): Promise<ProfilePostRecord[]> {
  const { data, error } = await getSupabase()
    .from('profile_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as ProfilePostRow[]).map(mapPost);
}

/** Public feed query. RLS still enforces published + public visibility. */
export async function listPublicProfilePosts(
  options: ListPublicProfilePostsOptions = {},
): Promise<PublicProfileFeedPage> {
  const limit = Math.min(Math.max(options.limit ?? PROFILE_FEED_PAGE_SIZE, 1), PROFILE_FEED_PAGE_SIZE);
  const supabase = getSupabase();
  // storage_path is selected only so the browser can derive the public media URL;
  // mapPublicPost removes it from the public response. user_id and upload metadata
  // are not needed by HomeFeedClient and remain outside this projection.
  let query = supabase
    .from('profile_posts')
    .select('id, media_type, storage_path, caption, created_at')
    .eq('status', 'published')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (options.mediaType) {
    query = query.eq('media_type', options.mediaType);
  }

  if (options.cursor) {
    const { created_at: createdAt, id } = options.cursor;
    query = query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`);
  }

  const { data, error } = await query.limit(limit + 1);
  if (error) throw error;

  const records = (data || []) as PublicProfilePostRow[];
  const page = records.slice(0, limit);
  const last = page[page.length - 1];

  return {
    posts: page.map(mapPublicPost),
    nextCursor:
      records.length > limit && last
        ? { created_at: last.created_at, id: last.id }
        : null,
  };
}

export async function uploadProfilePost(
  userId: string,
  file: File,
  caption: string,
  durationSeconds: number | null,
): Promise<ProfilePostRecord> {
  const validationError = validateProfileMediaFile(file);
  if (validationError) throw new ProfileContentError(validationError);

  const isVideo = file.type.startsWith('video/');
  if (isVideo && (durationSeconds === null || durationSeconds > PROFILE_VIDEO_MAX_SECONDS)) {
    throw new ProfileContentError('숏츠는 60초 이하만 업로드할 수 있습니다.');
  }

  const trimmedCaption = caption.trim();
  if (trimmedCaption.length > PROFILE_CAPTION_MAX_LENGTH) {
    throw new ProfileContentError(`캡션은 ${PROFILE_CAPTION_MAX_LENGTH}자 이하로 작성해주세요.`);
  }

  const supabase = getSupabase();
  const postId = createProfileContentId();
  const mediaType: ProfileMediaType = isVideo ? 'short' : 'image';
  const storagePath = buildProfileFeedPath(userId, file, postId);
  const storage = supabase.storage.from(getProfileMediaBucket(mediaType));

  const { error: draftError } = await supabase
    .from('profile_posts')
    .insert({
      id: postId,
      user_id: userId,
      media_type: mediaType,
      storage_path: storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      duration_seconds: isVideo ? durationSeconds : null,
      caption: trimmedCaption || null,
      status: 'draft',
      is_public: false,
    });

  if (draftError) throw draftError;

  const { error: uploadError } = await storage.upload(storagePath, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    await supabase
      .from('profile_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);
    throw uploadError;
  }

  const { data, error: publishError } = await supabase
    .from('profile_posts')
    .update({ status: 'published', is_public: true })
    .eq('id', postId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (publishError) throw publishError;

  return mapPost(data as ProfilePostRow);
}

export async function deleteProfilePost(
  userId: string,
  postId: string,
): Promise<{ cleanupWarning?: string }> {
  const supabase = getSupabase();
  const { data: existing, error: lookupError } = await supabase
    .from('profile_posts')
    .select('storage_path, media_type')
    .eq('id', postId)
    .eq('user_id', userId)
    .single();

  if (lookupError) throw lookupError;

  const { error: archiveError } = await supabase
    .from('profile_posts')
    .update({ status: 'archived', is_public: false })
    .eq('id', postId)
    .eq('user_id', userId);

  if (archiveError) throw archiveError;

  const { error: storageError } = await supabase
    .storage
    .from(getProfileMediaBucket(existing.media_type as ProfileMediaType))
    .remove([existing.storage_path]);

  if (storageError) {
    return { cleanupWarning: '게시물은 숨김 처리됐지만 미디어 파일 정리가 지연되고 있습니다.' };
  }

  const { error: deleteError } = await supabase
    .from('profile_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  return deleteError
    ? { cleanupWarning: '미디어는 삭제됐지만 게시물 정리가 지연되고 있습니다.' }
    : {};
}
