begin;

create table public.classico_prediction_entries (
  id uuid primary key default gen_random_uuid(),
  event_key text not null check (event_key = 'el-classico-2026-10-25'),
  participant_name text not null check (length(participant_name) between 2 and 100),
  participant_phone text not null check (participant_phone ~ '^\+2376[0-9]{8}$'),
  participant_email text check (participant_email is null or length(participant_email) <= 254),
  confirmed_channel_ids uuid[] not null default '{}',
  barcelona_goals integer not null check (barcelona_goals between 0 and 10),
  real_madrid_goals integer not null check (real_madrid_goals between 0 and 10),
  scorer text not null,
  assist text not null,
  created_at timestamptz not null default now(),
  unique (event_key, participant_phone)
);

create index classico_prediction_entries_created_idx
  on public.classico_prediction_entries(event_key, created_at);

alter table public.classico_prediction_entries enable row level security;
revoke all on public.classico_prediction_entries from public, anon, authenticated;
grant all on public.classico_prediction_entries to service_role;

create or replace function public.submit_classico_prediction(
  p_name text,
  p_phone text,
  p_email text,
  p_confirmed_channel_ids uuid[],
  p_barcelona_goals integer,
  p_real_madrid_goals integer,
  p_scorer text,
  p_assist text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_players constant text[] := array[
    'J. García', 'X. E. Font', 'P. Cubarsí', 'G. Martín', 'J. Cancelo',
    'Rodri', 'Pedri', 'L. Yamal', 'F. López', 'A. Gordon', 'Raphinha',
    'K. Mbappé', 'Y. Diomande', 'J. Bellingham', 'A. Güler',
    'A. Tchouaméni', 'F. Valverde', 'M. Cucurella', 'D. Huijsen',
    'I. Konaté', 'D. Dumfries', 'A. Lunin'
  ];
  entry_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if now() < timestamptz '2026-10-25 00:00:00+01'
    or now() >= timestamptz '2026-10-25 20:30:00+01' then
    raise exception 'PREDICTION_CLOSED';
  end if;
  if p_name is null or length(trim(p_name)) not between 2 and 100
    or p_phone !~ '^\+2376[0-9]{8}$'
    or p_email is not null and length(p_email) > 254
    or p_barcelona_goals not between 0 and 10
    or p_real_madrid_goals not between 0 and 10
    or not (p_scorer = any(allowed_players))
    or not (p_assist = any(allowed_players)) then
    raise exception 'INVALID_PREDICTION';
  end if;
  if not exists (select 1 from public.social_channels where is_active and is_required) then
    raise exception 'SOCIAL_GATE_UNAVAILABLE';
  end if;
  if exists (
    select 1 from public.social_channels
    where is_active and is_required
      and not (id = any(coalesce(p_confirmed_channel_ids, '{}'::uuid[])))
  ) then
    raise exception 'SOCIAL_GATE_INCOMPLETE';
  end if;

  insert into public.classico_prediction_entries(
    event_key, participant_name, participant_phone, participant_email,
    confirmed_channel_ids, barcelona_goals, real_madrid_goals, scorer, assist
  ) values (
    'el-classico-2026-10-25', trim(p_name), p_phone, nullif(lower(trim(coalesce(p_email, ''))), ''),
    coalesce(p_confirmed_channel_ids, '{}'::uuid[]), p_barcelona_goals, p_real_madrid_goals, p_scorer, p_assist
  ) returning id into entry_id;

  return jsonb_build_object('status', 'submitted', 'id', entry_id);
exception when unique_violation then
  raise exception 'PREDICTION_ALREADY_SUBMITTED';
end;
$$;

revoke all on function public.submit_classico_prediction(text, text, text, uuid[], integer, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_classico_prediction(text, text, text, uuid[], integer, integer, text, text)
  to service_role;

commit;
