-- Add pa_automation_events table for tracking automation pipeline steps
-- This provides detailed insights into the automation process for each PA

CREATE TABLE IF NOT EXISTS public.pa_automation_events (
    id SERIAL PRIMARY KEY,
    prior_auth_id INTEGER NOT NULL REFERENCES public.prior_auth(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'pa_initiated',
        'fields_populated', 
        'insurance_verified',
        'clinical_questions_answered',
        'documents_attached',
        'submitted_to_payer',
        'status_updated',
        'approved',
        'denied',
        'error_occurred',
        'manual_intervention_required'
    )),
    status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress', 'failed', 'skipped')),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    processing_time_ms INTEGER,
    details JSONB,
    error_message TEXT,
    created_by TEXT, -- Could be 'system', 'llm', 'user:email', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_pa_automation_events_prior_auth_id ON public.pa_automation_events(prior_auth_id);
CREATE INDEX idx_pa_automation_events_event_type ON public.pa_automation_events(event_type);
CREATE INDEX idx_pa_automation_events_status ON public.pa_automation_events(status);
CREATE INDEX idx_pa_automation_events_created_at ON public.pa_automation_events(created_at DESC);
CREATE INDEX idx_pa_automation_events_confidence ON public.pa_automation_events(confidence_score DESC) WHERE confidence_score IS NOT NULL;

-- Composite index for common queries
CREATE INDEX idx_pa_automation_events_pa_type_created ON public.pa_automation_events(prior_auth_id, event_type, created_at DESC);

-- Add some sample automation events for existing PAs (if any exist)
-- This will be executed safely with a DO block
DO $$
DECLARE
    pa_record RECORD;
BEGIN
    -- Add sample events for existing prior auths
    FOR pa_record IN SELECT id, created_at FROM public.prior_auth ORDER BY id LIMIT 5
    LOOP
        -- PA initiated event
        INSERT INTO public.pa_automation_events (
            prior_auth_id, event_type, status, confidence_score, 
            processing_time_ms, details, created_by, created_at
        ) VALUES (
            pa_record.id, 'pa_initiated', 'completed', 100.0, 
            50, '{"trigger": "provider_approval", "automation_eligible": true}', 
            'system', pa_record.created_at
        );

        -- Fields populated event
        INSERT INTO public.pa_automation_events (
            prior_auth_id, event_type, status, confidence_score, 
            processing_time_ms, details, created_by, created_at
        ) VALUES (
            pa_record.id, 'fields_populated', 'completed', 95.5, 
            1200, '{"fields_auto_filled": 22, "fields_total": 22, "ocr_confidence": 96.5}', 
            'system', pa_record.created_at + INTERVAL '30 seconds'
        );
        
        -- Clinical questions answered
        INSERT INTO public.pa_automation_events (
            prior_auth_id, event_type, status, confidence_score, 
            processing_time_ms, details, created_by, created_at
        ) VALUES (
            pa_record.id, 'clinical_questions_answered', 'completed', 92.3, 
            2500, '{"questions_total": 18, "questions_auto_answered": 18, "llm_model": "gpt-4"}', 
            'llm', pa_record.created_at + INTERVAL '1 minute'
        );
    END LOOP;
END
$$;