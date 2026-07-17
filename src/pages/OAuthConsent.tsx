import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string; client_id?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};

// Tiny local wrapper — `supabase.auth.oauth` is beta and may not be typed.
const oauth = (supabase.auth as any).oauth as {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: any }>;
};

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Solicitação de autorização inválida (authorization_id ausente).");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/admin/login?next=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user.email ?? null);
      if (!oauth?.getAuthorizationDetails) {
        setError("OAuth server indisponível neste projeto.");
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message ?? "Falha ao carregar autorização.");
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message ?? "Falha ao processar decisão.");
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("O servidor de autorização não retornou um redirect.");
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-[var(--card-shadow)]">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h1 className="font-display text-lg font-bold text-foreground">Não foi possível conectar</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const clientName = details.client?.name ?? "um aplicativo";
  const scopes = (details.scope ?? "").split(" ").filter(Boolean);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">
            Conectar {clientName} ao Qualitoo
          </h1>
        </div>

        {userEmail && (
          <p className="mb-3 text-xs text-muted-foreground">
            Conectado como <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        )}

        <p className="text-sm text-foreground">
          Isso permite que <strong>{clientName}</strong> use as ferramentas do Qualitoo agindo como você.
          As permissões do sistema (RLS) continuam se aplicando — o aplicativo só verá os dados aos quais
          você já tem acesso.
        </p>

        {scopes.length > 0 && (
          <div className="mt-4 rounded-lg border bg-muted/50 p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Permissões solicitadas</p>
            <ul className="space-y-1 text-xs text-foreground">
              {scopes.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Button onClick={() => decide(true)} disabled={busy} className="flex-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprovar"}
          </Button>
          <Button onClick={() => decide(false)} disabled={busy} variant="outline" className="flex-1">
            Recusar
          </Button>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Isso não substitui as permissões e políticas de segurança do Qualitoo.
        </p>
      </div>
    </main>
  );
};

export default OAuthConsent;
