import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { username, password, display_name, role, module_keys } = payload;
      const email = `${username}@sgq.local`;

      // Create user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = newUser.user.id;

      // Update profile with username
      await adminClient.from("profiles").update({ username, display_name }).eq("user_id", userId);

      // Assign role
      if (role) {
        await adminClient.from("user_roles").insert({ user_id: userId, role });
      }

      // Assign module access
      if (module_keys && module_keys.length > 0) {
        const rows = module_keys.map((mk: string) => ({ user_id: userId, module_key: mk, can_access: true }));
        await adminClient.from("user_module_access").insert(rows);
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data: users } = await adminClient.auth.admin.listUsers();
      const { data: profiles } = await adminClient.from("profiles").select("*");
      const { data: roles } = await adminClient.from("user_roles").select("*");
      const { data: moduleAccess } = await adminClient.from("user_module_access").select("*");

      const enriched = users.users.map((u: any) => {
        const profile = profiles?.find((p: any) => p.user_id === u.id);
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) ?? [];
        const modules = moduleAccess?.filter((m: any) => m.user_id === u.id && m.can_access).map((m: any) => m.module_key) ?? [];
        return {
          id: u.id,
          email: u.email,
          username: profile?.username ?? u.email?.split("@")[0],
          display_name: profile?.display_name ?? "",
          roles: userRoles,
          modules,
          created_at: u.created_at,
        };
      });

      return new Response(JSON.stringify({ users: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_modules") {
      const { user_id, module_keys } = payload;
      // Delete existing, then insert new
      await adminClient.from("user_module_access").delete().eq("user_id", user_id);
      if (module_keys && module_keys.length > 0) {
        const rows = module_keys.map((mk: string) => ({ user_id, module_key: mk, can_access: true }));
        await adminClient.from("user_module_access").insert(rows);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { user_id, role } = payload;
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      if (role) {
        await adminClient.from("user_roles").insert({ user_id, role });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      await adminClient.auth.admin.deleteUser(user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
