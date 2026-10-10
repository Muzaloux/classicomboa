begin;

create table public.social_channels (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram','tiktok','facebook','whatsapp')),
  name text not null check (length(name) between 2 and 100),
  username text not null default '' check (length(username) <= 120),
  url text not null check (url ~ '^https://'),
  icon text not null check (icon in ('instagram','tiktok','facebook','whatsapp')),
  is_required boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(question) between 8 and 600),
  category text not null check (length(category) between 2 and 80),
  difficulty text not null check (difficulty in ('easy','medium','hard','boss')),
  explanation text check (explanation is null or length(explanation) <= 1200),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quiz_questions_active_idx on public.quiz_questions(status, difficulty);

create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  label text not null check (length(label) between 1 and 400),
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, sort_order)
);
create index quiz_options_question_idx on public.quiz_options(question_id, sort_order);

create table public.quiz_settings (
  id boolean primary key default true check (id),
  require_boss_question boolean not null default true,
  reveal_answers_after_close boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.quiz_settings(id) values (true) on conflict do nothing;

create table public.quiz_daily_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_date date not null unique,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','open','closed')),
  override_status text not null default 'auto' check (override_status in ('auto','disabled','paused','reopen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at > opens_at)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique check (public_reference ~ '^[a-f0-9]{32}$'),
  daily_session_id uuid not null references public.quiz_daily_sessions(id),
  quiz_date date not null,
  participant_name text not null check (length(participant_name) between 2 and 100),
  participant_phone text not null check (participant_phone ~ '^\+2376[0-9]{8}$'),
  participant_email text check (participant_email is null or length(participant_email) <= 254),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer check (score is null or score between 0 and 100),
  correct_answers integer check (correct_answers is null or correct_answers between 0 and 5),
  total_questions integer not null default 5 check (total_questions = 5),
  completion_seconds integer check (completion_seconds is null or completion_seconds >= 0),
  social_gate_confirmed boolean not null default false,
  status text not null default 'started' check (status in ('started','completed','expired','disqualified')),
  created_at timestamptz not null default now(),
  unique (quiz_date, participant_phone)
);
create index quiz_attempts_session_score_idx on public.quiz_attempts(daily_session_id, status, score desc, completion_seconds, completed_at);
create index quiz_attempts_phone_idx on public.quiz_attempts(participant_phone, quiz_date desc);

create table public.quiz_attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete restrict,
  position integer not null check (position between 1 and 5),
  option_order uuid[] not null,
  selected_option_id uuid references public.quiz_options(id) on delete restrict,
  correct_option_id uuid not null,
  correct_option_snapshot text not null,
  question_snapshot text not null,
  option_snapshot jsonb not null,
  is_correct boolean,
  points_awarded integer not null default 0 check (points_awarded in (0,20)),
  answered_at timestamptz,
  unique (attempt_id, position),
  unique (attempt_id, question_id)
);

create table public.quiz_rate_limits (
  bucket_hash text not null check (bucket_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  attempts integer not null default 1,
  primary key (bucket_hash, window_start)
);

create trigger social_channels_updated before update on public.social_channels for each row execute function public.touch_updated_at();
create trigger quiz_questions_updated before update on public.quiz_questions for each row execute function public.touch_updated_at();
create trigger quiz_daily_sessions_updated before update on public.quiz_daily_sessions for each row execute function public.touch_updated_at();

alter table public.social_channels enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_settings enable row level security;
alter table public.quiz_daily_sessions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_questions enable row level security;
alter table public.quiz_rate_limits enable row level security;

revoke all on public.social_channels, public.quiz_questions, public.quiz_options, public.quiz_settings,
  public.quiz_daily_sessions, public.quiz_attempts, public.quiz_attempt_questions, public.quiz_rate_limits
  from public, anon, authenticated;
grant all on public.social_channels, public.quiz_questions, public.quiz_options, public.quiz_settings,
  public.quiz_daily_sessions, public.quiz_attempts, public.quiz_attempt_questions, public.quiz_rate_limits
  to service_role;

insert into public.social_channels(platform,name,username,url,icon,is_required,is_active,sort_order) values
  ('instagram','Instagram officiel','@el_classico237','https://www.instagram.com/el_classico237?utm_source=qr&stkn=Ynk1cG9mazl5azUx','instagram',true,true,10),
  ('tiktok','TikTok officiel','Classico Mboa','https://vm.tiktok.com/ZSqJo89mk/','tiktok',true,true,20),
  ('whatsapp','Groupe WhatsApp officiel','Communauté Classico Mboa','https://chat.whatsapp.com/DDxxaFkKmHQESyVQW96W9i','whatsapp',true,true,30),
  ('tiktok','Sponsor officiel · Pris-K Events Grill','@priskeventsgrill20','https://www.tiktok.com/@priskeventsgrill20?_r=1&_t=ZS-9AJFCQ0sjaP','tiktok',true,true,40);

insert into public.quiz_questions(id,question,category,difficulty,explanation,status) values
('00000000-0000-4000-8000-000000000001','Qui est le meilleur buteur de l’histoire du Clásico ?','Records','easy','Lionel Messi a inscrit 26 buts dans les Clásicos officiels.','active'),
('00000000-0000-4000-8000-000000000002','Quel joueur détient le record du plus grand nombre de Clásicos officiels disputés ?','Records','medium','Sergio Busquets a disputé 48 Clásicos officiels.','active'),
('00000000-0000-4000-8000-000000000003','Qui a marqué le plus de buts dans le Clásico : Cristiano Ronaldo ou Alfredo Di Stéfano ?','Joueurs','medium','Cristiano Ronaldo et Alfredo Di Stéfano ont marqué 18 buts chacun.','active'),
('00000000-0000-4000-8000-000000000004','Quelle est la plus large victoire de l’histoire du Clásico ?','Histoire','hard','Le Real Madrid a battu le FC Barcelone 11–1 en 1943.','active'),
('00000000-0000-4000-8000-000000000005','Quelle est la plus large victoire officielle du FC Barcelone contre le Real Madrid ?','Histoire','hard','Le FC Barcelone a battu le Real Madrid 7–2 en 1950.','active'),
('00000000-0000-4000-8000-000000000006','Quel club détient le record de la plus longue série de victoires consécutives dans le Clásico ?','Records','medium','Le Real Madrid détient la série record.','active'),
('00000000-0000-4000-8000-000000000007','Combien de Clásicos consécutifs le Real Madrid a-t-il remportés lors de cette série record ?','Records','hard','Le Real Madrid a remporté 7 victoires consécutives entre 1962 et 1965.','active'),
('00000000-0000-4000-8000-000000000008','Qui a remporté le tout premier match entre le FC Barcelone et le Real Madrid en 1902 ?','Histoire','medium','Le FC Barcelone a remporté le match 3–1.','active'),
('00000000-0000-4000-8000-000000000009','Combien de fois le Barça et le Real Madrid se sont-ils affrontés en Coupe d’Europe/Ligue des champions ?','Ligue des champions','medium','Les deux clubs se sont affrontés 8 fois.','active'),
('00000000-0000-4000-8000-000000000010','Quel club a remporté le plus de Clásicos en Coupe d’Europe/Ligue des champions ?','Ligue des champions','hard','Le Real Madrid compte 3 victoires, contre 2 pour Barcelone, et 3 matchs nuls.','active'),
('00000000-0000-4000-8000-000000000011','Parmi Lionel Messi, Ferenc Puskás et Santiago Bernabéu, qui a inscrit le plus de triplés dans le Clásico ?','Joueurs','hard','Chacun des trois joueurs a inscrit 2 triplés.','active'),
('00000000-0000-4000-8000-000000000012','Quel entraîneur détient le record du plus grand nombre de victoires dans le Clásico ?','Entraîneurs','hard','Miguel Muñoz compte 16 victoires dans le Clásico.','active'),
('00000000-0000-4000-8000-000000000013','Quel joueur a marqué 14 buts en seulement 18 Clásicos ?','Joueurs','medium','César Rodríguez a marqué 14 buts en 18 Clásicos.','active'),
('00000000-0000-4000-8000-000000000014','Qui a marqué le plus de buts dans les Clásicos de Liga : Lionel Messi ou Cristiano Ronaldo ?','Joueurs','medium','Lionel Messi compte 18 buts contre 9 pour Cristiano Ronaldo.','active'),
('00000000-0000-4000-8000-000000000015','Quel joueur du Barça a été le premier à atteindre 48 apparitions officielles dans le Clásico ?','Joueurs','hard','Sergio Busquets a été le premier joueur du Barça à atteindre ce total.','active'),
('00000000-0000-4000-8000-000000000016','Combien de Clásicos officiels avaient été disputés après la rencontre de mai 2026 ?','Records','hard','Le total indiqué est de 264 Clásicos officiels.','active'),
('00000000-0000-4000-8000-000000000017','Après le Clásico de mai 2026, quel club comptait le plus de victoires officielles ?','Records','hard','Les deux clubs étaient à égalité avec 106 victoires chacun.','active'),
('00000000-0000-4000-8000-000000000018','Combien de matchs nuls comptait alors l’histoire des Clásicos officiels ?','Records','hard','L’histoire des Clásicos comptait 52 matchs nuls à cette date.','active'),
('00000000-0000-4000-8000-000000000019','Après ce match, quel club avait marqué le plus de buts dans l’ensemble des Clásicos officiels ?','Records','hard','Le Real Madrid avait marqué 444 buts contre 441 pour Barcelone.','active'),
('00000000-0000-4000-8000-000000000020','Quel était le bilan exact des 264 Clásicos officiels après mai 2026 ?','Records','boss','Real Madrid : 106 victoires · Nuls : 52 · FC Barcelone : 106 victoires.','active')
on conflict (id) do nothing;

insert into public.quiz_options(question_id,label,is_correct,sort_order) values
('00000000-0000-4000-8000-000000000001','Lionel Messi — 26 buts',true,1),('00000000-0000-4000-8000-000000000001','Cristiano Ronaldo — 18 buts',false,2),('00000000-0000-4000-8000-000000000001','Alfredo Di Stéfano — 18 buts',false,3),('00000000-0000-4000-8000-000000000001','Karim Benzema — 16 buts',false,4),
('00000000-0000-4000-8000-000000000002','Sergio Busquets — 48 matchs',true,1),('00000000-0000-4000-8000-000000000002','Lionel Messi — 45 matchs',false,2),('00000000-0000-4000-8000-000000000002','Sergio Ramos — 45 matchs',false,3),('00000000-0000-4000-8000-000000000002','Xavi Hernández — 42 matchs',false,4),
('00000000-0000-4000-8000-000000000003','Cristiano Ronaldo — 18 buts',false,1),('00000000-0000-4000-8000-000000000003','Alfredo Di Stéfano — 18 buts',false,2),('00000000-0000-4000-8000-000000000003','Égalité — 18 buts chacun',true,3),('00000000-0000-4000-8000-000000000003','Lionel Messi — 26 buts',false,4),
('00000000-0000-4000-8000-000000000004','Real Madrid 11–1 FC Barcelone, en 1943',true,1),('00000000-0000-4000-8000-000000000004','FC Barcelone 7–2 Real Madrid, en 1950',false,2),('00000000-0000-4000-8000-000000000004','Real Madrid 8–2 FC Barcelone, en 1935',false,3),('00000000-0000-4000-8000-000000000004','FC Barcelone 6–1 Real Madrid, en 1957',false,4),
('00000000-0000-4000-8000-000000000005','FC Barcelone 7–2 Real Madrid, en 1950',true,1),('00000000-0000-4000-8000-000000000005','FC Barcelone 5–0 Real Madrid, en 1974',false,2),('00000000-0000-4000-8000-000000000005','FC Barcelone 6–1 Real Madrid, en 1957',false,3),('00000000-0000-4000-8000-000000000005','FC Barcelone 7–2 Real Madrid, en 1935',false,4),
('00000000-0000-4000-8000-000000000006','Real Madrid',true,1),('00000000-0000-4000-8000-000000000006','FC Barcelone',false,2),('00000000-0000-4000-8000-000000000006','Aucun, ils sont à égalité',false,3),('00000000-0000-4000-8000-000000000006','La série est détenue par l’Atlético Madrid',false,4),
('00000000-0000-4000-8000-000000000007','5 victoires consécutives (2011–2012)',false,1),('00000000-0000-4000-8000-000000000007','6 victoires consécutives (1936–1941)',false,2),('00000000-0000-4000-8000-000000000007','7 victoires consécutives (1962–1965)',true,3),('00000000-0000-4000-8000-000000000007','8 victoires consécutives (1960–1964)',false,4),
('00000000-0000-4000-8000-000000000008','FC Barcelone — victoire 3–1',true,1),('00000000-0000-4000-8000-000000000008','Real Madrid — victoire 2–1',false,2),('00000000-0000-4000-8000-000000000008','Match nul 1–1',false,3),('00000000-0000-4000-8000-000000000008','FC Barcelone — victoire 2–1',false,4),
('00000000-0000-4000-8000-000000000009','6 fois',false,1),('00000000-0000-4000-8000-000000000009','8 fois',true,2),('00000000-0000-4000-8000-000000000009','10 fois',false,3),('00000000-0000-4000-8000-000000000009','12 fois',false,4),
('00000000-0000-4000-8000-000000000010','FC Barcelone — 3 victoires contre 2',false,1),('00000000-0000-4000-8000-000000000010','Real Madrid — 3 victoires contre 2 pour Barcelone, 3 nuls',true,2),('00000000-0000-4000-8000-000000000010','Égalité — 2 victoires chacun, 4 nuls',false,3),('00000000-0000-4000-8000-000000000010','Real Madrid — 4 victoires contre 1, 3 nuls',false,4),
('00000000-0000-4000-8000-000000000011','Lionel Messi — 3 triplés',false,1),('00000000-0000-4000-8000-000000000011','Ferenc Puskás — 3 triplés',false,2),('00000000-0000-4000-8000-000000000011','Santiago Bernabéu — 3 triplés',false,3),('00000000-0000-4000-8000-000000000011','Égalité — 2 triplés chacun',true,4),
('00000000-0000-4000-8000-000000000012','Pep Guardiola — 9 victoires',false,1),('00000000-0000-4000-8000-000000000012','Miguel Muñoz — 16 victoires',true,2),('00000000-0000-4000-8000-000000000012','Johan Cruyff — 11 victoires',false,3),('00000000-0000-4000-8000-000000000012','Carlo Ancelotti — 12 victoires',false,4),
('00000000-0000-4000-8000-000000000013','César Rodríguez',true,1),('00000000-0000-4000-8000-000000000013','Luis Suárez',false,2),('00000000-0000-4000-8000-000000000013','Ferenc Puskás',false,3),('00000000-0000-4000-8000-000000000013','Raúl González',false,4),
('00000000-0000-4000-8000-000000000014','Cristiano Ronaldo — 18 buts contre 9',false,1),('00000000-0000-4000-8000-000000000014','Lionel Messi — 18 buts contre 9 pour Cristiano Ronaldo',true,2),('00000000-0000-4000-8000-000000000014','Égalité — 14 buts chacun',false,3),('00000000-0000-4000-8000-000000000014','Lionel Messi — 26 buts contre 18',false,4),
('00000000-0000-4000-8000-000000000015','Andrés Iniesta',false,1),('00000000-0000-4000-8000-000000000015','Xavi Hernández',false,2),('00000000-0000-4000-8000-000000000015','Sergio Busquets',true,3),('00000000-0000-4000-8000-000000000015','Gerard Piqué',false,4),
('00000000-0000-4000-8000-000000000016','262',false,1),('00000000-0000-4000-8000-000000000016','263',false,2),('00000000-0000-4000-8000-000000000016','264',true,3),('00000000-0000-4000-8000-000000000016','265',false,4),
('00000000-0000-4000-8000-000000000017','Real Madrid — 107 victoires',false,1),('00000000-0000-4000-8000-000000000017','FC Barcelone — 107 victoires',false,2),('00000000-0000-4000-8000-000000000017','Aucun — égalité parfaite avec 106 victoires chacun',true,3),('00000000-0000-4000-8000-000000000017','Aucun — égalité avec 105 victoires chacun',false,4),
('00000000-0000-4000-8000-000000000018','50 matchs nuls',false,1),('00000000-0000-4000-8000-000000000018','51 matchs nuls',false,2),('00000000-0000-4000-8000-000000000018','52 matchs nuls',true,3),('00000000-0000-4000-8000-000000000018','53 matchs nuls',false,4),
('00000000-0000-4000-8000-000000000019','FC Barcelone — 444 buts contre 441 pour le Real Madrid',false,1),('00000000-0000-4000-8000-000000000019','Real Madrid — 444 buts contre 441 pour Barcelone',true,2),('00000000-0000-4000-8000-000000000019','Égalité — 442 buts chacun',false,3),('00000000-0000-4000-8000-000000000019','Real Madrid — 441 buts contre 444 pour Barcelone',false,4),
('00000000-0000-4000-8000-000000000020','Real Madrid : 106 · Nuls : 53 · FC Barcelone : 105',false,1),('00000000-0000-4000-8000-000000000020','Real Madrid : 107 · Nuls : 50 · FC Barcelone : 107',false,2),('00000000-0000-4000-8000-000000000020','Real Madrid : 106 · Nuls : 52 · FC Barcelone : 106',true,3),('00000000-0000-4000-8000-000000000020','Real Madrid : 105 · Nuls : 52 · FC Barcelone : 107',false,4);

create or replace function public.quiz_is_open(p_quiz_date date, p_override text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (now() at time zone 'Africa/Douala')::date = p_quiz_date
    and case p_override
      when 'disabled' then false
      when 'paused' then false
      when 'reopen' then true
      else (now() at time zone 'Africa/Douala')::time >= time '20:00'
    end;
$$;

create or replace function public.start_daily_quiz(
  p_reference text, p_name text, p_phone text, p_email text,
  p_confirmed_channels uuid[], p_bucket_hash text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  local_now timestamp := now() at time zone 'Africa/Douala';
  local_date date := local_now::date;
  session_row public.quiz_daily_sessions%rowtype;
  attempt_row public.quiz_attempts%rowtype;
  question_ids uuid[];
  question_row record;
  result_questions jsonb;
  needs_boss boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_name is null or length(trim(p_name)) not between 2 and 100 or p_phone is null or p_phone !~ '^\+2376[0-9]{8}$' then raise exception 'INVALID_PARTICIPANT'; end if;
  if p_reference !~ '^[a-f0-9]{32}$' or p_bucket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST'; end if;

  insert into public.quiz_daily_sessions(quiz_date,opens_at,closes_at,status)
  values (local_date, (local_date + time '20:00') at time zone 'Africa/Douala', (local_date + 1)::timestamp at time zone 'Africa/Douala',
    case when local_now::time >= time '20:00' then 'open' else 'scheduled' end)
  on conflict (quiz_date) do nothing;
  select * into session_row from public.quiz_daily_sessions where quiz_date = local_date for update;
  update public.quiz_daily_sessions set status = case when public.quiz_is_open(local_date,session_row.override_status) then 'open' when local_now::time < time '20:00' and session_row.override_status='auto' then 'scheduled' else 'closed' end
  where id = session_row.id returning * into session_row;
  if not public.quiz_is_open(local_date,session_row.override_status) then raise exception 'QUIZ_CLOSED'; end if;

  if exists (select 1 from public.social_channels c where c.is_active and c.is_required and not (c.id = any(coalesce(p_confirmed_channels,'{}'::uuid[])))) then
    raise exception 'SOCIAL_GATE_INCOMPLETE';
  end if;

  perform pg_advisory_xact_lock(hashtext(local_date::text || ':' || p_phone));
  update public.quiz_attempts set status = 'expired' where participant_phone = p_phone and status = 'started' and quiz_date < local_date;
  select * into attempt_row from public.quiz_attempts where quiz_date = local_date and participant_phone = p_phone for update;
  if found then
    if attempt_row.status = 'completed' then return jsonb_build_object('status','completed','reference',attempt_row.public_reference); end if;
    if attempt_row.status = 'started' then
      select jsonb_agg(jsonb_build_object(
        'id',q.id,'position',q.position,'question',q.question_snapshot,'category',b.category,'difficulty',b.difficulty,
        'selectedOptionId',q.selected_option_id,
        'options',(select jsonb_agg(value order by array_position(q.option_order,(value->>'id')::uuid)) from jsonb_array_elements(q.option_snapshot) value)
      ) order by q.position) into result_questions
      from public.quiz_attempt_questions q join public.quiz_questions b on b.id=q.question_id where q.attempt_id=attempt_row.id;
      return jsonb_build_object('status','resumed','reference',attempt_row.public_reference,'participantName',attempt_row.participant_name,'questions',result_questions);
    end if;
    raise exception 'ATTEMPT_ALREADY_USED';
  end if;

  select coalesce(require_boss_question,true) into needs_boss from public.quiz_settings where id=true;
  if needs_boss then
    select array_agg(id order by random()) into question_ids from (
      (select id from public.quiz_questions where status='active' and difficulty <> 'boss' order by random() limit 4)
      union all
      (select id from public.quiz_questions where status='active' and difficulty = 'boss' order by random() limit 1)
    ) selected;
    if coalesce(cardinality(question_ids),0) <> 5 then raise exception 'QUESTION_POOL_INCOMPLETE'; end if;
  else
    select array_agg(id order by random()) into question_ids from (select id from public.quiz_questions where status='active' order by random() limit 5) selected;
    if coalesce(cardinality(question_ids),0) <> 5 then raise exception 'QUESTION_POOL_INCOMPLETE'; end if;
  end if;

  insert into public.quiz_attempts(public_reference,daily_session_id,quiz_date,participant_name,participant_phone,participant_email,social_gate_confirmed)
  values (p_reference,session_row.id,local_date,trim(p_name),p_phone,nullif(lower(trim(coalesce(p_email,''))),''),true) returning * into attempt_row;

  if needs_boss then
    for question_row in select q.id, q.question, q.difficulty from public.quiz_questions q where q.id=any(question_ids) order by case when q.difficulty='boss' then 1 else 0 end, random() loop
      if question_row.difficulty = 'boss' then
        insert into public.quiz_attempt_questions(attempt_id,question_id,position,option_order,correct_option_id,correct_option_snapshot,question_snapshot,option_snapshot)
        values (attempt_row.id,question_row.id,5,array(select id from public.quiz_options where question_id=question_row.id order by random()),
          (select id from public.quiz_options where question_id=question_row.id and is_correct),(select label from public.quiz_options where question_id=question_row.id and is_correct),question_row.question,
          (select jsonb_agg(jsonb_build_object('id',id,'label',label)) from public.quiz_options where question_id=question_row.id));
      else
        insert into public.quiz_attempt_questions(attempt_id,question_id,position,option_order,correct_option_id,correct_option_snapshot,question_snapshot,option_snapshot)
        values (attempt_row.id,question_row.id,(select count(*)+1 from public.quiz_attempt_questions where attempt_id=attempt_row.id),array(select id from public.quiz_options where question_id=question_row.id order by random()),
          (select id from public.quiz_options where question_id=question_row.id and is_correct),(select label from public.quiz_options where question_id=question_row.id and is_correct),question_row.question,
          (select jsonb_agg(jsonb_build_object('id',id,'label',label)) from public.quiz_options where question_id=question_row.id));
      end if;
    end loop;
  else
    for question_row in select q.id,q.question from public.quiz_questions q where q.id=any(question_ids) order by random() loop
      insert into public.quiz_attempt_questions(attempt_id,question_id,position,option_order,correct_option_id,correct_option_snapshot,question_snapshot,option_snapshot)
      values (attempt_row.id,question_row.id,(select count(*)+1 from public.quiz_attempt_questions where attempt_id=attempt_row.id),array(select id from public.quiz_options where question_id=question_row.id order by random()),
        (select id from public.quiz_options where question_id=question_row.id and is_correct),(select label from public.quiz_options where question_id=question_row.id and is_correct),question_row.question,
        (select jsonb_agg(jsonb_build_object('id',id,'label',label)) from public.quiz_options where question_id=question_row.id));
    end loop;
  end if;
  if exists (select 1 from public.quiz_attempt_questions where attempt_id=attempt_row.id and (cardinality(option_order) <> 4 or correct_option_id is null)) then raise exception 'QUESTION_OPTIONS_INVALID'; end if;

  select jsonb_agg(jsonb_build_object(
    'id',q.id,'position',q.position,'question',q.question_snapshot,'category',b.category,'difficulty',b.difficulty,
    'selectedOptionId',null,
    'options',(select jsonb_agg(value order by array_position(q.option_order,(value->>'id')::uuid)) from jsonb_array_elements(q.option_snapshot) value)
  ) order by q.position) into result_questions
  from public.quiz_attempt_questions q join public.quiz_questions b on b.id=q.question_id where q.attempt_id=attempt_row.id;
  return jsonb_build_object('status','started','reference',attempt_row.public_reference,'participantName',attempt_row.participant_name,'questions',result_questions);
exception when unique_violation then
  raise exception 'ATTEMPT_ALREADY_USED';
end;
$$;

create or replace function public.save_daily_quiz_answer(p_reference text,p_position integer,p_option uuid,p_bucket_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare attempt_row public.quiz_attempts%rowtype; session_row public.quiz_daily_sessions%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_bucket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST'; end if;
  select * into attempt_row from public.quiz_attempts where public_reference=p_reference for update;
  if not found or attempt_row.status <> 'started' then raise exception 'ATTEMPT_NOT_ACTIVE'; end if;
  select * into session_row from public.quiz_daily_sessions where id=attempt_row.daily_session_id;
  if not public.quiz_is_open(session_row.quiz_date,session_row.override_status) then
    update public.quiz_attempts set status='expired' where id=attempt_row.id;
    raise exception 'QUIZ_CLOSED';
  end if;
  update public.quiz_attempt_questions q set selected_option_id=p_option, answered_at=now()
  where q.attempt_id=attempt_row.id and q.position=p_position and p_option=any(q.option_order);
  if not found then raise exception 'INVALID_ANSWER'; end if;
  return true;
end;
$$;

create or replace function public.submit_daily_quiz(p_reference text,p_answers jsonb,p_bucket_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare attempt_row public.quiz_attempts%rowtype; session_row public.quiz_daily_sessions%rowtype; correct_count integer; elapsed integer;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_bucket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST'; end if;
  select * into attempt_row from public.quiz_attempts where public_reference=p_reference for update;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if attempt_row.status='completed' then return jsonb_build_object('status','completed','reference',attempt_row.public_reference,'score',attempt_row.score,'correctAnswers',attempt_row.correct_answers); end if;
  if attempt_row.status <> 'started' then raise exception 'ATTEMPT_NOT_ACTIVE'; end if;
  select * into session_row from public.quiz_daily_sessions where id=attempt_row.daily_session_id;
  if not public.quiz_is_open(session_row.quiz_date,session_row.override_status) then
    update public.quiz_attempts set status='expired' where id=attempt_row.id;
    raise exception 'QUIZ_CLOSED';
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 5
    or (select count(distinct (value->>'position')::integer) from jsonb_array_elements(p_answers)) <> 5
    or exists (
      select 1 from jsonb_array_elements(p_answers) a(value)
      left join public.quiz_attempt_questions q on q.attempt_id=attempt_row.id
        and q.position=(a.value->>'position')::integer
        and (a.value->>'optionId')::uuid=any(q.option_order)
      where q.id is null
    ) then raise exception 'INVALID_ANSWERS'; end if;
  update public.quiz_attempt_questions q set
    selected_option_id=(a.value->>'optionId')::uuid,
    answered_at=now()
  from jsonb_array_elements(p_answers) a(value)
  where q.attempt_id=attempt_row.id and q.position=(a.value->>'position')::integer
    and (a.value->>'optionId')::uuid=any(q.option_order);
  if (select count(*) from public.quiz_attempt_questions where attempt_id=attempt_row.id and selected_option_id is not null) <> 5 then raise exception 'INVALID_ANSWERS'; end if;
  update public.quiz_attempt_questions q set is_correct=o.is_correct,points_awarded=case when o.is_correct then 20 else 0 end
  from public.quiz_options o where q.attempt_id=attempt_row.id and o.id=q.selected_option_id;
  select count(*) into correct_count from public.quiz_attempt_questions where attempt_id=attempt_row.id and is_correct=true;
  elapsed := greatest(0,floor(extract(epoch from (now()-attempt_row.started_at)))::integer);
  update public.quiz_attempts set status='completed',completed_at=now(),score=correct_count*20,correct_answers=correct_count,completion_seconds=elapsed where id=attempt_row.id;
  return jsonb_build_object('status','completed','reference',attempt_row.public_reference,'score',correct_count*20,'correctAnswers',correct_count);
end;
$$;

create or replace function public.get_public_quiz_attempt(p_reference text,p_bucket_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare attempt_row public.quiz_attempts%rowtype; session_row public.quiz_daily_sessions%rowtype; reveal boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_bucket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST'; end if;
  select * into attempt_row from public.quiz_attempts where public_reference=p_reference;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  select * into session_row from public.quiz_daily_sessions where id=attempt_row.daily_session_id;
  if attempt_row.status='started' and not public.quiz_is_open(session_row.quiz_date,session_row.override_status) then
    update public.quiz_attempts set status='expired' where id=attempt_row.id;
    attempt_row.status := 'expired';
  end if;
  select coalesce(reveal_answers_after_close,false) and now() >= s.closes_at into reveal
    from public.quiz_settings cross join public.quiz_daily_sessions s where public.quiz_settings.id=true and s.id=attempt_row.daily_session_id;
  return jsonb_build_object('reference',attempt_row.public_reference,'name',attempt_row.participant_name,'date',attempt_row.quiz_date,
    'status',attempt_row.status,'score',attempt_row.score,'correctAnswers',attempt_row.correct_answers,'totalQuestions',attempt_row.total_questions,
    'completionSeconds',attempt_row.completion_seconds,
    'questions',case when attempt_row.status='started' then
      (select jsonb_agg(jsonb_build_object('id',q.id,'position',q.position,'question',q.question_snapshot,'category',b.category,'difficulty',b.difficulty,
        'selectedOptionId',q.selected_option_id,'options',(select jsonb_agg(value order by array_position(q.option_order,(value->>'id')::uuid)) from jsonb_array_elements(q.option_snapshot) value)) order by q.position)
       from public.quiz_attempt_questions q join public.quiz_questions b on b.id=q.question_id where q.attempt_id=attempt_row.id)
      else null end,
    'review',case when reveal and attempt_row.status='completed' then
       (select jsonb_agg(jsonb_build_object('question',q.question_snapshot,'selected',(
          select value->>'label' from jsonb_array_elements(q.option_snapshot) value where (value->>'id')::uuid=q.selected_option_id
        ),'correct',q.correct_option_snapshot,'isCorrect',q.is_correct) order by q.position)
       from public.quiz_attempt_questions q where q.attempt_id=attempt_row.id)
      else null end);
end;
$$;

create or replace function public.admin_save_quiz_question(
  p_question_id uuid,p_question text,p_category text,p_difficulty text,p_explanation text,p_status text,p_options jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare question_id uuid; option_row record; correct_count integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if length(trim(p_question)) not between 8 and 600 or length(trim(p_category)) not between 2 and 80
    or p_difficulty not in ('easy','medium','hard','boss') or p_status not in ('draft','active','archived')
    or jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) <> 4 then raise exception 'INVALID_QUESTION'; end if;
  select count(*) into correct_count from jsonb_array_elements(p_options) as items(value) where (value->>'isCorrect')::boolean;
  if correct_count <> 1 or exists (select 1 from jsonb_array_elements(p_options) as items(value) where length(trim(value->>'label')) not between 1 and 400) then raise exception 'INVALID_OPTIONS'; end if;
  if p_question_id is null then
    insert into public.quiz_questions(question,category,difficulty,explanation,status)
    values(trim(p_question),trim(p_category),p_difficulty,nullif(trim(coalesce(p_explanation,'')),''),p_status) returning id into question_id;
  else
    update public.quiz_questions set question=trim(p_question),category=trim(p_category),difficulty=p_difficulty,
      explanation=nullif(trim(coalesce(p_explanation,'')),''),status=p_status where id=p_question_id returning id into question_id;
    if question_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  end if;
  for option_row in select value,ordinality from jsonb_array_elements(p_options) with ordinality as items(value,ordinality) loop
    insert into public.quiz_options(question_id,label,is_correct,sort_order)
    values(question_id,trim(option_row.value->>'label'),(option_row.value->>'isCorrect')::boolean,(option_row.ordinality-1)::integer)
    on conflict(question_id,sort_order) do update set label=excluded.label,is_correct=excluded.is_correct;
  end loop;
  return question_id;
end;
$$;

create or replace function public.get_quiz_daily_analytics(p_quiz_date date)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'participants',count(*),
    'completed',count(*) filter (where status='completed'),
    'averageScore',coalesce(round(avg(score) filter (where status='completed')),0),
    'highestScore',coalesce(max(score) filter (where status='completed'),0),
    'perfectScores',count(*) filter (where status='completed' and score=100),
    'averageSeconds',coalesce(round(avg(completion_seconds) filter (where status='completed')),0),
    'socialGateCompletions',count(*) filter (where social_gate_confirmed)
  ) from public.quiz_attempts where quiz_date=p_quiz_date;
$$;

create or replace function public.get_quiz_question_analytics()
returns table(question_id uuid, question text, category text, status text, times_shown bigint, correct_answers bigint, incorrect_answers bigint, success_rate numeric)
language sql stable security definer set search_path = '' as $$
  select q.id,q.question,q.category,q.status,
    count(aq.id) as times_shown,
    count(aq.id) filter (where a.status='completed' and aq.is_correct=true) as correct_answers,
    count(aq.id) filter (where a.status='completed' and aq.is_correct=false) as incorrect_answers,
    case when count(aq.id) filter (where a.status='completed')=0 then 0
      else round(100.0*count(aq.id) filter (where a.status='completed' and aq.is_correct=true)
        / count(aq.id) filter (where a.status='completed'),1) end as success_rate
  from public.quiz_questions q
  left join public.quiz_attempt_questions aq on aq.question_id=q.id
  left join public.quiz_attempts a on a.id=aq.attempt_id
  group by q.id,q.question,q.category,q.status order by q.created_at desc;
$$;

create or replace function public.consume_quiz_rate_limit(p_bucket_hash text,p_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare rate_count integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_bucket_hash !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 500 then return false; end if;
  delete from public.quiz_rate_limits where window_start < now() - interval '2 days';
  insert into public.quiz_rate_limits(bucket_hash,window_start) values (p_bucket_hash,date_trunc('hour',now()))
  on conflict (bucket_hash,window_start) do update set attempts=public.quiz_rate_limits.attempts+1 returning attempts into rate_count;
  return rate_count <= p_limit;
end;
$$;

revoke all on function public.quiz_is_open(date,text), public.start_daily_quiz(text,text,text,text,uuid[],text),
  public.save_daily_quiz_answer(text,integer,uuid,text), public.submit_daily_quiz(text,jsonb,text), public.get_public_quiz_attempt(text,text),
  public.admin_save_quiz_question(uuid,text,text,text,text,text,jsonb), public.get_quiz_daily_analytics(date), public.get_quiz_question_analytics(),
  public.consume_quiz_rate_limit(text,integer)
  from public, anon, authenticated;
grant execute on function public.quiz_is_open(date,text), public.start_daily_quiz(text,text,text,text,uuid[],text),
  public.save_daily_quiz_answer(text,integer,uuid,text), public.submit_daily_quiz(text,jsonb,text), public.get_public_quiz_attempt(text,text),
  public.admin_save_quiz_question(uuid,text,text,text,text,text,jsonb), public.get_quiz_daily_analytics(date), public.get_quiz_question_analytics(),
  public.consume_quiz_rate_limit(text,integer)
  to service_role;

commit;
