const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking instances schema for prompt fields...");
    const { data, error } = await supabase.from('instances').select('id, name, wuzapi_token').limit(1);

    if (error) {
        console.error("Column check error:", error.message);
    } else {
        console.log("Column exists. Sample:", data[0]);
    }
}

check();
