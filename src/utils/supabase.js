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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('node_file_embeddings')
      .insert([{ 
        node_id: nodeId, 
        file_name: fileName, 
        chunk_index: chunkIndex, 
        content, 
        embedding,
        user_id: user.id 
      }]);
    if (error) throw error;
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
}

// Vector similarity search using pgvector
export async function searchSimilarContent(queryEmbedding, limit = 5) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Try using the RPC function first (if it exists)
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id: user.id
    });
    
    if (!error) {
      return data || [];
    }
    
    // Fallback: use direct SQL query with user filter
    console.log('RPC function not found, trying direct SQL query...');
    const { data: sqlData, error: sqlError } = await supabase
      .from('node_file_embeddings')
      .select('id, node_id, file_name, chunk_index, content')
      .eq('user_id', user.id)
      .order(`embedding <-> '[${queryEmbedding.join(',')}]'::vector`)
      .limit(limit);
    
    if (sqlError) {
      console.warn('Direct SQL query also failed:', sqlError);
      // Final fallback: return recent embeddings without similarity search
      const { data: recentData, error: recentError } = await supabase
        .from('node_file_embeddings')
        .select('id, node_id, file_name, chunk_index, content')
        .eq('user_id', user.id)
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

// ===== FLOW MANAGEMENT FUNCTIONS =====

// Helper function to get next version number
async function getNextVersionNumber(flowId) {
  try {
    const { data, error } = await supabase
      .from('flow_versions')
      .select('version_number')
      .eq('flow_id', flowId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.warn('Error getting version number:', error);
      return 1;
    }

    return data ? data.version_number + 1 : 1;
  } catch (error) {
    console.warn('Error getting version number:', error);
    return 1;
  }
}

// Save current flow to database (with versioning)
export async function saveFlow(name, description = '', flowData, existingFlowId = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If we have an existing flow ID, update it instead of creating new
    if (existingFlowId) {
      // Create a version history entry first
      const { error: versionError } = await supabase
        .from('flow_versions')
        .insert([{
          flow_id: existingFlowId,
          flow_data: flowData,
          version_number: await getNextVersionNumber(existingFlowId),
          created_by: user.id
        }]);

      if (versionError) {
        console.warn('Failed to create version history:', versionError);
      }

      // Update the existing flow
      const { data, error } = await supabase
        .from('flows')
        .update({ 
          name,
          description,
          flow_data: flowData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFlowId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Deactivate all other flows for this user
    await supabase
      .from('flows')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Insert new flow as active
    const { data, error } = await supabase
      .from('flows')
      .insert([{
        user_id: user.id,
        name,
        description,
        flow_data: flowData,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving flow:', error);
    throw error;
  }
}

// Load a specific flow by ID
export async function loadFlow(flowId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('id', flowId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading flow:', error);
    throw error;
  }
}

// Get all flows for current user
export async function getUserFlows() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user flows:', error);
    throw error;
  }
}

// Get the currently active flow
export async function getActiveFlow() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

    if (error) {
      console.error('Error getting active flow:', error);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error('Error getting active flow:', error);
    return null;
  }
}

// Delete a flow
export async function deleteFlow(flowId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('flows')
      .delete()
      .eq('id', flowId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting flow:', error);
    throw error;
  }
}

// Update flow data (for auto-save functionality)
export async function updateFlow(flowId, flowData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flows')
      .update({ 
        flow_data: flowData,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating flow:', error);
    throw error;
  }
}

// ===== VERSION MANAGEMENT FUNCTIONS =====

// Get all versions of a flow
export async function getFlowVersions(flowId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flow_versions')
      .select('*')
      .eq('flow_id', flowId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting flow versions:', error);
    throw error;
  }
}

// Revert to a specific version
export async function revertToVersion(flowId, versionNumber) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the version data
    const { data: versionData, error: versionError } = await supabase
      .from('flow_versions')
      .select('flow_data')
      .eq('flow_id', flowId)
      .eq('version_number', versionNumber)
      .single();

    if (versionError) throw versionError;

    // Update the flow with the version data
    const { data, error } = await supabase
      .from('flows')
      .update({ 
        flow_data: versionData.flow_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error reverting to version:', error);
    throw error;
  }
} 