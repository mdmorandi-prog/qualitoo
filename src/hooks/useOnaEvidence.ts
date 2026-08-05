import { supabase } from "@/integrations/supabase/client";

export interface OnaEvidence {
  id: string;
  requirement_id: string;
  level: number;
  confirmed_at: string;
  responsible_id: string;
  responsible_name: string;
  evidence_url?: string;
  evidence_name?: string;
  notes?: string;
}

export const useOnaEvidence = () => {
  const getEvidence = async (requirementId: string) => {
    const { data, error } = await supabase
      .from('ona_compliance_evidence')
      .select('*')
      .eq('requirement_id', requirementId)
      .order('confirmed_at', { ascending: false });
    
    if (error) throw error;
    return data as OnaEvidence[];
  };

  const uploadEvidence = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `ona_evidence/${fileName}`;

    // Ensure the bucket exists (or uses audit_evidence which is common in this stack)
    const { error: uploadError } = await supabase.storage
      .from('audit_evidence')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('audit_evidence')
      .getPublicUrl(filePath);

    return { publicUrl, fileName: file.name };
  };

  const saveEvidence = async (evidence: Omit<OnaEvidence, 'id' | 'confirmed_at'>) => {
    const { data, error } = await supabase
      .from('ona_compliance_evidence')
      .insert([evidence])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { getEvidence, uploadEvidence, saveEvidence };
};
