const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Fetching TESTE 2 results...");
    const { data, error } = await supabase
        .from('campaigns')
        .select('name, results')
        .eq('name', 'TESTE 2')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching campaign:", error.message);
    } else {
        console.log("Campaign Results:", JSON.stringify(data.results, null, 2));
    }
}

check();
