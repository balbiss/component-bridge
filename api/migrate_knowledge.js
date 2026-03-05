const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Iniciando migração...');

    const sql = `
    -- Adicionar instance_id às tabelas
    ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES instances(id) ON DELETE CASCADE;
    ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES instances(id) ON DELETE CASCADE;

    -- Atualizar a função de busca para filtrar por instance_id
    CREATE OR REPLACE FUNCTION match_knowledge_chunks (
      query_embedding vector(1536),
      match_threshold float,
      match_count int,
      p_instance_id uuid
    )
    RETURNS TABLE (
      id uuid,
      content text,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        knowledge_chunks.id,
        knowledge_chunks.content,
        1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
      FROM knowledge_chunks
      WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
        AND knowledge_chunks.instance_id = p_instance_id
      ORDER BY knowledge_chunks.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
    `;

    // Supabase JS doesn't have a direct 'query' method for DDL, 
    // we usually use RPC or the SQL Editor. 
    // Since I can't use the SQL editor directly here, I'll try to use a simple RPC if available 
    // or just assume the user will run it. 
    // Actually, I can use the MCP execute_sql if I have the right ID.
    // Let me try to list projects to see if I have the right ID.
}

console.log('Este script é apenas um placeholder. Vou usar os logs do servidor para DDL se necessário ou tentar o MCP novamente com o ID correto.');
