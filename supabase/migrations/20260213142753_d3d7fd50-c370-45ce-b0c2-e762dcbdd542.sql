
-- Table for document signatures with full audit trail
CREATE TABLE public.document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'eletronica', -- 'eletronica', 'digital_icp', 'avancada'
  document_hash TEXT NOT NULL, -- SHA-256 hash of document content at signing time
  signature_hash TEXT NOT NULL, -- SHA-256 hash of signature payload
  ip_address TEXT,
  user_agent TEXT,
  geolocation TEXT,
  verification_method TEXT NOT NULL DEFAULT 'senha', -- 'senha', 'email_otp', 'sms_otp'
  verification_code TEXT, -- stored hashed
  is_verified BOOLEAN NOT NULL DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for signature audit log (immutable)
CREATE TABLE public.signature_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES public.document_signatures(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'document_opened', 'signature_requested', 'identity_verified', 'document_signed', 'signature_verified', 'signature_revoked', 'audit_report_generated'
  actor_id UUID,
  actor_name TEXT,
  actor_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  document_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for document_signatures
CREATE POLICY "Admin/analyst can view all signatures"
  ON public.document_signatures FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE POLICY "Authenticated users can create signatures"
  ON public.document_signatures FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can revoke signatures"
  ON public.document_signatures FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Policies for signature_audit_log (immutable - insert and read only)
CREATE POLICY "Admin/analyst can view audit logs"
  ON public.signature_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE POLICY "Authenticated users can create audit logs"
  ON public.signature_audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Index for fast lookups
CREATE INDEX idx_doc_signatures_document ON public.document_signatures(document_id);
CREATE INDEX idx_doc_signatures_signer ON public.document_signatures(signer_id);
CREATE INDEX idx_signature_audit_document ON public.signature_audit_log(document_id);
CREATE INDEX idx_signature_audit_signature ON public.signature_audit_log(signature_id);
