import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight, ChevronDown, FolderOpen, Folder, Plus, Pencil, Trash2,
  FolderPlus, MoreHorizontal,
  Monitor, Heart, Pill, FlaskConical, Stethoscope, ShieldCheck,
  ClipboardList, Microscope, Baby, Syringe, Building2, Brain,
  Wrench, Users, GraduationCap, Landmark, Truck, Leaf, Phone,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FolderNode {
  id: string;
  name: string;
  parent_id: string | null;
  sector: string | null;
  icon: string;
  display_order: number;
  children: FolderNode[];
}

interface FolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

const buildTree = (flat: any[]): FolderNode[] => {
  const map: Record<string, FolderNode> = {};
  const roots: FolderNode[] = [];
  for (const f of flat) {
    map[f.id] = { ...f, children: [] };
  }
  for (const f of flat) {
    if (f.parent_id && map[f.parent_id]) {
      map[f.parent_id].children.push(map[f.id]);
    } else {
      roots.push(map[f.id]);
    }
  }
  // Sort by display_order
  const sortNodes = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.display_order - b.display_order);
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
};

// Sector icon mapping — keywords → lucide icon
const SECTOR_ICON_MAP: { keywords: string[]; icon: string; component: LucideIcon }[] = [
  { keywords: ["tecnologia", "informação", "ti", "informática", "sistemas"], icon: "monitor", component: Monitor },
  { keywords: ["enfermagem", "nursing"], icon: "heart", component: Heart },
  { keywords: ["farmácia", "farmacia"], icon: "pill", component: Pill },
  { keywords: ["laboratório", "laboratorio"], icon: "flask-conical", component: FlaskConical },
  { keywords: ["médic", "clínic", "clinic", "medic"], icon: "stethoscope", component: Stethoscope },
  { keywords: ["qualidade", "sgq"], icon: "shield-check", component: ShieldCheck },
  { keywords: ["uti", "intensiv"], icon: "clipboard-list", component: ClipboardList },
  { keywords: ["diagnóstico", "diagnostico", "imagem"], icon: "microscope", component: Microscope },
  { keywords: ["pediatr", "neonat", "maternidade"], icon: "baby", component: Baby },
  { keywords: ["centro cirúrgico", "cirurg", "bloco"], icon: "syringe", component: Syringe },
  { keywords: ["administrativ", "diretoria", "gestão"], icon: "building-2", component: Building2 },
  { keywords: ["psicolog", "saúde mental", "mental"], icon: "brain", component: Brain },
  { keywords: ["manutenção", "manutencao", "engenharia"], icon: "wrench", component: Wrench },
  { keywords: ["rh", "recursos humanos", "pessoas"], icon: "users", component: Users },
  { keywords: ["ensino", "treinamento", "educação"], icon: "graduation-cap", component: GraduationCap },
  { keywords: ["financ", "contab", "faturamento"], icon: "landmark", component: Landmark },
  { keywords: ["logística", "logistica", "suprimento", "almoxarifado"], icon: "truck", component: Truck },
  { keywords: ["ambiental", "sustentab", "resíduos"], icon: "leaf", component: Leaf },
  { keywords: ["recepção", "recepcao", "atendimento", "sac"], icon: "phone", component: Phone },
];

export const getSectorIcon = (name: string): { icon: string; Component: LucideIcon } => {
  const lower = name.toLowerCase();
  for (const entry of SECTOR_ICON_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return { icon: entry.icon, Component: entry.component };
    }
  }
  return { icon: "building-2", Component: Building2 };
};

const ICON_COMPONENT_MAP: Record<string, LucideIcon> = Object.fromEntries([
  ...SECTOR_ICON_MAP.map(e => [e.icon, e.component]),
  ["building-2", Building2],
]);

const FolderIcon = ({ icon, isOpen }: { icon: string; isOpen: boolean }) => {
  const IconComp = ICON_COMPONENT_MAP[icon];
  if (IconComp) return <IconComp className="h-4 w-4 shrink-0 text-primary" />;
  return isOpen
    ? <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
    : <Folder className="h-4 w-4 shrink-0 text-amber-500" />;
};

const FolderTreeItem = ({
  node, depth, selected, expanded, onToggle, onSelect, onCreateSub, onRename, onDelete, isAdmin,
}: {
  node: FolderNode; depth: number; selected: string | null;
  expanded: Set<string>; onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onCreateSub: (parentId: string) => void;
  onRename: (node: FolderNode) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) => {
  const isOpen = expanded.has(node.id);
  const isSelected = selected === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors text-sm",
          isSelected
            ? "bg-primary/10 text-primary font-semibold"
            : "hover:bg-accent text-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          className="shrink-0 p-0.5 rounded hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(node.id); }}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <span className="inline-block w-3.5" />
          )}
        </button>
        <FolderIcon icon={node.icon} isOpen={isOpen} />
        <span className="truncate flex-1">{node.name}</span>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onCreateSub(node.id)}>
                <FolderPlus className="mr-2 h-3.5 w-3.5" /> Nova Subpasta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(node)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(node.id)} className="text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {isOpen && node.children.map(child => (
        <FolderTreeItem
          key={child.id} node={child} depth={depth + 1}
          selected={selected} expanded={expanded}
          onToggle={onToggle} onSelect={onSelect}
          onCreateSub={onCreateSub} onRename={onRename} onDelete={onDelete}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

const FolderTree = ({ selectedFolderId, onSelectFolder }: FolderTreeProps) => {
  const { user, isAdmin } = useAuth();
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderNode | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_folders")
      .select("*")
      .order("display_order");
    if (error) { toast.error("Erro ao carregar pastas"); console.error(error); }
    else {
      const built = buildTree(data || []);
      setTree(built);
      // Auto-expand root nodes
      const rootIds = new Set((data || []).filter((f: any) => !f.parent_id).map((f: any) => f.id));
      setExpanded(prev => new Set([...prev, ...rootIds]));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openCreateDialog = (parentId: string | null) => {
    setEditingFolder(null);
    setParentIdForNew(parentId);
    setFolderName("");
    setDialogOpen(true);
  };

  const openRenameDialog = (node: FolderNode) => {
    setEditingFolder(node);
    setParentIdForNew(null);
    setFolderName(node.name);
    setDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) { toast.error("Nome obrigatório"); return; }
    if (editingFolder) {
      const { error } = await supabase
        .from("document_folders")
        .update({ name: folderName.trim() } as any)
        .eq("id", editingFolder.id);
      if (error) toast.error("Erro ao renomear");
      else { toast.success("Pasta renomeada"); setDialogOpen(false); fetchFolders(); }
    } else {
      if (!user) return;
      const isRootFolder = !parentIdForNew;
      let sector: string | null = null;
      if (parentIdForNew) {
        const { data: parent } = await supabase
          .from("document_folders")
          .select("sector")
          .eq("id", parentIdForNew)
          .maybeSingle();
        sector = parent?.sector || null;
      } else {
        sector = folderName.trim();
      }
      const { data: newFolder, error } = await supabase.from("document_folders").insert({
        name: folderName.trim(),
        parent_id: parentIdForNew,
        sector,
        icon: isRootFolder ? getSectorIcon(folderName.trim()).icon : "folder",
        created_by: user.id,
      } as any).select().single();
      if (error) toast.error("Erro ao criar pasta");
      else {
        // Auto-create default subfolders for root folders
        if (isRootFolder && newFolder) {
          const defaultSubs = ["POP", "Políticas", "Formulários", "Protocolos"];
          const subInserts = defaultSubs.map((name, i) => ({
            name,
            parent_id: (newFolder as any).id,
            sector,
            icon: "folder",
            display_order: i,
            created_by: user.id,
          }));
          await supabase.from("document_folders").insert(subInserts as any);
        }
        toast.success("Pasta criada");
        setDialogOpen(false);
        if (parentIdForNew) setExpanded(prev => new Set([...prev, parentIdForNew!]));
        if (isRootFolder && newFolder) setExpanded(prev => new Set([...prev, (newFolder as any).id]));
        fetchFolders();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta pasta e todas as subpastas? Os documentos serão desvinculados.")) return;
    const { error } = await supabase.from("document_folders").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Pasta excluída");
      if (selectedFolderId === id) onSelectFolder(null);
      fetchFolders();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pastas</span>
        {isAdmin && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openCreateDialog(null)} title="Nova pasta raiz">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {/* "Todos os documentos" option */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 cursor-pointer transition-colors text-sm",
              !selectedFolderId ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent text-foreground"
            )}
            onClick={() => onSelectFolder(null)}
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span>Todos os Documentos</span>
          </div>

          {loading ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">Carregando...</p>
          ) : (
            tree.map(node => (
              <FolderTreeItem
                key={node.id} node={node} depth={0}
                selected={selectedFolderId} expanded={expanded}
                onToggle={toggleExpand} onSelect={onSelectFolder}
                onCreateSub={openCreateDialog} onRename={openRenameDialog}
                onDelete={handleDelete} isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Renomear Pasta" : "Nova Pasta"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome da Pasta</Label>
              <Input
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="Ex: Protocolos"
                onKeyDown={e => e.key === "Enter" && handleSaveFolder()}
                autoFocus
              />
            </div>
            <Button onClick={handleSaveFolder}>{editingFolder ? "Salvar" : "Criar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FolderTree;
