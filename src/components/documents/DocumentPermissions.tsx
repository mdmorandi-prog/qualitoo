import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Users, User, Lock, CalendarClock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Permission {
  id: string;
  document_id: string;
  user_id: string | null;
  group_id: string | null;
  permission_level: string;
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  isRestricted: boolean;
  onToggleRestricted: (restricted: boolean) => void;
}

const DocumentPermissions = ({ open, onOpenChange, documentId, documentTitle, isRestricted, onToggleRestricted }: Props) => {
  const { user, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<"user" | "group">("user");
  const [newUserId, setNewUserId] = useState("");
  const [newGroupId, setNewGroupId] = useState("");
  const [newLevel, setNewLevel] = useState("read");
  const [newExpires, setNewExpires] = useState("");

  useEffect(() => {
    if (open) {
      fetchPermissions();
      fetchGroups();
    }
  }, [open, documentId]);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("document_permissions")
      .select("*")
      .eq("document_id", documentId)
      .order("granted_at", { ascending: false });
    setPermissions((data as Permission[]) ?? []);
    setLoading(false);
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from("access_groups").select("id, name").eq("is_active", true);
    setGroups(data ?? []);
  };

  const addPermission = async () => {
    if (!user) return;
    const insert: any = {
      document_id: documentId,
      permission_level: newLevel,
      granted_by: user.id,
      expires_at: newExpires || null,
    };
    if (addMode === "user") {
      if (!newUserId) { toast.error("Informe o ID do usuário"); return; }
      insert.user_id = newUserId;
    } else {
      if (!newGroupId) { toast.error("Selecione um grupo"); return; }
      insert.group_id = newGroupId;
    }
    const { error } = await supabase.from("document_permissions").insert(insert);
    if (error) { toast.error("Erro ao adicionar permissão"); console.error(error); }
    else {
      toast.success("Permissão adicionada!");
      setNewUserId("");
      setNewGroupId("");
      setNewExpires("");
      fetchPermissions();
    }
  };

  const removePermission = async (id: string) => {
    const { error } = await supabase.from("document_permissions").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Permissão removida"); fetchPermissions(); }
  };

  const levelLabel: Record<string, { label: string; color: string }> = {
    read: { label: "Leitura", color: "bg-muted text-muted-foreground" },
    write: { label: "Escrita", color: "bg-warning/10 text-warning" },
    admin: { label: "Admin", color: "bg-primary/10 text-primary" },
  };

  // Calculate expiration status
  const getExpiryStatus = (expiresAt: string | null): { label: string; urgent: boolean; daysLeft: number | null; progress: number } => {
    if (!expiresAt) return { label: "Permanente", urgent: false, daysLeft: null, progress: 100 };
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { label: "Expirada", urgent: true, daysLeft, progress: 0 };
    if (daysLeft <= 7) return { label: `${daysLeft}d restantes`, urgent: true, daysLeft, progress: Math.max(5, (daysLeft / 30) * 100) };
    if (daysLeft <= 30) return { label: `${daysLeft}d restantes`, urgent: false, daysLeft, progress: (daysLeft / 90) * 100 };
    return { label: `${daysLeft}d restantes`, urgent: false, daysLeft, progress: Math.min(100, (daysLeft / 90) * 100) };
  };

  const expiredCount = permissions.filter(p => {
    if (!p.expires_at) return false;
    return new Date(p.expires_at) < new Date();
  }).length;

  const expiringCount = permissions.filter(p => {
    if (!p.expires_at) return false;
    const daysLeft = Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Shield className="h-5 w-5" />
            Permissões — {documentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Acesso restrito</p>
              <p className="text-xs text-muted-foreground">
                {isRestricted
                  ? "Apenas usuários/grupos listados abaixo podem acessar"
                  : "Acesso baseado no setor do documento (padrão)"}
              </p>
            </div>
          </div>
          <Switch
            checked={isRestricted}
            onCheckedChange={onToggleRestricted}
            disabled={!isAdmin}
          />
        </div>

        {/* Expiration alerts */}
        {isRestricted && (expiredCount > 0 || expiringCount > 0) && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="text-xs">
              {expiredCount > 0 && (
                <p className="text-destructive font-medium">{expiredCount} permissão(ões) expirada(s)</p>
              )}
              {expiringCount > 0 && (
                <p className="text-warning font-medium">{expiringCount} permissão(ões) expirando em breve</p>
              )}
            </div>
          </div>
        )}

        {isRestricted && (
          <>
            {isAdmin && (
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Adicionar Permissão
                </h4>
                <div className="flex gap-2">
                  <Button variant={addMode === "user" ? "default" : "outline"} size="sm" onClick={() => setAddMode("user")} className="gap-1">
                    <User className="h-3 w-3" /> Usuário
                  </Button>
                  <Button variant={addMode === "group" ? "default" : "outline"} size="sm" onClick={() => setAddMode("group")} className="gap-1">
                    <Users className="h-3 w-3" /> Grupo
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {addMode === "user" ? (
                    <Input placeholder="ID do usuário" value={newUserId} onChange={e => setNewUserId(e.target.value)} />
                  ) : (
                    <Select value={newGroupId} onValueChange={setNewGroupId}>
                      <SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger>
                      <SelectContent>
                        {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={newLevel} onValueChange={setNewLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Leitura</SelectItem>
                      <SelectItem value="write">Escrita</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <CalendarClock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input type="date" value={newExpires} onChange={e => setNewExpires(e.target.value)} placeholder="Expira em" className="pl-8" />
                  </div>
                  <Button size="sm" onClick={addPermission} className="gap-1">
                    <Plus className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
                {!newExpires && (
                  <p className="text-[10px] text-muted-foreground">💡 Deixe a data em branco para permissão permanente</p>
                )}
              </div>
            )}

            {loading ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : permissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma permissão individual configurada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Validade</TableHead>
                    {isAdmin && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map(p => {
                    const expiry = getExpiryStatus(p.expires_at);
                    return (
                      <TableRow key={p.id} className={expiry.daysLeft !== null && expiry.daysLeft < 0 ? "opacity-50" : ""}>
                        <TableCell>
                          {p.user_id ? (
                            <Badge variant="outline" className="gap-1"><User className="h-3 w-3" /> Usuário</Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> Grupo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.user_id ? p.user_id.slice(0, 8) + "..." : groups.find(g => g.id === p.group_id)?.name || p.group_id?.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge className={levelLabel[p.permission_level]?.color}>
                            {levelLabel[p.permission_level]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              {expiry.daysLeft !== null && expiry.daysLeft < 0 ? (
                                <Badge variant="destructive" className="text-[10px] gap-1">
                                  <AlertTriangle className="h-2.5 w-2.5" /> Expirada
                                </Badge>
                              ) : expiry.urgent ? (
                                <Badge variant="outline" className="text-[10px] border-warning text-warning gap-1">
                                  <CalendarClock className="h-2.5 w-2.5" /> {expiry.label}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  {p.expires_at ? (
                                    <>
                                      <CalendarClock className="h-3 w-3" />
                                      {new Date(p.expires_at).toLocaleDateString("pt-BR")}
                                    </>
                                  ) : (
                                    "Permanente"
                                  )}
                                </span>
                              )}
                            </div>
                            {p.expires_at && expiry.daysLeft !== null && expiry.daysLeft > 0 && (
                              <Progress 
                                value={expiry.progress} 
                                className="h-1" 
                              />
                            )}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removePermission(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPermissions;
