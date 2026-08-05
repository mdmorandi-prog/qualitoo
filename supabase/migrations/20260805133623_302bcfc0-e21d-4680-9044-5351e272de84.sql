ALTER TABLE public.workflow_approval_requests DROP CONSTRAINT IF EXISTS workflow_approval_requests_status_check;
ALTER TABLE public.workflow_approval_requests
  ADD CONSTRAINT workflow_approval_requests_status_check
  CHECK (status IN ('pendente','aprovado','rejeitado','escalado','expirado','pulado'));