// Supabase Edge Function: delete-user-account
// Questa funzione elimina completamente un utente da Supabase
// 
// ISTRUZIONI PER IL DEPLOY:
// 1. Installa Supabase CLI: npm install -g supabase
// 2. Crea la funzione: supabase functions new delete-user-account
// 3. Sostituisci il contenuto con questo file
// 4. Deploy: supabase functions deploy delete-user-account
//
// La funzione usa la SERVICE_ROLE_KEY per avere i permessi di eliminare
// l'utente da auth.users (operazione non possibile dal client)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Verifica che l'utente sia autenticato
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Crea client Supabase con la service role key (permette operazioni admin)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Crea client Supabase con il token dell'utente (per verificare l'identità)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verifica l'identità dell'utente
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Unauthorized: " + (authError?.message || "User not found"));
    }

    const userId = user.id;

    // 1. Elimina tutte le disponibilità della badante
    await supabaseAdmin
      .from("caregiver_availability")
      .delete()
      .eq("user_id", userId);

    // 2. Elimina tutte le disponibilità dei familiari
    await supabaseAdmin
      .from("family_availability")
      .delete()
      .eq("user_id", userId);

    // 3. Elimina tutte le notifiche
    await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    // 4. Elimina il profilo
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    // 5. Elimina l'utente da auth.users (operazione admin)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      throw new Error("Failed to delete user from auth: " + deleteError.message);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account eliminato con successo" 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
});
