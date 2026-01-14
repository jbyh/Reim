import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { encryptApiKey } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const body = await req.json();
    const { alpaca_api_key, alpaca_secret_key, alpaca_paper_trading } = body;

    // Validate inputs
    if (!alpaca_api_key || !alpaca_secret_key) {
      throw new Error('Both API key and secret key are required');
    }

    if (alpaca_api_key.includes('=') || alpaca_secret_key.includes('=')) {
      throw new Error('Please enter only the key value, not the full variable assignment');
    }

    // Encrypt the keys
    const encryptedApiKey = await encryptApiKey(alpaca_api_key.trim(), user.id);
    const encryptedSecretKey = await encryptApiKey(alpaca_secret_key.trim(), user.id);

    // Update the profile with encrypted keys
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        alpaca_api_key_encrypted: encryptedApiKey,
        alpaca_secret_key_encrypted: encryptedSecretKey,
        alpaca_paper_trading: alpaca_paper_trading ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to save credentials: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Credentials saved securely' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Save Alpaca keys error:', error);
    
    return new Response(
      JSON.stringify({ error: msg }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
