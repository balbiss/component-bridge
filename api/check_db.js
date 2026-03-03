const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking instances schema...");
    const { data, error } = await supabase.from('instances').select('id, name, ai_active').limit(1);

    if (error) {
        console.error("Schema check error (likely ai_active missing):", error.message);
    } else {
        console.log("ai_active exists. First instance:", data[0]);
    }
}

check();
