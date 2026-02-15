import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Users2, Shield, FolderTree, Pencil, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/lib/auditLog";

const AVAILABLE_SECTORS = [
  "Enfermagem", "Farmácia", "Nutrição", "Laboratório", "Radiologia",
  "Fisioterapia", "Psicologia", "Serviço Social", "Centro Cirúrgico",
  "UTI", "Pronto Socorro", "Internação", "Ambulatório",
  "TI", "RH", "Financeiro", "Compras", "Jurídico", "Manutenção",
  "Qualidade", "SESMT", "Hotelaria", "Faturamento", "Administração",
  "Diretoria", "CCIH", "SAME", "Ouvidoria", "Marketing",
];

const PERMISSION_LABELS: Record<string, { label: string; color: string; description: string }> = {
  read: { label: "Leitura", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", description: "Visualiza documentos e registros dos setores do grupo" },
  write: { label: "Escrita", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", description: "Visualiza e edita registros dos setores do grupo" },
  admin: { label: "Admin", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", description: "Acesso total + pode gerenciar permissões do grupo" },
};

interface AccessGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  sectors: string[];
  members: GroupMember[];
}

interface GroupMember {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  permission_level: string;
  expires_at: string | null;
}

const AccessGroupManagement = () => {
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [users, setUsers] = useState<{ id: string; username: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create form
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newSectors, setNewSectors] = useState<string[]>([]);

  // Add member form
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<string>("read");
  const [selectedExpiry, setSelectedExpiry] = useState("");

  // Edit sectors
  const [editSectors, setEditSectors] = useState<string[]>([]);

  const callEdge = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    return supabase.functions.invoke("manage-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
  };

  const loadData = async () => {
    setLoading(true);
    const [groupsRes, usersRes] = await Promise.all([
      callEdge({ action: "list_groups" }),
      callEdge({ action: "list" }),
    ]);
    if (groupsRes.data?.groups) setGroups(groupsRes.data.groups);
    if (usersRes.data?.users) setUsers(usersRes.data.users.map((u: any) => ({ id: u.id, username: u.username, display_name: u.display_name })));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateGroup = async () => {
    if (!newName || newSectors.length === 0) {
      toast({ title: "Preencha o nome e selecione ao menos um setor", variant: "destructive" });
      return;
    }
    const { data, error } = await callEdge({
      action: "create_group",
      name: newName,
      description: newDescription,
      color: newColor,
      sectors: newSectors,
    });
    if (error || data?.error) {
      toast({ title: "Erro ao criar grupo", description: data?.error, variant: "destructive" });
    } else {
      toast({ title: "Grupo criado com sucesso" });
      await logAuditEvent({ action: "create_access_group", module: "access_groups", details: { name: newName, sectors: newSectors } });
      setCreateOpen(false);
      setNewName(""); setNewDescription(""); setNewColor("#6366f1"); setNewSectors([]);
      loadData();
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Excluir o grupo "${groupName}"? Todos os acessos vinculados serão removidos.`)) return;
    await callEdge({ action: "delete_group", group_id: groupId });
    await logAuditEvent({ action: "delete_access_group", module: "access_groups", details: { name: groupName } });
    toast({ title: "Grupo excluído" });
    loadData();
  };

  const handleUpdateSectors = async (groupId: string) => {
    await callEdge({ action: "update_group_sectors", group_id: groupId, sectors: editSectors });
    await logAuditEvent({ action: "update_group_sectors", module: "access_groups", recordId: groupId, details: { sectors: editSectors } });
    toast({ title: "Setores atualizados" });
    setEditingGroup(null);
    loadData();
  };

  const handleAddMember = async (groupId: string) => {
    if (!selectedUserId) {
      toast({ title: "Selecione um usuário", variant: "destructive" });
      return;
    }
    const { data, error } = await callEdge({
      action: "add_group_member",
      group_id: groupId,
      user_id: selectedUserId,
      permission_level: selectedPermission,
      expires_at: selectedExpiry || null,
    });
    if (error || data?.error) {
      toast({ title: "Erro ao adicionar membro", description: data?.error, variant: "destructive" });
    } else {
      const memberName = users.find(u => u.id === selectedUserId)?.display_name ?? selectedUserId;
      await logAuditEvent({ action: "add_group_member", module: "access_groups", recordId: groupId, details: { user: memberName, permission: selectedPermission } });
      toast({ title: "Membro adicionado" });
      setAddMemberGroupId(null);
      setSelectedUserId(""); setSelectedPermission("read"); setSelectedExpiry("");
      loadData();
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string, userName: string) => {
    await callEdge({ action: "remove_group_member", group_id: groupId, user_id: userId });
    await logAuditEvent({ action: "remove_group_member", module: "access_groups", recordId: groupId, details: { user: userName } });
    toast({ title: "Membro removido" });
    loadData();
  };

  const handleUpdatePermission = async (groupId: string, userId: string, level: string) => {
    await callEdge({ action: "update_member_permission", group_id: groupId, user_id: userId, permission_level: level });
    toast({ title: "Permissão atualizada" });
    loadData();
  };

  const toggleSector = (sector: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(sector) ? list.filter(s => s !== sector) : [...list, sector]);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando grupos de acesso...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Grupos de Acesso</h2>
          <p className="text-sm text-muted-foreground">Controle de acesso por setor, similar ao Active Directory</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Grupo</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Grupo de Acesso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold">Nome do Grupo</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Assistencial" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Cor</Label>
                  <Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="mt-1 h-10 w-full cursor-pointer" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Descrição</Label>
                <Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Descrição do grupo" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Setores do Grupo ({newSectors.length} selecionados)</Label>
                <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-48 overflow-auto">
                  {AVAILABLE_SECTORS.map(s => (
                    <label key={s} className="flex items-center gap-2 rounded-md border p-2 text-xs hover:bg-secondary/50 cursor-pointer">
                      <Checkbox checked={newSectors.includes(s)} onCheckedChange={() => toggleSector(s, newSectors, setNewSectors)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateGroup} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Criar Grupo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Permission Level Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(PERMISSION_LABELS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 rounded-lg border p-2">
            <Badge className={`${val.color} border-0 text-[10px]`}>{val.label}</Badge>
            <span className="text-xs text-muted-foreground">{val.description}</span>
          </div>
        ))}
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum grupo criado</h3>
            <p className="text-sm text-muted-foreground">Crie grupos para organizar o acesso por setor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groups.map(group => (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: group.color }} />
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && <CardDescription className="text-xs">{group.description}</CardDescription>}
                    </div>
                    {!group.is_active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteGroup(group.id, group.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sectors" className="w-full">
                  <TabsList className="mb-3">
                    <TabsTrigger value="sectors" className="gap-1.5 text-xs"><FolderTree className="h-3 w-3" /> Setores ({group.sectors.length})</TabsTrigger>
                    <TabsTrigger value="members" className="gap-1.5 text-xs"><Users2 className="h-3 w-3" /> Membros ({group.members.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sectors">
                    {editingGroup === group.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                          {AVAILABLE_SECTORS.map(s => (
                            <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer rounded border p-1.5 hover:bg-secondary/50">
                              <Checkbox checked={editSectors.includes(s)} onCheckedChange={() => toggleSector(s, editSectors, setEditSectors)} />
                              {s}
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1" onClick={() => handleUpdateSectors(group.id)}>
                            <Save className="h-3 w-3" /> Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingGroup(null)}>
                            <X className="h-3 w-3" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {group.sectors.map(s => (
                          <Badge key={s} variant="secondary" className="text-[11px]">{s}</Badge>
                        ))}
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => { setEditingGroup(group.id); setEditSectors([...group.sectors]); }}>
                          <Pencil className="mr-1 h-3 w-3" /> Editar
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="members">
                    <div className="space-y-3">
                      {group.members.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Usuário</TableHead>
                              <TableHead className="text-xs">Nome</TableHead>
                              <TableHead className="text-xs">Permissão</TableHead>
                              <TableHead className="text-xs">Expira</TableHead>
                              <TableHead className="text-xs w-16">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.members.map(m => (
                              <TableRow key={m.id}>
                                <TableCell className="font-mono text-xs">{m.username}</TableCell>
                                <TableCell className="text-xs">{m.display_name}</TableCell>
                                <TableCell>
                                  <Select value={m.permission_level} onValueChange={(val) => handleUpdatePermission(group.id, m.user_id, val)}>
                                    <SelectTrigger className="h-7 w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="read">Leitura</SelectItem>
                                      <SelectItem value="write">Escrita</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {m.expires_at ? (
                                    <span className="flex items-center gap-1 text-amber-600">
                                      <Clock className="h-3 w-3" />
                                      {new Date(m.expires_at).toLocaleDateString("pt-BR")}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">Permanente</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => handleRemoveMember(group.id, m.user_id, m.display_name)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      {/* Add Member */}
                      {addMemberGroupId === group.id ? (
                        <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                          <div className="flex-1 min-w-[150px]">
                            <Label className="text-[10px] font-semibold">Usuário</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                              <SelectTrigger className="mt-1 h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {users.filter(u => !group.members.some(m => m.user_id === u.id)).map(u => (
                                  <SelectItem key={u.id} value={u.id}>{u.display_name || u.username}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32">
                            <Label className="text-[10px] font-semibold">Permissão</Label>
                            <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="read">Leitura</SelectItem>
                                <SelectItem value="write">Escrita</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-36">
                            <Label className="text-[10px] font-semibold">Expira em (opcional)</Label>
                            <Input type="date" value={selectedExpiry} onChange={e => setSelectedExpiry(e.target.value)} className="mt-1 h-8 text-xs" />
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" className="h-8 gap-1" onClick={() => handleAddMember(group.id)}>
                              <Save className="h-3 w-3" /> Salvar
                            </Button>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setAddMemberGroupId(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddMemberGroupId(group.id)}>
                          <Plus className="h-3 w-3" /> Adicionar Membro
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessGroupManagement;
