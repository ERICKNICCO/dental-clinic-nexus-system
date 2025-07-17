-- Create tables for Jubilee Insurance integration

-- Table for storing authentication tokens
CREATE TABLE IF NOT EXISTS public.jubilee_auth_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing member verifications
CREATE TABLE IF NOT EXISTS public.jubilee_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_no TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    authorization_no TEXT,
    daily_limit NUMERIC,
    benefits JSONB DEFAULT '[]'::jsonb,
    verification_response JSONB NOT NULL,
    member_details JSONB NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing item verifications
CREATE TABLE IF NOT EXISTS public.jubilee_item_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_no TEXT NOT NULL,
    benefit_code TEXT NOT NULL,
    procedure_code TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    verification_status TEXT NOT NULL,
    verification_response JSONB NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing submissions (preauth and claims)
CREATE TABLE IF NOT EXISTS public.jubilee_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_no TEXT NOT NULL,
    authorization_no TEXT NOT NULL,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('preauth', 'claim')),
    bill_no TEXT NOT NULL,
    folio_no TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    patient_data JSONB NOT NULL,
    doctor_data JSONB NOT NULL,
    treatments JSONB NOT NULL,
    submission_status TEXT NOT NULL,
    submission_id TEXT,
    submission_response JSONB NOT NULL,
    current_status TEXT,
    status_response JSONB,
    last_status_check TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for caching price lists and procedures
CREATE TABLE IF NOT EXISTS public.jubilee_price_lists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    list_type TEXT NOT NULL UNIQUE CHECK (list_type IN ('price', 'procedure')),
    list_data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jubilee_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jubilee_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jubilee_item_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jubilee_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jubilee_price_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for system access (since these are system-level operations)
CREATE POLICY "Allow system access to auth tokens" ON public.jubilee_auth_tokens FOR ALL USING (true);
CREATE POLICY "Allow system access to verifications" ON public.jubilee_verifications FOR ALL USING (true);
CREATE POLICY "Allow system access to item verifications" ON public.jubilee_item_verifications FOR ALL USING (true);
CREATE POLICY "Allow system access to submissions" ON public.jubilee_submissions FOR ALL USING (true);
CREATE POLICY "Allow system access to price lists" ON public.jubilee_price_lists FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jubilee_auth_tokens_provider_id ON public.jubilee_auth_tokens(provider_id);
CREATE INDEX IF NOT EXISTS idx_jubilee_auth_tokens_expires_at ON public.jubilee_auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_jubilee_verifications_member_no ON public.jubilee_verifications(member_no);
CREATE INDEX IF NOT EXISTS idx_jubilee_verifications_verified_at ON public.jubilee_verifications(verified_at);
CREATE INDEX IF NOT EXISTS idx_jubilee_item_verifications_member_no ON public.jubilee_item_verifications(member_no);
CREATE INDEX IF NOT EXISTS idx_jubilee_submissions_member_no ON public.jubilee_submissions(member_no);
CREATE INDEX IF NOT EXISTS idx_jubilee_submissions_submission_id ON public.jubilee_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_jubilee_submissions_submission_type ON public.jubilee_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_jubilee_price_lists_list_type ON public.jubilee_price_lists(list_type);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jubilee_auth_tokens_updated_at
    BEFORE UPDATE ON public.jubilee_auth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jubilee_submissions_updated_at
    BEFORE UPDATE ON public.jubilee_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();