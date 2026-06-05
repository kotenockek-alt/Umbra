import { supabase } from './supabase/client';

export type Bucket = 'avatars' | 'backgrounds' | 'media';

// Загружает файл в бакет и возвращает публичный URL.
export async function uploadFile(bucket: Bucket, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Определяет, изображение это или видео (для kind сообщения).
export function mediaKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video') ? 'video' : 'image';
}
