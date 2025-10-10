const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://qagrnyaazccsvfcsehgd.supabase.co";
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.log("API ERROR");
    throw new Error('SUPABASE_API_KEY is not defined in environment variables');
}
if (!supabaseServiceKey) {
     console.log("SUPABASE_SERVICE_ROLE_KEY ERROR");
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };