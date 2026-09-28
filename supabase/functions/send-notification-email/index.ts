// Supabase Edge Function: send-notification-email
// Deploy this as a Supabase Edge Function
// 
// Istruzioni:
// 1. Installa Supabase CLI: npm install -g supabase
// 2. Crea la funzione: supabase functions new send-notification-email
// 3. Sostituisci il contenuto con questo file
// 4. Deploy: supabase functions deploy send-notification-email
// 5. Configura le variabili d'ambiente in Supabase:
//    - RESEND_API_KEY (da resend.com)
//    - FROM_EMAIL (email mittente verificata)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@assistenzaanziani.com";

serve(async (req) => {
  try {
    const { message, exclude_user_id } = await req.json();

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all users except the one who made the change
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .neq("id", exclude_user_id);

    if (error) throw error;

    // Send emails via Resend
    const emailPromises = profiles?.map(async (profile) => {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `Assistenza Anziani <${FROM_EMAIL}>`,
            to: [profile.email],
            subject: "📅 Aggiornamento disponibilità - Assistenza Anziani",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🏠 Assistenza Anziani</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; color: #374151;">
                    Ciao <strong>${profile.full_name}</strong>,
                  </p>
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                    <p style="margin: 0; color: #1f2937; font-size: 15px;">
                      ${message}
                    </p>
                  </div>
                  <p style="font-size: 14px; color: #6b7280;">
                    Accedi al portale per vedere tutti gli aggiornamenti:
                  </p>
                  <a href="${Deno.env.get("APP_URL") || "https://assistenza-anziani.vercel.app"}" 
                     style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Vai al Portale
                  </a>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 12px; color: #9ca3af;">
                    Questa è una notifica automatica dal portale Assistenza Anziani. 
                    Non rispondere a questa email.
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to send email to ${profile.email}`);
        }
      } catch (err) {
        console.error(`Error sending email to ${profile.email}:`, err);
      }
    });

    await Promise.all(emailPromises || []);

    return new Response(
      JSON.stringify({ success: true, sent: profiles?.length || 0 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
