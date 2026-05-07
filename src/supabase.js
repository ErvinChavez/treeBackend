//import createClient from Supabase SDK
const { createClient } = require("@supabase/supabase-js");

//creating the supabase client
const supabase = createClient(
  //project url
  process.env.SUPABASE_URL,
  //secret api key
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;