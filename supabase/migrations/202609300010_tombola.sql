begin;

create table public.tombola_draws (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references public.event_editions(id),
  name text not null check (length(name) between 2 and 100),
  prize text not null default 'Lots à annoncer',
  price_xaf integer not null default 500 check (price_xaf >= 0),
  winners_count integer not null default 1 check (winners_count between 1 and 100),
  status text not null default 'draft' check (status in ('draft','open','closed','drawn')),
  results_public boolean not null default false,
  drawn_at timestamptz,
  drawn_by uuid references auth.users(id) on delete set null,
  sort_order integer not null default 0
);
create table public.tombola_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('CT-' || replace(gen_random_uuid()::text,'-','')),
  request_id uuid not null unique,
  access_hash text not null check (access_hash ~ '^[a-f0-9]{64}$'),
  edition_id text not null references public.event_editions(id),
  draw_id uuid not null references public.tombola_draws(id),
  quantity integer not null check (quantity between 1 and 100),
  buyer_name text not null check (length(buyer_name) between 2 and 100),
  buyer_phone text not null,
  contact text not null check (contact in ('manuel','youana')),
  total_xaf integer not null check (total_xaf >= 0),
  status text not null default 'pending' check (status in ('pending','paid','expired')),
  receipt_reference text,
  confirmed_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create unique index tombola_receipt_once on public.tombola_orders(lower(receipt_reference)) where receipt_reference is not null;
create table public.tombola_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.tombola_draws(id),
  order_id uuid not null references public.tombola_orders(id),
  entry_number integer not null,
  unique (draw_id, entry_number)
);
create table public.tombola_winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.tombola_draws(id),
  entry_id uuid not null unique references public.tombola_entries(id),
  rank integer not null check (rank >= 1),
  unique (draw_id, rank)
);

alter table public.tombola_draws enable row level security;
alter table public.tombola_orders enable row level security;
alter table public.tombola_entries enable row level security;
alter table public.tombola_winners enable row level security;
revoke all on public.tombola_draws, public.tombola_orders, public.tombola_entries, public.tombola_winners from anon, authenticated;
grant all on public.tombola_draws, public.tombola_orders, public.tombola_entries, public.tombola_winners to service_role;
grant select on public.tombola_draws, public.tombola_orders, public.tombola_entries, public.tombola_winners to authenticated;
grant update (status, results_public, prize, winners_count) on public.tombola_draws to authenticated;
create policy tombola_draws_staff on public.tombola_draws for select to authenticated using (public.has_edition_role(edition_id, array['admin','manager']));
create policy tombola_draws_staff_update on public.tombola_draws for update to authenticated using (public.has_edition_role(edition_id, array['admin','manager']) and status <> 'drawn') with check (public.has_edition_role(edition_id, array['admin','manager']) and status <> 'drawn');
create policy tombola_orders_staff on public.tombola_orders for select to authenticated using (public.has_edition_role(edition_id, array['admin','manager']));
create policy tombola_entries_staff on public.tombola_entries for select to authenticated using (exists (select 1 from public.tombola_draws d where d.id = draw_id and public.has_edition_role(d.edition_id, array['admin','manager'])));
create policy tombola_winners_staff on public.tombola_winners for select to authenticated using (exists (select 1 from public.tombola_draws d where d.id = draw_id and public.has_edition_role(d.edition_id, array['admin','manager'])));

insert into public.tombola_draws(id, edition_id, name, status) values ('30000000-0000-4000-8000-000000000001', 'edition-8', 'Grande tombola du Classico', 'open');

create function public.reserve_tombola_order(p_edition text, p_draw uuid, p_quantity integer, p_name text, p_phone text, p_request uuid, p_access_hash text, p_contact text)
returns text language plpgsql security definer set search_path = '' as $$
declare d public.tombola_draws; o public.tombola_orders; attempts integer;
begin
  if p_contact is null or p_contact not in ('manuel','youana') or p_request is null or p_draw is null or p_quantity is null or p_quantity not between 1 and 100 or p_access_hash is null or p_access_hash !~ '^[a-f0-9]{64}$' or p_name is null or p_phone is null then raise exception 'INVALID_ORDER'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text, 0));
  select * into o from public.tombola_orders where request_id = p_request;
  if found then
    if o.edition_id <> p_edition or o.access_hash <> p_access_hash or o.draw_id <> p_draw or o.quantity <> p_quantity or o.buyer_phone <> p_phone then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
  select * into d from public.tombola_draws where id = p_draw and edition_id = p_edition;
  if not found or d.status <> 'open' then raise exception 'TOMBOLA_CLOSED'; end if;
  insert into public.submission_limits(bucket, window_start) values ('tombola-phone:' || md5(p_phone), date_trunc('hour', now()))
    on conflict (bucket, window_start) do update set attempts = public.submission_limits.attempts + 1 returning submission_limits.attempts into attempts;
  if attempts > 10 then raise exception 'RATE_LIMITED'; end if;
  insert into public.tombola_orders(request_id, access_hash, edition_id, draw_id, quantity, buyer_name, buyer_phone, contact, total_xaf, expires_at)
    values (p_request, p_access_hash, p_edition, d.id, p_quantity, trim(p_name), p_phone, p_contact, d.price_xaf * p_quantity, now() + interval '2 hours') returning * into o;
  return o.reference;
end;
$$;

create function public.confirm_tombola_payment(p_edition text, p_reference text, p_amount integer, p_receipt text)
returns text language plpgsql security definer set search_path = '' as $$
declare o public.tombola_orders; d public.tombola_draws; start_number integer;
begin
  if not public.has_edition_role(p_edition, array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  if p_receipt is null or length(trim(p_receipt)) not between 6 and 100 then raise exception 'INVALID_RECEIPT'; end if;
  select * into o from public.tombola_orders where reference = p_reference and edition_id = p_edition;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into d from public.tombola_draws where id = o.draw_id for update;
  select * into o from public.tombola_orders where id = o.id for update;
  if p_amount is distinct from o.total_xaf then raise exception 'AMOUNT_MISMATCH'; end if;
  if o.status = 'paid' then
    if lower(o.receipt_reference) = lower(trim(p_receipt)) then return 'paid'; end if;
    raise exception 'PAYMENT_STATE_CONFLICT';
  end if;
  if d.status = 'drawn' then raise exception 'DRAW_DONE'; end if;
  select coalesce(max(entry_number), 0) into start_number from public.tombola_entries where draw_id = d.id;
  insert into public.tombola_entries(draw_id, order_id, entry_number) select d.id, o.id, start_number + n from generate_series(1, o.quantity) n;
  update public.tombola_orders set status = 'paid', receipt_reference = trim(p_receipt), confirmed_by = auth.uid(), paid_at = now() where id = o.id;
  insert into public.audit_events(edition_id, actor_id, entity_id, action, old_status, new_status) values (p_edition, auth.uid(), o.id, 'tombola.payment_confirmed', o.status, 'paid');
  return 'paid';
end;
$$;

-- The draw is server-side only: one winning entry per buyer, chosen with the database's secure random source.
create function public.draw_tombola(p_edition text, p_draw uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare d public.tombola_draws; n integer;
begin
  if not public.has_edition_role(p_edition, array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  select * into d from public.tombola_draws where id = p_draw and edition_id = p_edition for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if d.status = 'drawn' then raise exception 'ALREADY_DRAWN'; end if;
  if d.status <> 'closed' then raise exception 'CLOSE_FIRST'; end if;
  if exists (select 1 from public.tombola_orders where draw_id = d.id and status = 'pending' and expires_at > now()) then raise exception 'PENDING_PAYMENTS'; end if;
  insert into public.tombola_winners(draw_id, entry_id, rank)
    select d.id, picked.id, row_number() over (order by picked.r)
    from (select * from (select distinct on (e.order_id) e.id, gen_random_uuid() r from public.tombola_entries e where e.draw_id = d.id order by e.order_id, gen_random_uuid()) one_per_buyer order by r limit d.winners_count) picked;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'NO_ENTRIES'; end if;
  update public.tombola_draws set status = 'drawn', drawn_at = now(), drawn_by = auth.uid() where id = d.id;
  insert into public.audit_events(edition_id, actor_id, entity_id, action, old_status, new_status) values (p_edition, auth.uid(), d.id, 'tombola.drawn', 'closed', 'drawn');
  return n;
end;
$$;

create function public.tombola_winners_public(p_edition text)
returns table(draw_name text, prize text, rank integer, entry_number integer, winner text)
language sql security definer set search_path = '' stable as $$
  select d.name, d.prize, w.rank, e.entry_number,
    initcap(split_part(trim(o.buyer_name), ' ', 1)) || case when position(' ' in trim(o.buyer_name)) > 0 then ' ' || upper(left(regexp_replace(trim(o.buyer_name), '^.* ', ''), 1)) || '.' else '' end
  from public.tombola_draws d
  join public.tombola_winners w on w.draw_id = d.id
  join public.tombola_entries e on e.id = w.entry_id
  join public.tombola_orders o on o.id = e.order_id
  where d.edition_id = p_edition and d.status = 'drawn' and d.results_public
  order by d.sort_order, w.rank;
$$;

revoke all on function public.reserve_tombola_order(text,uuid,integer,text,text,uuid,text,text), public.confirm_tombola_payment(text,text,integer,text), public.draw_tombola(text,uuid), public.tombola_winners_public(text) from public, anon, authenticated;
grant execute on function public.reserve_tombola_order(text,uuid,integer,text,text,uuid,text,text), public.tombola_winners_public(text) to service_role;
grant execute on function public.confirm_tombola_payment(text,text,integer,text), public.draw_tombola(text,uuid) to authenticated;
commit;
