import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  User,
  FileText,
  Users,
  Phone,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shield,
  EyeOff,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StepIndicator from "@/components/StepIndicator";
import { generateProtocol } from "@/lib/protocol";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STEPS = ["Tipo", "Local", "Denunciado", "Descrição", "Extras", "Confirmar"];

const occurrenceTypes = [
  "Assédio Moral",
  "Assédio Sexual",
  "Corrupção / Fraude",
  "Segurança do Paciente",
  "Discriminação",
  "Outros",
];

const shifts = ["Diurno", "Noturno", "Plantão", "Administrativo"];

const ReportForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAnonymous = searchParams.get("modo") !== "identificado";
  const [step, setStep] = useState(0);
  const [protocol, setProtocol] = useState("");

  const [form, setForm] = useState({
    type: "",
    date: "",
    location: "",
    sector: "",
    shift: "",
    accusedName: "",
    accusedRole: "",
    description: "",
    hasWitnesses: false,
    witnessInfo: "",
    wantsFollowUp: false,
    contactInfo: "",
    identityName: "",
    identityRole: "",
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!form.type;
      case 1: return !!form.date && !!form.location;
      case 2: return true;
      case 3: return form.description.length >= 20;
      case 4: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    const proto = await generateProtocol();
    
    const { error } = await supabase.from("reports").insert({
      protocol: proto,
      is_anonymous: isAnonymous,
      type: form.type,
      date: form.date,
      location: form.location,
      sector: form.sector || null,
      shift: form.shift || null,
      accused_name: form.accusedName || null,
      accused_role: form.accusedRole || null,
      description: form.description,
      has_witnesses: form.hasWitnesses,
      witness_info: form.witnessInfo || null,
      wants_follow_up: form.wantsFollowUp,
      contact_info: form.contactInfo || null,
      identity_name: isAnonymous ? null : (form.identityName || null),
      identity_role: isAnonymous ? null : (form.identityRole || null),
    } as any);

    if (error) {
      console.error("Error saving report:", error);
      toast.error("Erro ao registrar denúncia. Tente novamente.");
      return;
    }

    setProtocol(proto);
    setStep(6);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-primary/5 p-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Selecione o tipo de ocorrência que melhor descreve a situação.
              </p>
            </div>
            <Label className="text-sm font-semibold">Tipo de Ocorrência *</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {occurrenceTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => update("type", t)}
                  className={`rounded-lg border p-4 text-left text-sm font-medium transition-all ${
                    form.type === t
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-primary/5 p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Informe quando e onde ocorreu a situação.
              </p>
            </div>
            <div>
              <Label htmlFor="date" className="text-sm font-semibold">Data da Ocorrência *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location" className="text-sm font-semibold">Unidade Hospitalar / Local *</Label>
              <Input
                id="location"
                placeholder="Ex: Hospital Central, Ala B"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sector" className="text-sm font-semibold">Setor</Label>
                <Input
                  id="sector"
                  placeholder="Ex: UTI, Emergência"
                  value={form.sector}
                  onChange={(e) => update("sector", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Turno</Label>
                <Select value={form.shift} onValueChange={(v) => update("shift", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-primary/5 p-4">
              <User className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Identifique a pessoa denunciada, se possível. Estes campos são opcionais.
              </p>
            </div>
            <div>
              <Label htmlFor="accusedName" className="text-sm font-semibold">Nome do Denunciado</Label>
              <Input
                id="accusedName"
                placeholder="Nome completo ou parcial"
                value={form.accusedName}
                onChange={(e) => update("accusedName", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="accusedRole" className="text-sm font-semibold">Cargo / Função</Label>
              <Input
                id="accusedRole"
                placeholder="Ex: Coordenador de Enfermagem"
                value={form.accusedRole}
                onChange={(e) => update("accusedRole", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-primary/5 p-4">
              <FileText className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Descreva a situação com o máximo de detalhes possível.
              </p>
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-semibold">Descrição Detalhada *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o ocorrido com o máximo de detalhes: o que aconteceu, como aconteceu, quem estava presente..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="mt-1 min-h-[200px]"
                maxLength={5000}
              />
              <p className="mt-2 text-right text-xs text-muted-foreground">
                {form.description.length}/5000 caracteres
                {form.description.length < 20 && form.description.length > 0 && (
                  <span className="ml-2 text-destructive">(mínimo 20 caracteres)</span>
                )}
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="mb-6 flex items-center gap-3 rounded-lg bg-primary/5 p-4">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Informações complementares para fortalecer a investigação.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Há testemunhas?</Label>
                <Switch
                  checked={form.hasWitnesses}
                  onCheckedChange={(v) => update("hasWitnesses", v)}
                />
              </div>
              {form.hasWitnesses && (
                <Textarea
                  placeholder="Informe nomes ou descrições das testemunhas"
                  value={form.witnessInfo}
                  onChange={(e) => update("witnessInfo", e.target.value)}
                  className="min-h-[80px]"
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Deseja receber retorno?</Label>
                <Switch
                  checked={form.wantsFollowUp}
                  onCheckedChange={(v) => update("wantsFollowUp", v)}
                />
              </div>
              {form.wantsFollowUp && (
                <div>
                  <Label htmlFor="contact" className="text-xs text-muted-foreground">
                    Informe um meio de contato seguro
                  </Label>
                  <Input
                    id="contact"
                    placeholder="E-mail ou telefone"
                    value={form.contactInfo}
                    onChange={(e) => update("contactInfo", e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {!isAnonymous && (
              <div className="space-y-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
                <p className="text-sm font-semibold text-foreground">Sua Identificação</p>
                <div>
                  <Label htmlFor="identityName" className="text-sm">Seu Nome</Label>
                  <Input
                    id="identityName"
                    value={form.identityName}
                    onChange={(e) => update("identityName", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="identityRole" className="text-sm">Seu Cargo / Função</Label>
                  <Input
                    id="identityRole"
                    value={form.identityRole}
                    onChange={(e) => update("identityRole", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-safe/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-safe" />
              <p className="text-sm font-medium text-foreground">
                Revise as informações antes de enviar.
              </p>
            </div>
            <div className="space-y-3 rounded-lg border bg-card p-5">
              <SummaryRow label="Modo" value={isAnonymous ? "Anônimo" : "Identificado"} />
              <SummaryRow label="Tipo" value={form.type} />
              <SummaryRow label="Data" value={form.date} />
              <SummaryRow label="Local" value={form.location} />
              {form.sector && <SummaryRow label="Setor" value={form.sector} />}
              {form.shift && <SummaryRow label="Turno" value={form.shift} />}
              {form.accusedName && <SummaryRow label="Denunciado" value={form.accusedName} />}
              {form.accusedRole && <SummaryRow label="Cargo" value={form.accusedRole} />}
              <SummaryRow label="Descrição" value={form.description.substring(0, 150) + (form.description.length > 150 ? "..." : "")} />
              <SummaryRow label="Testemunhas" value={form.hasWitnesses ? "Sim" : "Não"} />
              <SummaryRow label="Retorno" value={form.wantsFollowUp ? "Sim" : "Não"} />
              {!isAnonymous && form.identityName && (
                <SummaryRow label="Denunciante" value={form.identityName} />
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Success state
  if (step === 6) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-md text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-safe/10">
              <CheckCircle2 className="h-10 w-10 text-safe" />
            </div>
            <h1 className="mb-3 font-display text-3xl font-bold text-foreground">
              Denúncia Registrada
            </h1>
            <p className="mb-8 text-muted-foreground">
              Sua denúncia foi registrada com sucesso. Guarde o protocolo abaixo para acompanhamento.
            </p>
            <div className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Seu Protocolo
              </p>
              <p className="font-mono text-3xl font-bold tracking-widest text-primary">
                {protocol}
              </p>
            </div>
            <p className="mb-6 text-xs text-muted-foreground">
              Anote este código. Ele é a única forma de consultar o andamento da sua denúncia.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/consultar")} className="gap-2">
                Consultar Protocolo
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar ao Início
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto max-w-2xl px-4">
          {/* Mode badge */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                isAnonymous
                  ? "bg-primary/10 text-primary"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {isAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Denúncia {isAnonymous ? "Anônima" : "Identificada"}
            </div>
          </div>

          {/* Steps */}
          <div className="mb-8">
            <StepIndicator steps={STEPS} currentStep={step} />
          </div>

          {/* Form */}
          <div className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)] md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              {step < 5 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="gap-1"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2 bg-safe hover:bg-safe/90">
                  <Shield className="h-4 w-4" />
                  Enviar Denúncia
                </Button>
              )}
            </div>
          </div>

          {/* Trust message */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Shield className="mb-0.5 mr-1 inline h-3 w-3" />
            Suas informações são protegidas por criptografia e tratadas em conformidade com a LGPD.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-right text-sm text-foreground">{value}</span>
  </div>
);

export default ReportForm;
