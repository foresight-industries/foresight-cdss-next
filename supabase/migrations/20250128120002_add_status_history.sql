-- Add pa_status_history table for audit trail of status changes
-- This provides compliance tracking and helps debug PA workflow issues

CREATE TABLE IF NOT EXISTS public.pa_status_history (
    id SERIAL PRIMARY KEY,
    prior_auth_id INTEGER NOT NULL REFERENCES public.prior_auth(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT, -- 'system', 'webhook:cmm', 'user:email', etc.
    change_reason TEXT,
    additional_data JSONB, -- Any extra context about the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_pa_status_history_prior_auth_id ON public.pa_status_history(prior_auth_id);
CREATE INDEX idx_pa_status_history_new_status ON public.pa_status_history(new_status);
CREATE INDEX idx_pa_status_history_created_at ON public.pa_status_history(created_at DESC);
CREATE INDEX idx_pa_status_history_changed_by ON public.pa_status_history(changed_by);

-- Composite index for timeline queries
CREATE INDEX idx_pa_status_history_pa_created ON public.pa_status_history(prior_auth_id, created_at DESC);

-- Function to automatically track status changes on prior_auth table
CREATE OR REPLACE FUNCTION track_prior_auth_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.pa_status_history (
            prior_auth_id,
            old_status,
            new_status,
            changed_by,
            change_reason,
            additional_data
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(current_setting('app.current_user', true), 'system'),
            CASE 
                WHEN NEW.status = 'approved' THEN 'PA approved by payer'
                WHEN NEW.status = 'denied' THEN 'PA denied by payer'
                WHEN NEW.status = 'submitted' THEN 'PA submitted to payer'
                WHEN NEW.status = 'processing' THEN 'PA under review'
                ELSE 'Status updated'
            END,
            jsonb_build_object(
                'updated_at', NEW.updated_at,
                'cmm_case_id', NEW.cmm_request_case_id,
                'attempt_count', NEW.attempt_count
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track status changes
DROP TRIGGER IF EXISTS prior_auth_status_change_trigger ON public.prior_auth;
CREATE TRIGGER prior_auth_status_change_trigger
    AFTER UPDATE ON public.prior_auth
    FOR EACH ROW
    EXECUTE FUNCTION track_prior_auth_status_changes();

-- Add initial status history for existing PAs
DO $$
DECLARE
    pa_record RECORD;
BEGIN
    -- Add initial status history for existing prior auths
    FOR pa_record IN SELECT id, status, created_at FROM public.prior_auth ORDER BY id LIMIT 10
    LOOP
        INSERT INTO public.pa_status_history (
            prior_auth_id,
            old_status,
            new_status,
            changed_by,
            change_reason,
            additional_data,
            created_at
        ) VALUES (
            pa_record.id,
            NULL,
            COALESCE(pa_record.status, 'initiated'),
            'system',
            'Initial PA creation',
            jsonb_build_object('migration', true, 'initial_status', true),
            pa_record.created_at
        );
    END LOOP;
END
$$;