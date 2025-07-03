import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFile(file, nodeId) {
  const timestamp = Date.now();
  const fileName = `${nodeId}/${timestamp}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('node-files')
    .upload(fileName, file, { upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('node-files')
    .getPublicUrl(fileName);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    uploadedAt: Date.now(),
    supabasePath: fileName,
    publicUrl: urlData.publicUrl,
  };
}

export function getFileUrl(filePath) {
  const { data } = supabase.storage.from('node-files').getPublicUrl(filePath);
  return data.publicUrl;
} 