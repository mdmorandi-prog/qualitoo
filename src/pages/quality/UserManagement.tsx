import { useEffect, useState } from "react";
import { UserPlus, Trash2, Save, Shield, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MODULE_OPTIONS = [
  { key: "resumo", label: "Resumo Executivo" },
  { key: "ncs", label: "Não Conformidades" },
  { key: "indicadores", label: "Indicadores" },
  { key: "documentos", label: "Documentos" },
  { key: "auditorias", label: "Auditorias" },
  { key: "planos", label: "Planos de Ação" },
  { key: "riscos", label: "Riscos" },
  { key: "treinamentos", label: "Treinamentos" },
  { key: "atas", label: "Atas" },
  { key: "eventos", label: "Eventos Adversos" },
  { key: "capa", label: "CAPA" },
  { key: "causa_raiz", label: "Causa Raiz" },
  { key: "competencias", label: "Competências" },
];

interface UserData {
  id: string;
  username: string;
  display_name: string;
  roles: string[];
  modules: string[];
  created_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingModules, setEditingModules] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const { toast } = useToast();

  // Create form state
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("analyst");
  const [newModules, setNewModules] = useState<string[]>(MODULE_OPTIONS.map(m => m.key));
  const [creating, setCreating] = useState(false);

  const callEdge = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    return res;
  };

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await callEdge({ action: "list" });
    if (!error && data?.users) setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if (!newUsername || !newPassword || !newDisplayName) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data, error } = await callEdge({
      action: "create",
      username: newUsername,
      password: newPassword,
      display_name: newDisplayName,
      role: newRole,
      module_keys: newModules,
    });
    setCreating(false);
    if (error || data?.error) {
      toast({ title: "Erro ao criar usuário", description: data?.error || "Tente novamente", variant: "destructive" });
    } else {
      toast({ title: "Usuário criado com sucesso" });
      setCreateOpen(false);
      setNewUsername("");
      setNewDisplayName("");
      setNewPassword("");
      setNewRole("analyst");
      setNewModules(MODULE_OPTIONS.map(m => m.key));
      loadUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    await callEdge({ action: "delete", user_id: userId });
    toast({ title: "Usuário excluído" });
    loadUsers();
  };

  const handleSaveModules = async (userId: string) => {
    await callEdge({ action: "update_modules", user_id: userId, module_keys: selectedModules });
    toast({ title: "Permissões atualizadas" });
    setEditingModules(null);
    loadUsers();
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await callEdge({ action: "update_role", user_id: userId, role });
    toast({ title: "Perfil atualizado" });
    loadUsers();
  };

  const toggleNewModule = (key: string) => {
    setNewModules(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSelectedModule = (key: string) => {
    setSelectedModules(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-sm text-muted-foreground">Cadastre usuários e configure permissões por módulo</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold">Nome Completo</Label>
                  <Input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Daniel Morandi" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Usuário (login)</Label>
                  <Input
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    placeholder="dmorandi"
                    className="mt-1"
                  />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Inicial + sobrenome, sem espaços</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold">Senha</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Perfil de Acesso</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="analyst">Analista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Módulos Permitidos</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MODULE_OPTIONS.map(m => (
                    <label key={m.key} className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-secondary/50 cursor-pointer">
                      <Checkbox checked={newModules.includes(m.key)} onCheckedChange={() => toggleNewModule(m.key)} />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} disabled={creating} className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                {creating ? "Criando..." : "Criar Usuário"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-sm">{u.username}</TableCell>
                  <TableCell>{u.display_name}</TableCell>
                  <TableCell>
                    <Select
                      value={u.roles[0] || "analyst"}
                      onValueChange={(val) => handleRoleChange(u.id, val)}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="analyst">Analista</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {editingModules === u.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          {MODULE_OPTIONS.map(m => (
                            <label key={m.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <Checkbox
                                checked={selectedModules.includes(m.key)}
                                onCheckedChange={() => toggleSelectedModule(m.key)}
                              />
                              {m.label}
                            </label>
                          ))}
                        </div>
                        <Button size="sm" className="gap-1" onClick={() => handleSaveModules(u.id)}>
                          <Save className="h-3 w-3" /> Salvar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.modules.length > 0 ? (
                          <>
                            {u.modules.slice(0, 3).map(mk => (
                              <Badge key={mk} variant="secondary" className="text-[10px]">
                                {MODULE_OPTIONS.find(m => m.key === mk)?.label ?? mk}
                              </Badge>
                            ))}
                            {u.modules.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">+{u.modules.length - 3}</Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Todos (admin)</span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1 text-[10px]"
                          onClick={() => {
                            setEditingModules(u.id);
                            setSelectedModules(u.modules.length > 0 ? u.modules : MODULE_OPTIONS.map(m => m.key));
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.username !== "admin" && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
