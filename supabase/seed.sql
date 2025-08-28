-- Seed data for PA Automation Dashboard

-- Insert sample providers
INSERT INTO public.providers (id, name, npi, practice) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Dr. Emily Chen, MD', '1234567890', 'Zealthy Telehealth'),
('550e8400-e29b-41d4-a716-446655440001', 'Dr. Michael Johnson, MD', '1234567891', 'Foresight Health'),
('550e8400-e29b-41d4-a716-446655440002', 'Dr. Sarah Wilson, MD', '1234567892', 'Primary Care Associates');

-- Insert sample medications
INSERT INTO public.medications (id, name, dosage, frequency, priority) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Mounjaro', '2.5mg', 'Weekly', 1),
('660e8400-e29b-41d4-a716-446655440001', 'Ozempic', '0.5mg', 'Weekly', 2),
('660e8400-e29b-41d4-a716-446655440002', 'Wegovy', '2.4mg', 'Weekly', 3),
('660e8400-e29b-41d4-a716-446655440003', 'Zepbound', '2.5mg', 'Weekly', 4),
('660e8400-e29b-41d4-a716-446655440004', 'Saxenda', '3mg', 'Daily', 5);

-- Insert sample patients
INSERT INTO public.patients (id, name, date_of_birth, patient_id, bmi, has_type2_diabetes, conditions) VALUES
('770e8400-e29b-41d4-a716-446655440000', 'Sarah Johnson', '1985-03-15', 'PT-48291', 34.2, true, ARRAY['Type 2 Diabetes']),
('770e8400-e29b-41d4-a716-446655440001', 'Michael Roberts', '1978-08-22', 'PT-48292', 31.8, false, ARRAY['Obesity']),
('770e8400-e29b-41d4-a716-446655440002', 'Jennifer Lee', '1990-12-05', 'PT-48293', 29.4, false, ARRAY['Hypertension', 'Obesity']),
('770e8400-e29b-41d4-a716-446655440003', 'David Martinez', '1982-06-18', 'PT-48294', 35.1, true, ARRAY['Type 2 Diabetes', 'Sleep Apnea']),
('770e8400-e29b-41d4-a716-446655440004', 'Amanda Wilson', '1987-11-30', 'PT-48295', 28.9, false, ARRAY['Sleep Apnea']);

-- Insert sample insurance
INSERT INTO public.insurance (patient_id, company, member_id, group_number, rx_bin, rx_pcn, rx_group, ocr_status, ocr_confidence) VALUES
('770e8400-e29b-41d4-a716-446655440000', 'Blue Cross Blue Shield', 'BCBS123456789', 'GRP001', '003858', 'ADV', 'RX001', 'success', 96.5),
('770e8400-e29b-41d4-a716-446655440001', 'Aetna', 'AET987654321', 'GRP002', '610014', 'A4', 'RX002', 'success', 92.8),
('770e8400-e29b-41d4-a716-446655440002', 'UnitedHealth', 'UH456789123', 'GRP003', '610029', 'MEDDX', 'RX003', 'success', 78.2),
('770e8400-e29b-41d4-a716-446655440003', 'Cigna', 'CGN789123456', 'GRP004', '011015', 'CN', 'RX004', 'failed', null),
('770e8400-e29b-41d4-a716-446655440004', 'Anthem', 'ANT321654987', 'GRP005', '610097', 'CAR', 'RX005', 'success', 88.9);

-- Insert sample PA cases
INSERT INTO public.pa_cases (
    id, case_id, patient_id, provider_id, medication_id, attempt_number, max_attempts,
    medication_sequence, status, automation_score, priority, payer, denial_reasons,
    last_sync_at
) VALUES
('880e8400-e29b-41d4-a716-446655440000', 'PA-2025-0127', '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 1, 3, 
ARRAY['Mounjaro', 'Ozempic', 'Wegovy'], 'auto-processing', 96.0, 'high', 'Blue Cross Blue Shield', null, 
timezone('utc'::text, now()) - interval '2 minutes'),

('880e8400-e29b-41d4-a716-446655440001', 'PA-2025-0126', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 1, 3,
ARRAY['Wegovy', 'Zepbound', 'Saxenda'], 'auto-approved', 92.0, 'medium', 'Aetna', null,
timezone('utc'::text, now()) - interval '15 minutes'),

('880e8400-e29b-41d4-a716-446655440002', 'PA-2025-0125', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 2, 3,
ARRAY['Wegovy', 'Zepbound'], 'needs-review', 78.0, 'medium', 'UnitedHealth', ARRAY['Insufficient clinical documentation'],
timezone('utc'::text, now()) - interval '32 minutes'),

('880e8400-e29b-41d4-a716-446655440003', 'PA-2025-0124', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 3, 3,
ARRAY['Mounjaro', 'Ozempic', 'Wegovy'], 'error', null, 'high', 'Cigna', ARRAY['Step therapy required', 'Insufficient weight loss documentation'],
timezone('utc'::text, now()) - interval '1 hour'),

('880e8400-e29b-41d4-a716-446655440004', 'PA-2025-0123', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 3, 3,
ARRAY['Wegovy', 'Zepbound', 'Saxenda'], 'auto-denied', 88.0, 'low', 'Anthem', ARRAY['Plan exclusion for obesity medications'],
timezone('utc'::text, now()) - interval '1 day');

-- Insert sample automation events
INSERT INTO public.automation_events (case_id, event_type, status, confidence, description, timestamp) VALUES
('880e8400-e29b-41d4-a716-446655440000', 'pa-initiated', 'completed', 100.0, 'PA Auto-Initiated from provider approval', timezone('utc'::text, now()) - interval '2 minutes'),
('880e8400-e29b-41d4-a716-446655440000', 'fields-populated', 'completed', 96.0, 'Patient demographics, insurance (OCR), prescription details auto-filled', timezone('utc'::text, now()) - interval '2 minutes'),
('880e8400-e29b-41d4-a716-446655440000', 'questions-answered', 'completed', 94.0, '22 questions auto-answered via Rules Engine + LLM', timezone('utc'::text, now()) - interval '1.5 minutes'),
('880e8400-e29b-41d4-a716-446655440000', 'documents-attached', 'completed', 100.0, 'Clinical note PDF + top 2 relevant labs auto-selected', timezone('utc'::text, now()) - interval '1.5 minutes'),
('880e8400-e29b-41d4-a716-446655440000', 'submitted', 'in-progress', null, 'Awaiting payer response via CMM API', timezone('utc'::text, now()) - interval '1 minute'),

('880e8400-e29b-41d4-a716-446655440001', 'pa-initiated', 'completed', 100.0, 'PA Auto-Initiated from provider approval', timezone('utc'::text, now()) - interval '18 minutes'),
('880e8400-e29b-41d4-a716-446655440001', 'fields-populated', 'completed', 92.0, 'Patient demographics, insurance (OCR), prescription details auto-filled', timezone('utc'::text, now()) - interval '18 minutes'),
('880e8400-e29b-41d4-a716-446655440001', 'questions-answered', 'completed', 90.0, '18 questions auto-answered via Rules Engine + LLM', timezone('utc'::text, now()) - interval '17 minutes'),
('880e8400-e29b-41d4-a716-446655440001', 'documents-attached', 'completed', 95.0, 'Clinical note PDF + BMI documentation auto-selected', timezone('utc'::text, now()) - interval '17 minutes'),
('880e8400-e29b-41d4-a716-446655440001', 'submitted', 'completed', 92.0, 'Submitted to Aetna via CMM API', timezone('utc'::text, now()) - interval '16 minutes'),
('880e8400-e29b-41d4-a716-446655440001', 'completed', 'completed', 92.0, 'PA Approved - Auto-released prescription', timezone('utc'::text, now()) - interval '15 minutes');

-- Insert dashboard metrics cache
INSERT INTO public.dashboard_metrics (metric_name, metric_value) VALUES
('active_pas_count', '{"value": 127, "change": {"value": "12% from yesterday", "trend": "up", "positive": true}}'),
('automation_rate', '{"value": "87%", "change": {"value": "5% improvement", "trend": "up", "positive": true}, "target": "70%"}'),
('avg_processing_time', '{"value": "2.4min", "change": {"value": "22min reduction", "trend": "down", "positive": true}, "target": "≤6min P95"}'),
('field_accuracy', '{"value": "96.2%", "change": {"value": "Above 95% target", "trend": "up", "positive": true}}'),
('llm_confidence', '{"value": "94.1%", "change": {"value": "High confidence answers requiring no review", "trend": "neutral", "positive": true}}'),
('sync_latency', '{"value": "1.8h", "change": {"value": "Well under 4h target via webhooks", "trend": "neutral", "positive": true}}'),
('duplicate_prevention', '{"value": "100%", "change": {"value": "Zero duplicates via idempotency keys", "trend": "neutral", "positive": true}}'),
('status_distribution', '{"needsReview": 19, "autoProcessing": 57, "autoApproved": 41, "denied": 10, "total": 127}');