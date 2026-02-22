import { useEffect, useState } from "react";
import { Settings, Eye, EyeOff, Save, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";

const SystemSettings = () => {
  const { user, hasMfa } = useAuth();
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(hasMfa);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["elevenlabs_api_key"]);

    if (data) {
      for (const s of data as any[]) {
        if (s.key === "elevenlabs_api_key") setElevenLabsKey(s.value);
      }
    }
    setLoading(false);
  };

  const saveSetting = async (key: string, value: string, description: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("system_settings")
      .upsert(
        { key, value, description, updated_by: user?.id, updated_at: new Date().toISOString() } as any,
        { onConflict: "key" }
      );
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Erro ao salvar configuração");
    } else {
      toast.success("Configuração salva com sucesso!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Configurações do Sistema</h2>
        <p className="text-sm text-muted-foreground">Gerencie chaves de API e integrações externas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Integrações de Voz
          </CardTitle>
          <CardDescription>
            Configure as chaves de API para serviços de transcrição por voz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="elevenlabs-key" className="text-sm font-medium">
              ElevenLabs API Key
            </Label>
            <p className="text-xs text-muted-foreground">
              Necessária para usar a transcrição premium (ElevenLabs STT) nas Atas de Reunião.
              Obtenha sua chave em{" "}
              <a
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                elevenlabs.io
              </a>
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="elevenlabs-key"
                  type={showKey ? "text" : "password"}
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                  placeholder="sk_..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => saveSetting("elevenlabs_api_key", elevenLabsKey, "Chave da API ElevenLabs para transcrição STT")}
                disabled={saving}
                className="gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Autenticação em Duas Etapas (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta com autenticação TOTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showMfaSetup ? (
            <TwoFactorSetup
              onEnabled={() => {
                setShowMfaSetup(false);
                setMfaEnabled(true);
                toast.success("2FA ativado com sucesso!");
              }}
              onCancelled={() => setShowMfaSetup(false)}
            />
          ) : mfaEnabled ? (
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">2FA Ativo</p>
                <p className="text-xs text-muted-foreground">
                  Sua conta está protegida com autenticação em duas etapas.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-2"
                onClick={async () => {
                  const { data } = await supabase.auth.mfa.listFactors();
                  if (data?.totp?.[0]) {
                    await supabase.auth.mfa.unenroll({ factorId: data.totp[0].id });
                    setMfaEnabled(false);
                    toast.success("2FA desativado.");
                  }
                }}
              >
                <ShieldOff className="h-4 w-4" />
                Desativar
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowMfaSetup(true)} className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Configurar 2FA
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
