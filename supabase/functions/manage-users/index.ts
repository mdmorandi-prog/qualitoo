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

    // ==================== USER ACTIONS ====================

    if (action === "create") {
      const { username, password, display_name, role, module_keys } = payload;
      const email = `${username}@sgq.local`;

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
      await adminClient.from("profiles").update({ username, display_name }).eq("user_id", userId);

      if (role) {
        await adminClient.from("user_roles").insert({ user_id: userId, role });
      }

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

    if (action === "reset_password") {
      const { user_id, new_password } = payload;
      const { error: resetError } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
      if (resetError) {
        return new Response(JSON.stringify({ error: resetError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

    // ==================== GROUP ACTIONS ====================

    if (action === "list_groups") {
      const { data: groups } = await adminClient.from("access_groups").select("*").order("name");
      const { data: sectors } = await adminClient.from("access_group_sectors").select("*");
      const { data: members } = await adminClient.from("user_group_access").select("*");
      const { data: profiles } = await adminClient.from("profiles").select("*");

      const enrichedGroups = (groups ?? []).map((g: any) => {
        const groupSectors = (sectors ?? []).filter((s: any) => s.group_id === g.id).map((s: any) => s.sector);
        const groupMembers = (members ?? []).filter((m: any) => m.group_id === g.id).map((m: any) => {
          const profile = (profiles ?? []).find((p: any) => p.user_id === m.user_id);
          return {
            id: m.id,
            user_id: m.user_id,
            username: profile?.username ?? "unknown",
            display_name: profile?.display_name ?? "",
            permission_level: m.permission_level,
            expires_at: m.expires_at,
          };
        });
        return {
          id: g.id,
          name: g.name,
          description: g.description ?? "",
          color: g.color ?? "#6366f1",
          is_active: g.is_active,
          sectors: groupSectors,
          members: groupMembers,
        };
      });

      return new Response(JSON.stringify({ groups: enrichedGroups }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_group") {
      const { name, description, color, sectors } = payload;
      const { data: group, error: groupError } = await adminClient
        .from("access_groups")
        .insert({ name, description, color, created_by: caller.id })
        .select()
        .single();

      if (groupError) {
        return new Response(JSON.stringify({ error: groupError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (sectors && sectors.length > 0) {
        const rows = sectors.map((s: string) => ({ group_id: group.id, sector: s }));
        await adminClient.from("access_group_sectors").insert(rows);
      }

      return new Response(JSON.stringify({ success: true, group_id: group.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_group") {
      const { group_id } = payload;
      await adminClient.from("access_groups").delete().eq("id", group_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_group_sectors") {
      const { group_id, sectors } = payload;
      await adminClient.from("access_group_sectors").delete().eq("group_id", group_id);
      if (sectors && sectors.length > 0) {
        const rows = sectors.map((s: string) => ({ group_id, sector: s }));
        await adminClient.from("access_group_sectors").insert(rows);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "add_group_member") {
      const { group_id, user_id, permission_level, expires_at } = payload;
      const { error: memberError } = await adminClient.from("user_group_access").insert({
        group_id,
        user_id,
        permission_level: permission_level || "read",
        granted_by: caller.id,
        expires_at: expires_at || null,
      });
      if (memberError) {
        return new Response(JSON.stringify({ error: memberError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove_group_member") {
      const { group_id, user_id } = payload;
      await adminClient.from("user_group_access").delete().eq("group_id", group_id).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_member_permission") {
      const { group_id, user_id, permission_level } = payload;
      await adminClient.from("user_group_access").update({ permission_level }).eq("group_id", group_id).eq("user_id", user_id);
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
