-- 016: Add new document types to enum

ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'bank-statement';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'tax-document';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'income-verification';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'identity-document';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'medical-bill';
