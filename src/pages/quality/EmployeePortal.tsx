import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, GraduationCap, ClipboardCheck, Search, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

const EmployeePortal = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [myActions, setMyActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [docRes, trainRes, actionRes] = await Promise.all([
        supabase.from("quality_documents").select("*").eq("status", "aprovado").order("updated_at", { ascending: false }),
        supabase.from("trainings").select("*").order("training_date", { ascending: false }),
        supabase.from("action_plans").select("*").eq("responsible_id", user?.id ?? "").order("created_at", { ascending: false }),
      ]);
      setDocuments(docRes.data ?? []);
      setTrainings(trainRes.data ?? []);
      setMyActions(actionRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filteredDocs = documents.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.code?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTrainings = trainings.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase())
  );

  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);

  const expiringTrainings = trainings.filter(t => t.expiry_date && new Date(t.expiry_date) < thirtyDays && new Date(t.expiry_date) > now);
  const overdueActions = myActions.filter(a => a.when_end && new Date(a.when_end) < now && a.status !== "concluido");

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Portal do Colaborador</h2>
        <p className="text-sm text-muted-foreground">Acesso rápido a documentos, treinamentos e suas ações</p>
      </div>

      {/* Alerts */}
      {(expiringTrainings.length > 0 || overdueActions.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {expiringTrainings.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-700">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">{expiringTrainings.length} treinamento(s) a vencer</p>
                  <p className="text-xs text-muted-foreground">Nos próximos 30 dias</p>
                </div>
              </CardContent>
            </Card>
          )}
          {overdueActions.length > 0 && (
            <Card className="border-destructive/40">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">{overdueActions.length} ação(ões) com prazo vencido</p>
                  <p className="text-xs text-muted-foreground">Verificar planos de ação</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos ou treinamentos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="docs">
        <TabsList>
          <TabsTrigger value="docs" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Documentos ({filteredDocs.length})</TabsTrigger>
          <TabsTrigger value="trainings" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Treinamentos ({filteredTrainings.length})</TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" /> Minhas Ações ({myActions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.title}</p>
                      {doc.code && <p className="text-xs text-muted-foreground">Código: {doc.code}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">v{doc.version}</Badge>
                  </div>
                  {doc.category && <Badge variant="secondary" className="mt-2 text-[10px]">{doc.category}</Badge>}
                  {doc.valid_until && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      Validade: {new Date(doc.valid_until).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredDocs.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum documento encontrado.</p>}
          </div>
        </TabsContent>

        <TabsContent value="trainings" className="mt-4">
          <div className="space-y-2">
            {filteredTrainings.map(t => (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.training_date && `Data: ${new Date(t.training_date).toLocaleDateString("pt-BR")}`}
                      {t.instructor && ` · Instrutor: ${t.instructor}`}
                    </p>
                  </div>
                  <Badge variant={t.status === "concluido" ? "default" : "secondary"} className="text-[10px]">
                    {t.status}
                  </Badge>
                  {t.expiry_date && (
                    <span className={`text-[10px] ${new Date(t.expiry_date) < thirtyDays ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                      Exp: {new Date(t.expiry_date).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredTrainings.length === 0 && <p className="text-sm text-muted-foreground">Nenhum treinamento encontrado.</p>}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <div className="space-y-2">
            {myActions.map(a => (
              <Card key={a.id} className={a.status === "concluido" ? "" : a.when_end && new Date(a.when_end) < now ? "border-destructive/30" : ""}>
                <CardContent className="flex items-center gap-4 p-4">
                  {a.status === "concluido" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.what && `O quê: ${a.what}`}
                      {a.when_end && ` · Prazo: ${new Date(a.when_end).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <Badge variant={a.status === "concluido" ? "default" : "secondary"} className="text-[10px]">
                    {a.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {myActions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ação atribuída a você.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeePortal;
