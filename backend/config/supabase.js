const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://qagrnyaazccsvfcsehgd.supabase.co";
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseKey) {
    console.log("API ERROR");
    throw new Error('SUPABASE_API_KEY is not defined in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };