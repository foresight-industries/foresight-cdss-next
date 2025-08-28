-- Enhance prior_auth table with automation-specific fields
-- These fields support the PA automation dashboard functionality

-- Add new columns for automation support
ALTER TABLE public.prior_auth 
ADD COLUMN IF NOT EXISTS automation_score DECIMAL(5,2) CHECK (automation_score >= 0 AND automation_score <= 100),
ADD COLUMN IF NOT EXISTS automation_flags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS denial_reasons TEXT[],
ADD COLUMN IF NOT EXISTS medication_sequence TEXT[],
ADD COLUMN IF NOT EXISTS payer_name TEXT,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS automation_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_review_reason TEXT,
ADD COLUMN IF NOT EXISTS estimated_approval_probability DECIMAL(5,2);

-- Create indexes on new columns for better query performance
CREATE INDEX IF NOT EXISTS idx_prior_auth_automation_score ON public.prior_auth(automation_score DESC) WHERE automation_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prior_auth_last_sync_at ON public.prior_auth(last_sync_at DESC) WHERE last_sync_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prior_auth_payer_name ON public.prior_auth(payer_name) WHERE payer_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prior_auth_requires_review ON public.prior_auth(requires_manual_review) WHERE requires_manual_review = true;
CREATE INDEX IF NOT EXISTS idx_prior_auth_processing_time ON public.prior_auth(processing_started_at, processing_completed_at);

-- Create a composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_prior_auth_dashboard ON public.prior_auth(status, updated_at DESC, automation_score DESC);

-- Function to calculate processing time in minutes
CREATE OR REPLACE FUNCTION calculate_processing_time_minutes(pa_id INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    processing_minutes DECIMAL(10,2);
BEGIN
    SELECT processing_started_at, processing_completed_at 
    INTO start_time, end_time
    FROM public.prior_auth 
    WHERE id = pa_id;
    
    IF start_time IS NULL OR end_time IS NULL THEN
        RETURN NULL;
    END IF;
    
    processing_minutes := EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0;
    RETURN processing_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function to update automation metadata
CREATE OR REPLACE FUNCTION update_prior_auth_automation_metadata(
    pa_id INTEGER,
    score DECIMAL(5,2) DEFAULT NULL,
    flags JSONB DEFAULT NULL,
    sync_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    payer TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE public.prior_auth
    SET 
        automation_score = COALESCE(score, automation_score),
        automation_flags = COALESCE(flags, automation_flags),
        last_sync_at = COALESCE(sync_time, last_sync_at),
        payer_name = COALESCE(payer, payer_name),
        updated_at = NOW()
    WHERE id = pa_id;
END;
$$ LANGUAGE plpgsql;

-- Populate some sample data for existing PAs
DO $$
DECLARE
    pa_record RECORD;
    sample_medications TEXT[] := ARRAY['Mounjaro', 'Ozempic', 'Wegovy', 'Zepbound', 'Saxenda'];
    sample_payers TEXT[] := ARRAY['Blue Cross Blue Shield', 'Aetna', 'UnitedHealth', 'Cigna', 'Anthem'];
    random_score DECIMAL(5,2);
    random_payer TEXT;
    random_medication_seq TEXT[];
BEGIN
    FOR pa_record IN SELECT id, status, created_at FROM public.prior_auth ORDER BY id LIMIT 10
    LOOP
        -- Generate realistic automation scores
        random_score := (RANDOM() * 40 + 60)::DECIMAL(5,2); -- Between 60-100
        
        -- Pick random payer
        random_payer := sample_payers[FLOOR(RANDOM() * array_length(sample_payers, 1)) + 1];
        
        -- Generate medication sequence based on attempt count
        random_medication_seq := ARRAY[
            sample_medications[FLOOR(RANDOM() * array_length(sample_medications, 1)) + 1],
            sample_medications[FLOOR(RANDOM() * array_length(sample_medications, 1)) + 1],
            sample_medications[FLOOR(RANDOM() * array_length(sample_medications, 1)) + 1]
        ];
        
        UPDATE public.prior_auth
        SET 
            automation_score = random_score,
            automation_flags = jsonb_build_object(
                'ocr_processed', true,
                'llm_processed', true,
                'rules_engine_passed', true,
                'confidence_threshold_met', random_score >= 80
            ),
            last_sync_at = pa_record.created_at + INTERVAL '2 hours',
            medication_sequence = random_medication_seq,
            payer_name = random_payer,
            processing_started_at = pa_record.created_at + INTERVAL '5 minutes',
            processing_completed_at = CASE 
                WHEN pa_record.status IN ('approved', 'denied') 
                THEN pa_record.created_at + INTERVAL '2 hours'
                ELSE NULL
            END,
            requires_manual_review = random_score < 80,
            manual_review_reason = CASE 
                WHEN random_score < 80 THEN 'Low confidence score requires human review'
                ELSE NULL
            END,
            estimated_approval_probability = GREATEST(random_score - 10, 30)::DECIMAL(5,2)
        WHERE id = pa_record.id;
    END LOOP;
END
$$;