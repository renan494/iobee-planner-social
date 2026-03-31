import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST users
    if (req.method === "GET" && action === "list") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
      const roleMap = new Map<string, string>();
      roles?.forEach((r: any) => roleMap.set(r.user_id, r.role));

      const result = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        role: roleMap.get(u.id) || "user",
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE user
    if (req.method === "POST" && action === "create") {
      const { email, password } = await req.json();
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;

      // Assign 'user' role by default
      await supabaseAdmin.from("user_roles").insert({ user_id: data.user.id, role: "user" });

      return new Response(JSON.stringify({ id: data.user.id, email: data.user.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE user
    if (req.method === "DELETE" && action === "delete") {
      const userId = url.searchParams.get("userId");
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent self-deletion
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
