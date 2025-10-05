-- Create webhook configuration table
create table public.webhook_config (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.team(id) on delete cascade not null,
  name text not null,
  environment text not null default 'production' check (environment in ('development', 'production')),
  url text not null,
  secret text not null, -- for HMAC verification
  events text[] not null default '{}', -- array of event types to listen for
  active boolean not null default true,
  retry_count integer not null default 3,
  timeout_seconds integer not null default 30,
  last_triggered_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure unique webhook names per team per environment
  unique(team_id, name, environment)
);

-- Create webhook delivery log table for tracking attempts
create table public.webhook_delivery (
  id uuid primary key default gen_random_uuid(),
  webhook_config_id uuid references public.webhook_config(id) on delete cascade not null,
  event_type text not null,
  payload jsonb not null,
  response_status integer,
  response_body text,
  response_time_ms integer,
  attempt_number integer not null default 1,
  delivered_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

-- Create webhook queue table for async processing
create table public.webhook_queue (
  id uuid primary key default gen_random_uuid(),
  webhook_config_id uuid references public.webhook_config(id) on delete cascade not null,
  event_type text not null,
  payload jsonb not null,
  scheduled_for timestamptz not null default now(),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add RLS policies
alter table public.webhook_config enable row level security;
alter table public.webhook_delivery enable row level security;
alter table public.webhook_queue enable row level security;

-- RLS policies for webhook_config
create policy "Users can view their team's webhooks" on public.webhook_config
  for select using (
    team_id in (
      select tm.team_id from public.team_member tm 
      where tm.user_id = auth.uid() and tm.status = 'active'
    )
  );

create policy "Team admins can manage webhooks" on public.webhook_config
  for all using (
    team_id in (
      select tm.team_id from public.team_member tm 
      where tm.user_id = auth.uid() 
      and tm.status = 'active' 
      and tm.role in ('super_admin', 'admin')
    )
  );

-- RLS policies for webhook_delivery (read-only for team members)
create policy "Users can view their team's webhook deliveries" on public.webhook_delivery
  for select using (
    webhook_config_id in (
      select wc.id from public.webhook_config wc
      join public.team_member tm on wc.team_id = tm.team_id
      where tm.user_id = auth.uid() and tm.status = 'active'
    )
  );

-- RLS policies for webhook_queue (read-only for team members)
create policy "Users can view their team's webhook queue" on public.webhook_queue
  for select using (
    webhook_config_id in (
      select wc.id from public.webhook_config wc
      join public.team_member tm on wc.team_id = tm.team_id
      where tm.user_id = auth.uid() and tm.status = 'active'
    )
  );

-- Create indexes for performance
create index idx_webhook_config_team_id on public.webhook_config(team_id);
create index idx_webhook_config_active on public.webhook_config(active);
create index idx_webhook_delivery_config_id on public.webhook_delivery(webhook_config_id);
create index idx_webhook_delivery_created_at on public.webhook_delivery(created_at);
create index idx_webhook_queue_status on public.webhook_queue(status);
create index idx_webhook_queue_scheduled_for on public.webhook_queue(scheduled_for);

-- Function to update the updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_webhook_config_updated_at
  before update on public.webhook_config
  for each row execute function public.update_updated_at_column();

create trigger update_webhook_queue_updated_at
  before update on public.webhook_queue
  for each row execute function public.update_updated_at_column();

-- Function to enqueue webhook events (with environment filtering)
create or replace function public.enqueue_webhook_event(
  p_team_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_environment text default 'production'
)
returns void as $$
declare
  webhook_record record;
  current_env text;
begin
  -- Get current environment from app settings or default to production
  current_env := coalesce(p_environment, 'production');
  
  -- Find all active webhooks for this team and environment that listen to this event type
  for webhook_record in 
    select id, retry_count 
    from public.webhook_config 
    where team_id = p_team_id 
    and active = true 
    and environment = current_env
    and (p_event_type = any(events) or 'all' = any(events))
  loop
    -- Insert into webhook queue
    insert into public.webhook_queue (
      webhook_config_id,
      event_type,
      payload,
      max_attempts
    ) values (
      webhook_record.id,
      p_event_type,
      p_payload,
      webhook_record.retry_count
    );
  end loop;
end;
$$ language plpgsql security definer;

-- Function to trigger webhooks on team data changes
create or replace function public.trigger_team_webhook()
returns trigger as $$
declare
  event_type text;
  payload jsonb;
  team_uuid uuid;
begin
  -- Determine event type based on operation
  case TG_OP
    when 'INSERT' then
      event_type := 'team.created';
      payload := to_jsonb(NEW);
      team_uuid := NEW.id;
    when 'UPDATE' then
      event_type := 'team.updated';
      payload := jsonb_build_object(
        'before', to_jsonb(OLD),
        'after', to_jsonb(NEW),
        'changes', (
          select jsonb_object_agg(key, value)
          from jsonb_each(to_jsonb(NEW))
          where to_jsonb(NEW) ->> key is distinct from to_jsonb(OLD) ->> key
        )
      );
      team_uuid := NEW.id;
    when 'DELETE' then
      event_type := 'team.deleted';
      payload := to_jsonb(OLD);
      team_uuid := OLD.id;
  end case;

  -- Add metadata
  payload := payload || jsonb_build_object(
    'event_type', event_type,
    'team_id', team_uuid,
    'timestamp', extract(epoch from now()),
    'source', 'foresight_cdss'
  );

  -- Enqueue webhook events (auto-detect environment from app)
  perform public.enqueue_webhook_event(
    team_uuid, 
    event_type, 
    payload,
    coalesce(current_setting('app.environment', true), 'production')
  );

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$ language plpgsql;

-- Create triggers for team table changes
create trigger team_webhook_trigger
  after insert or update or delete on public.team
  for each row execute function public.trigger_team_webhook();

-- Function to trigger webhooks on team member changes
create or replace function public.trigger_team_member_webhook()
returns trigger as $$
declare
  event_type text;
  payload jsonb;
  team_uuid uuid;
begin
  -- Determine event type and team_id based on operation
  case TG_OP
    when 'INSERT' then
      event_type := 'team_member.added';
      payload := to_jsonb(NEW);
      team_uuid := NEW.team_id;
    when 'UPDATE' then
      event_type := 'team_member.updated';
      payload := jsonb_build_object(
        'before', to_jsonb(OLD),
        'after', to_jsonb(NEW),
        'changes', (
          select jsonb_object_agg(key, value)
          from jsonb_each(to_jsonb(NEW))
          where to_jsonb(NEW) ->> key is distinct from to_jsonb(OLD) ->> key
        )
      );
      team_uuid := NEW.team_id;
    when 'DELETE' then
      event_type := 'team_member.removed';
      payload := to_jsonb(OLD);
      team_uuid := OLD.team_id;
  end case;

  -- Add metadata
  payload := payload || jsonb_build_object(
    'event_type', event_type,
    'team_id', team_uuid,
    'timestamp', extract(epoch from now()),
    'source', 'foresight_cdss'
  );

  -- Enqueue webhook events (auto-detect environment from app)
  perform public.enqueue_webhook_event(
    team_uuid, 
    event_type, 
    payload,
    coalesce(current_setting('app.environment', true), 'production')
  );

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$ language plpgsql;

-- Create triggers for team_member table changes
create trigger team_member_webhook_trigger
  after insert or update or delete on public.team_member
  for each row execute function public.trigger_team_member_webhook();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.webhook_config to authenticated;
grant all on public.webhook_delivery to authenticated;
grant select on public.webhook_queue to authenticated;
grant execute on function public.enqueue_webhook_event to authenticated;