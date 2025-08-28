-- Add dashboard_metrics table for caching calculated metrics
-- This improves dashboard performance by avoiding expensive calculations on each request

CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
    id SERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL UNIQUE,
    metric_value JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_dashboard_metrics_metric_name ON public.dashboard_metrics(metric_name);
CREATE INDEX idx_dashboard_metrics_expires_at ON public.dashboard_metrics(expires_at);
CREATE INDEX idx_dashboard_metrics_calculated_at ON public.dashboard_metrics(calculated_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_dashboard_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER dashboard_metrics_updated_at
    BEFORE UPDATE ON public.dashboard_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_metrics_updated_at();

-- Insert initial metric placeholders
INSERT INTO public.dashboard_metrics (metric_name, metric_value, expires_at) VALUES
('active_pas_count', '{"value": 0, "change": {"value": "0% from yesterday", "trend": "neutral", "positive": true}}', NOW() + INTERVAL '1 hour'),
('automation_rate', '{"value": "0%", "change": {"value": "Calculating...", "trend": "neutral", "positive": true}, "target": "70%"}', NOW() + INTERVAL '1 hour'),
('avg_processing_time', '{"value": "0min", "change": {"value": "Calculating...", "trend": "neutral", "positive": true}, "target": "≤6min P95"}', NOW() + INTERVAL '1 hour'),
('field_accuracy', '{"value": "0%", "change": {"value": "Calculating...", "trend": "neutral", "positive": true}}', NOW() + INTERVAL '1 hour'),
('llm_confidence', '{"value": "0%", "change": {"value": "Calculating...", "trend": "neutral", "positive": true}}', NOW() + INTERVAL '1 hour'),
('sync_latency', '{"value": "0h", "change": {"value": "Calculating...", "trend": "neutral", "positive": true}}', NOW() + INTERVAL '1 hour'),
('duplicate_prevention', '{"value": "100%", "change": {"value": "Zero duplicates via idempotency keys", "trend": "neutral", "positive": true}}', NOW() + INTERVAL '1 hour'),
('status_distribution', '{"needsReview": 0, "autoProcessing": 0, "autoApproved": 0, "denied": 0, "total": 0}', NOW() + INTERVAL '30 minutes')
ON CONFLICT (metric_name) DO NOTHING;

-- Add RLS if needed (commented out for now)
-- ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;