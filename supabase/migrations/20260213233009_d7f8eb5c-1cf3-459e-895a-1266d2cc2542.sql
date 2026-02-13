
-- Add signature_role column to document_signatures
ALTER TABLE public.document_signatures 
ADD COLUMN signature_role text NOT NULL DEFAULT 'elaborado';

-- Add comment for clarity
COMMENT ON COLUMN public.document_signatures.signature_role IS 'Role of signer: elaborado, aprovado, validado';
