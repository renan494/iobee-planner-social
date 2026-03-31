import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) return json({ error: "Invalid token" }, 401);

    // Check admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) return json({ error: "Admin access required" }, 403);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST
    if (req.method === "GET" && action === "list") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;

      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
      const roleMap = new Map<string, string>();
      roles?.forEach((r: any) => roleMap.set(r.user_id, r.role));

      const result = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        role: roleMap.get(u.id) || "user",
      }));

      return json(result);
    }

    // CREATE
    if (req.method === "POST" && action === "create") {
      const { email, password } = await req.json();
      if (!email || !password) return json({ error: "Email and password required" }, 400);

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;

      await supabaseAdmin.from("user_roles").insert({ user_id: data.user.id, role: "user" });
      return json({ id: data.user.id, email: data.user.email });
    }

    // UPDATE
    if (req.method === "PUT" && action === "update") {
      const { userId, email, password, role } = await req.json();
      if (!userId) return json({ error: "userId required" }, 400);

      // Update auth user (email/password)
      const updates: Record<string, any> = {};
      if (email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUser(userId, updates);
        if (error) throw error;
      }

      // Update role
      if (role) {
        // Prevent removing own admin
        if (userId === caller.id && role !== "admin") {
          return json({ error: "Você não pode remover seu próprio acesso admin" }, 400);
        }

        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from("user_roles").update({ role }).eq("user_id", userId);
        } else {
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
        }
      }

      return json({ success: true });
    }

    // DELETE
    if (req.method === "DELETE" && action === "delete") {
      const userId = url.searchParams.get("userId");
      if (!userId) return json({ error: "userId required" }, 400);
      if (userId === caller.id) return json({ error: "Cannot delete yourself" }, 400);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return json({ success: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
