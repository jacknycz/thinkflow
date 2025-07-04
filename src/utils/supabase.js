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

// Store a chunk embedding and metadata in node_file_embeddings
export async function storeChunkEmbedding({ nodeId, fileName, chunkIndex, content, embedding }) {
  const { error } = await supabase
    .from('node_file_embeddings')
    .insert([{ node_id: nodeId, file_name: fileName, chunk_index: chunkIndex, content, embedding }]);
  if (error) throw error;
}

// Vector similarity search using pgvector
export async function searchSimilarContent(queryEmbedding, limit = 5) {
  try {
    // Try using the RPC function first (if it exists)
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit
    });
    
    if (!error) {
      return data || [];
    }
    
    // Fallback: use direct SQL query
    console.log('RPC function not found, trying direct SQL query...');
    const { data: sqlData, error: sqlError } = await supabase
      .from('node_file_embeddings')
      .select('id, node_id, file_name, chunk_index, content')
      .order(`embedding <-> '[${queryEmbedding.join(',')}]'::vector`)
      .limit(limit);
    
    if (sqlError) {
      console.warn('Direct SQL query also failed:', sqlError);
      // Final fallback: return recent embeddings without similarity search
      const { data: recentData, error: recentError } = await supabase
        .from('node_file_embeddings')
        .select('id, node_id, file_name, chunk_index, content')
        .order('id', { ascending: false })
        .limit(limit);
      
      if (recentError) throw recentError;
      return recentData || [];
    }
    
    return sqlData || [];
  } catch (error) {
    console.warn('Vector search failed, continuing without context:', error);
    return [];
  }
} 