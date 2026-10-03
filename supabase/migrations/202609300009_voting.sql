begin;

create table public.vote_categories (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references public.event_editions(id),
  slug text not null,
  name text not null check (length(name) between 2 and 100),
  price_xaf integer not null default 100 check (price_xaf >= 0),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  results_public boolean not null default false,
  sort_order integer not null default 0,
  unique (edition_id, slug)
);
create table public.vote_candidates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.vote_categories(id),
  name text not null check (length(name) between 1 and 100),
  subtitle text,
  sort_order integer not null default 0
);
create table public.vote_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('CV-' || replace(gen_random_uuid()::text,'-','')),
  request_id uuid not null unique,
  access_hash text not null check (access_hash ~ '^[a-f0-9]{64}$'),
  edition_id text not null references public.event_editions(id),
  category_id uuid not null references public.vote_categories(id),
  candidate_id uuid not null references public.vote_candidates(id),
  quantity integer not null check (quantity between 1 and 100),
  voter_name text not null check (length(voter_name) between 2 and 100),
  voter_phone text not null,
  contact text not null check (contact in ('manuel','youana')),
  total_xaf integer not null check (total_xaf >= 0),
  status text not null default 'pending' check (status in ('pending','paid','expired')),
  receipt_reference text,
  confirmed_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create unique index vote_receipt_once on public.vote_orders(lower(receipt_reference)) where receipt_reference is not null;
create index vote_orders_candidate_paid on public.vote_orders(candidate_id) where status = 'paid';

alter table public.vote_categories enable row level security;
alter table public.vote_candidates enable row level security;
alter table public.vote_orders enable row level security;
revoke all on public.vote_categories, public.vote_candidates, public.vote_orders from anon, authenticated;
grant all on public.vote_categories, public.vote_candidates, public.vote_orders to service_role;
grant select, update on public.vote_categories to authenticated;
grant select on public.vote_candidates, public.vote_orders to authenticated;
create policy vote_categories_staff on public.vote_categories for select to authenticated using (public.has_edition_role(edition_id, array['admin','manager']));
create policy vote_categories_staff_update on public.vote_categories for update to authenticated using (public.has_edition_role(edition_id, array['admin','manager'])) with check (public.has_edition_role(edition_id, array['admin','manager']));
create policy vote_candidates_staff on public.vote_candidates for select to authenticated using (exists (select 1 from public.vote_categories c where c.id = category_id and public.has_edition_role(c.edition_id, array['admin','manager'])));
create policy vote_orders_staff on public.vote_orders for select to authenticated using (public.has_edition_role(edition_id, array['admin','manager']));

insert into public.vote_categories(id,edition_id,slug,name,sort_order) values('20000000-0000-4000-8000-000000000010','edition-8','mvp','MVP du Classico',1);
insert into public.vote_categories(id,edition_id,slug,name,sort_order) values('20000000-0000-4000-8000-000000000011','edition-8','meilleur-real','Meilleur joueur Real Mboa',2);
insert into public.vote_categories(id,edition_id,slug,name,sort_order) values('20000000-0000-4000-8000-000000000012','edition-8','meilleur-barca','Meilleur joueur Barça Mboa',3);
insert into public.vote_candidates(category_id,name,subtitle,sort_order) values
('20000000-0000-4000-8000-000000000010','LUC','Barça Mboa · n° 1',1),
('20000000-0000-4000-8000-000000000010','RUDY','Barça Mboa · n° 18',2),
('20000000-0000-4000-8000-000000000010','MANOEL (c)','Barça Mboa · n° 10',3),
('20000000-0000-4000-8000-000000000010','LA BRÉSILIENNE','Barça Mboa · n° 6',4),
('20000000-0000-4000-8000-000000000010','SYLVANO','Barça Mboa · n° 24',5),
('20000000-0000-4000-8000-000000000010','DILANE KAD','Barça Mboa · n° 8',6),
('20000000-0000-4000-8000-000000000010','POLLO~G','Barça Mboa · n° 17',7),
('20000000-0000-4000-8000-000000000010','NSANGOU','Barça Mboa · n° 5',8),
('20000000-0000-4000-8000-000000000010','TAMETA','Barça Mboa · n° 14',9),
('20000000-0000-4000-8000-000000000010','LE MONSTRE BANGBIA','Barça Mboa · n° 99',10),
('20000000-0000-4000-8000-000000000010','WILLIAM','Barça Mboa · n° 30',11),
('20000000-0000-4000-8000-000000000010','KAPRISKI','Barça Mboa · n° 3',12),
('20000000-0000-4000-8000-000000000010','OPIC','Barça Mboa · n° 25',13),
('20000000-0000-4000-8000-000000000010','NGWEN','Barça Mboa · n° 11',14),
('20000000-0000-4000-8000-000000000010','MANITOU','Barça Mboa · n° 95',15),
('20000000-0000-4000-8000-000000000010','ADRIEL','Barça Mboa · n° 19',16),
('20000000-0000-4000-8000-000000000010','PA''A BONGUE','Barça Mboa · n° 27',17),
('20000000-0000-4000-8000-000000000010','LOÏC MOURAD','Real Mboa · n° 1',18),
('20000000-0000-4000-8000-000000000010','STEPHEN','Real Mboa · n° 22',19),
('20000000-0000-4000-8000-000000000010','TRÉSOR','Real Mboa · n° 47',20),
('20000000-0000-4000-8000-000000000010','BANGUI','Real Mboa · n° 19',21),
('20000000-0000-4000-8000-000000000010','TCHAMI','Real Mboa · n° 5',22),
('20000000-0000-4000-8000-000000000010','BABIDI (C)','Real Mboa · n° 8',23),
('20000000-0000-4000-8000-000000000010','STÉPHANE','Real Mboa · n° 20',24),
('20000000-0000-4000-8000-000000000010','THAURESS','Real Mboa · n° 7',25),
('20000000-0000-4000-8000-000000000010','ALEXANDRE','Real Mboa · n° 17',26),
('20000000-0000-4000-8000-000000000010','BORRIS','Real Mboa · n° 11',27),
('20000000-0000-4000-8000-000000000010','HUGO','Real Mboa · n° 96',28),
('20000000-0000-4000-8000-000000000010','PDB BOSS','Real Mboa · n° 10',29),
('20000000-0000-4000-8000-000000000010','KYLIAN','Real Mboa · n° 6',30),
('20000000-0000-4000-8000-000000000010','D. GENEVIÈVE','Real Mboa · n° 14',31),
('20000000-0000-4000-8000-000000000010','JORDAN','Real Mboa · n° 2',32),
('20000000-0000-4000-8000-000000000010','BEROL','Real Mboa · n° 15',33),
('20000000-0000-4000-8000-000000000010','WILLY NAMASSO','Real Mboa · n° 12',34),
('20000000-0000-4000-8000-000000000010','MR DOUKOURÉ','Real Mboa · n° 13',35),
('20000000-0000-4000-8000-000000000010','YOAN .K','Real Mboa · n° 4',36),
('20000000-0000-4000-8000-000000000010','K. SMOKE','Real Mboa · n° 9',37),
('20000000-0000-4000-8000-000000000011','LOÏC MOURAD','Real Mboa · n° 1',38),
('20000000-0000-4000-8000-000000000011','STEPHEN','Real Mboa · n° 22',39),
('20000000-0000-4000-8000-000000000011','TRÉSOR','Real Mboa · n° 47',40),
('20000000-0000-4000-8000-000000000011','BANGUI','Real Mboa · n° 19',41),
('20000000-0000-4000-8000-000000000011','TCHAMI','Real Mboa · n° 5',42),
('20000000-0000-4000-8000-000000000011','BABIDI (C)','Real Mboa · n° 8',43),
('20000000-0000-4000-8000-000000000011','STÉPHANE','Real Mboa · n° 20',44),
('20000000-0000-4000-8000-000000000011','THAURESS','Real Mboa · n° 7',45),
('20000000-0000-4000-8000-000000000011','ALEXANDRE','Real Mboa · n° 17',46),
('20000000-0000-4000-8000-000000000011','BORRIS','Real Mboa · n° 11',47),
('20000000-0000-4000-8000-000000000011','HUGO','Real Mboa · n° 96',48),
('20000000-0000-4000-8000-000000000011','PDB BOSS','Real Mboa · n° 10',49),
('20000000-0000-4000-8000-000000000011','KYLIAN','Real Mboa · n° 6',50),
('20000000-0000-4000-8000-000000000011','D. GENEVIÈVE','Real Mboa · n° 14',51),
('20000000-0000-4000-8000-000000000011','JORDAN','Real Mboa · n° 2',52),
('20000000-0000-4000-8000-000000000011','BEROL','Real Mboa · n° 15',53),
('20000000-0000-4000-8000-000000000011','WILLY NAMASSO','Real Mboa · n° 12',54),
('20000000-0000-4000-8000-000000000011','MR DOUKOURÉ','Real Mboa · n° 13',55),
('20000000-0000-4000-8000-000000000011','YOAN .K','Real Mboa · n° 4',56),
('20000000-0000-4000-8000-000000000011','K. SMOKE','Real Mboa · n° 9',57),
('20000000-0000-4000-8000-000000000012','LUC','Barça Mboa · n° 1',58),
('20000000-0000-4000-8000-000000000012','RUDY','Barça Mboa · n° 18',59),
('20000000-0000-4000-8000-000000000012','MANOEL (c)','Barça Mboa · n° 10',60),
('20000000-0000-4000-8000-000000000012','LA BRÉSILIENNE','Barça Mboa · n° 6',61),
('20000000-0000-4000-8000-000000000012','SYLVANO','Barça Mboa · n° 24',62),
('20000000-0000-4000-8000-000000000012','DILANE KAD','Barça Mboa · n° 8',63),
('20000000-0000-4000-8000-000000000012','POLLO~G','Barça Mboa · n° 17',64),
('20000000-0000-4000-8000-000000000012','NSANGOU','Barça Mboa · n° 5',65),
('20000000-0000-4000-8000-000000000012','TAMETA','Barça Mboa · n° 14',66),
('20000000-0000-4000-8000-000000000012','LE MONSTRE BANGBIA','Barça Mboa · n° 99',67),
('20000000-0000-4000-8000-000000000012','WILLIAM','Barça Mboa · n° 30',68),
('20000000-0000-4000-8000-000000000012','KAPRISKI','Barça Mboa · n° 3',69),
('20000000-0000-4000-8000-000000000012','OPIC','Barça Mboa · n° 25',70),
('20000000-0000-4000-8000-000000000012','NGWEN','Barça Mboa · n° 11',71),
('20000000-0000-4000-8000-000000000012','MANITOU','Barça Mboa · n° 95',72),
('20000000-0000-4000-8000-000000000012','ADRIEL','Barça Mboa · n° 19',73),
('20000000-0000-4000-8000-000000000012','PA''A BONGUE','Barça Mboa · n° 27',74);
update public.vote_categories set status = 'open' where edition_id = 'edition-8';

create function public.reserve_vote_order(p_edition text, p_candidate uuid, p_quantity integer, p_name text, p_phone text, p_request uuid, p_access_hash text, p_contact text)
returns text language plpgsql security definer set search_path = '' as $$
declare c public.vote_categories; cand public.vote_candidates; o public.vote_orders; attempts integer;
begin
  if p_contact is null or p_contact not in ('manuel','youana') or p_request is null or p_candidate is null or p_quantity is null or p_quantity not between 1 and 100 or p_access_hash is null or p_access_hash !~ '^[a-f0-9]{64}$' or p_name is null or p_phone is null then raise exception 'INVALID_ORDER'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text, 0));
  select * into o from public.vote_orders where request_id = p_request;
  if found then
    if o.edition_id <> p_edition or o.access_hash <> p_access_hash or o.candidate_id <> p_candidate or o.quantity <> p_quantity or o.voter_phone <> p_phone then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
  select * into cand from public.vote_candidates where id = p_candidate;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into c from public.vote_categories where id = cand.category_id and edition_id = p_edition;
  if not found or c.status <> 'open' then raise exception 'VOTING_CLOSED'; end if;
  insert into public.submission_limits(bucket, window_start) values ('vote-phone:' || md5(p_phone), date_trunc('hour', now()))
    on conflict (bucket, window_start) do update set attempts = public.submission_limits.attempts + 1 returning submission_limits.attempts into attempts;
  if attempts > 10 then raise exception 'RATE_LIMITED'; end if;
  insert into public.vote_orders(request_id, access_hash, edition_id, category_id, candidate_id, quantity, voter_name, voter_phone, contact, total_xaf, expires_at)
    values (p_request, p_access_hash, p_edition, c.id, cand.id, p_quantity, trim(p_name), p_phone, p_contact, c.price_xaf * p_quantity, now() + interval '2 hours') returning * into o;
  return o.reference;
end;
$$;

create function public.confirm_vote_payment(p_edition text, p_reference text, p_amount integer, p_receipt text)
returns text language plpgsql security definer set search_path = '' as $$
declare o public.vote_orders;
begin
  if not public.has_edition_role(p_edition, array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  if p_receipt is null or length(trim(p_receipt)) not between 6 and 100 then raise exception 'INVALID_RECEIPT'; end if;
  select * into o from public.vote_orders where reference = p_reference and edition_id = p_edition for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_amount is distinct from o.total_xaf then raise exception 'AMOUNT_MISMATCH'; end if;
  if o.status = 'paid' then
    if lower(o.receipt_reference) = lower(trim(p_receipt)) then return 'paid'; end if;
    raise exception 'PAYMENT_STATE_CONFLICT';
  end if;
  update public.vote_orders set status = 'paid', receipt_reference = trim(p_receipt), confirmed_by = auth.uid(), paid_at = now() where id = o.id;
  insert into public.audit_events(edition_id, actor_id, entity_id, action, old_status, new_status) values (p_edition, auth.uid(), o.id, 'vote.payment_confirmed', o.status, 'paid');
  return 'paid';
end;
$$;

create function public.vote_results(p_edition text, p_public_only boolean)
returns table(category_id uuid, category_name text, candidate_id uuid, candidate_name text, subtitle text, votes bigint)
language plpgsql security definer set search_path = '' stable as $$
begin
  -- Full tallies are for organizers (or the backend service); everyone else only sees published categories.
  if not p_public_only and auth.uid() is not null and not public.has_edition_role(p_edition, array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  return query
  select c.id, c.name, k.id, k.name, k.subtitle, coalesce(sum(o.quantity) filter (where o.status = 'paid'), 0)::bigint
  from public.vote_categories c join public.vote_candidates k on k.category_id = c.id
  left join public.vote_orders o on o.candidate_id = k.id
  where c.edition_id = p_edition and (not p_public_only or c.results_public)
  group by c.id, c.name, c.sort_order, k.id, k.name, k.subtitle, k.sort_order
  order by c.sort_order, 6 desc, k.sort_order;
end;
$$;

revoke all on function public.reserve_vote_order(text,uuid,integer,text,text,uuid,text,text), public.confirm_vote_payment(text,text,integer,text), public.vote_results(text,boolean) from public, anon, authenticated;
grant execute on function public.reserve_vote_order(text,uuid,integer,text,text,uuid,text,text) to service_role;
grant execute on function public.vote_results(text,boolean) to service_role, authenticated;
grant execute on function public.confirm_vote_payment(text,text,integer,text) to authenticated;
commit;
