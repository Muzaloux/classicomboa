begin;

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references public.event_editions(id),
  name text not null check (length(name) between 2 and 100),
  price_xaf integer not null check (price_xaf between 0 and 10000000),
  capacity integer not null check (capacity between 0 and 1000000),
  status text not null default 'draft' check (status in ('draft','active','paused','closed')),
  is_test boolean not null default true,
  sale_start timestamptz,
  sale_end timestamptz,
  created_at timestamptz not null default now(),
  unique(id, edition_id),
  check (sale_end is null or sale_start is null or sale_end > sale_start)
);

create table public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('CM-' || replace(gen_random_uuid()::text,'-','')),
  request_id uuid not null unique,
  access_hash text not null check (access_hash ~ '^[a-f0-9]{64}$'),
  edition_id text not null references public.event_editions(id),
  ticket_type_id uuid not null,
  quantity integer not null check (quantity between 1 and 10),
  customer_name text not null check (length(customer_name) between 2 and 100),
  customer_email text not null check (length(customer_email) between 3 and 254),
  customer_phone text not null check (customer_phone ~ '^\+2376[0-9]{8}$'),
  total_xaf integer not null check (total_xaf >= 0),
  currency text not null default 'XAF' check (currency = 'XAF'),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired','cancelled')),
  is_test boolean not null,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  foreign key(ticket_type_id,edition_id) references public.ticket_types(id,edition_id),
  unique(id,edition_id)
);
create index ticket_orders_inventory on public.ticket_orders(ticket_type_id,status,expires_at);
create index ticket_orders_edition on public.ticket_orders(edition_id,created_at desc);

create table public.ticket_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.ticket_orders(id),
  ticket_type_id uuid not null references public.ticket_types(id),
  name text not null,
  quantity integer not null check(quantity between 1 and 10),
  unit_price_xaf integer not null check(unit_price_xaf >= 0),
  total_xaf integer generated always as (quantity * unit_price_xaf) stored
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.ticket_orders(id),
  provider text not null check(provider in ('test')),
  provider_reference text not null unique,
  amount_xaf integer not null check(amount_xaf >= 0),
  currency text not null default 'XAF' check(currency='XAF'),
  status text not null default 'pending' check(status in ('pending','successful','failed','expired')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create table public.payment_events (
  event_id text primary key check(length(event_id) between 8 and 200),
  payment_id uuid not null references public.payment_transactions(id),
  outcome text not null check(outcome in ('successful','failed')),
  created_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique default ('TKT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
  qr_token text not null unique default (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  order_id uuid not null,
  edition_id text not null,
  ticket_type_id uuid not null,
  unit_number integer not null check(unit_number between 1 and 10),
  holder_name text not null,
  status text not null default 'valid' check(status in ('valid','used','void')),
  is_test boolean not null,
  issued_at timestamptz not null default now(),
  checked_in_at timestamptz,
  unique(order_id,unit_number),
  foreign key(order_id,edition_id) references public.ticket_orders(id,edition_id),
  foreign key(ticket_type_id,edition_id) references public.ticket_types(id,edition_id)
);
create index tickets_edition_status on public.tickets(edition_id,status);
create table public.ticket_checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id),
  edition_id text not null references public.event_editions(id),
  scanned_by uuid not null references public.user_profiles(id),
  gate text not null check(length(gate) between 1 and 60),
  result text not null check(result in ('accepted','already_used','invalid','void','wrong_mode')),
  scanned_at timestamptz not null default now()
);
create unique index single_accepted_checkin on public.ticket_checkins(ticket_id) where result='accepted';
create index ticket_checkins_edition_time on public.ticket_checkins(edition_id,scanned_at desc);

create function public.has_edition_role(p_edition text, p_roles text[]) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.edition_staff s join public.user_profiles p on p.id=s.user_id
    where s.user_id=auth.uid() and s.edition_id=p_edition and s.role=any(p_roles) and p.status='active');
$$;

create function public.ticket_catalog(p_edition text, p_test boolean)
returns table(id uuid, name text, price_xaf integer, available integer, is_test boolean)
language sql stable security definer set search_path='' as $$
  select t.id,t.name,t.price_xaf,greatest(0,t.capacity-coalesce((select sum(o.quantity)::integer
    from public.ticket_orders o where o.ticket_type_id=t.id and (o.status='paid' or (o.status='pending' and o.expires_at>now()))),0)),t.is_test
  from public.ticket_types t join public.event_editions e on e.id=t.edition_id
  where t.edition_id=p_edition and t.is_test=p_test and t.status='active'
    and e.status in ('upcoming','sales_open','live')
    and (t.sale_start is null or t.sale_start<=now()) and (t.sale_end is null or t.sale_end>now())
  order by t.price_xaf,t.name;
$$;

-- A single type per checkout keeps the stock-lock order deterministic.
create function public.reserve_ticket_order(p_type uuid,p_quantity integer,p_name text,p_email text,p_phone text,p_request uuid,p_access_hash text,p_test boolean)
returns text language plpgsql security definer set search_path='' as $$
declare t public.ticket_types; o public.ticket_orders; used_count integer; attempts integer;
begin
  if p_test is distinct from true or p_request is null or p_type is null or p_name is null or p_email is null or p_phone is null or p_quantity is null or p_quantity not between 1 and 10 or p_access_hash is null or p_access_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_ORDER'; end if;
  -- Serializes same request keys even when a caller changes the requested type.
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select * into o from public.ticket_orders where request_id=p_request;
  if found then
    if o.access_hash<>p_access_hash or o.ticket_type_id<>p_type or o.quantity<>p_quantity or o.customer_email<>lower(trim(p_email)) or o.customer_name<>trim(p_name) or o.customer_phone<>p_phone or o.is_test<>p_test then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
  select * into t from public.ticket_types where id=p_type for update;
  if not found or t.status<>'active' or t.is_test<>p_test or (t.sale_start is not null and t.sale_start>now()) or (t.sale_end is not null and t.sale_end<=now()) then raise exception 'SALES_CLOSED'; end if;
  if not exists(select 1 from public.event_editions where id=t.edition_id and status in ('upcoming','sales_open','live')) then raise exception 'SALES_CLOSED'; end if;
  -- Live providers will be added deliberately; the current RPC cannot create live orders.
  if not p_test then raise exception 'LIVE_PAYMENTS_UNAVAILABLE'; end if;
  update public.ticket_orders set status='expired' where ticket_type_id=t.id and status='pending' and expires_at<=now();
  update public.payment_transactions set status='expired' where status='pending' and order_id in (select id from public.ticket_orders where ticket_type_id=t.id and status='expired');
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where ticket_type_id=t.id and status in ('pending','paid');
  if used_count+p_quantity>t.capacity then raise exception 'SOLD_OUT'; end if;
  insert into public.submission_limits(bucket,window_start) values ('order:'||md5(lower(trim(p_email))),date_trunc('hour',now()))
    on conflict(bucket,window_start) do update set attempts=public.submission_limits.attempts+1 returning submission_limits.attempts into attempts;
  if attempts>10 then raise exception 'RATE_LIMITED'; end if;
  insert into public.ticket_orders(request_id,access_hash,edition_id,ticket_type_id,quantity,customer_name,customer_email,customer_phone,total_xaf,is_test)
    values(p_request,p_access_hash,t.edition_id,t.id,p_quantity,trim(p_name),lower(trim(p_email)),p_phone,t.price_xaf*p_quantity,p_test) returning * into o;
  insert into public.ticket_order_items(order_id,ticket_type_id,name,quantity,unit_price_xaf) values(o.id,t.id,t.name,p_quantity,t.price_xaf);
  insert into public.payment_transactions(order_id,provider,provider_reference,amount_xaf) values(o.id,'test',o.reference,o.total_xaf);
  return o.reference;
end;
$$;

create function public.settle_test_payment(p_reference text,p_event text,p_amount integer,p_currency text,p_outcome text)
returns text language plpgsql security definer set search_path='' as $$
declare o public.ticket_orders; payment public.payment_transactions; existing public.payment_events; type_id uuid; n integer;
begin
  if p_event is null or length(p_event) not between 8 and 200 or p_outcome is null or p_outcome not in ('successful','failed') then raise exception 'INVALID_OUTCOME'; end if;
  select ticket_type_id into type_id from public.ticket_orders where reference=p_reference;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform 1 from public.ticket_types where id=type_id for update;
  select * into o from public.ticket_orders where reference=p_reference for update;
  select * into payment from public.payment_transactions where order_id=o.id for update;
  if not o.is_test or payment.provider<>'test' then raise exception 'WRONG_PROVIDER'; end if;
  if p_amount is null or p_amount<>payment.amount_xaf or p_currency is distinct from payment.currency then raise exception 'AMOUNT_MISMATCH'; end if;
  select * into existing from public.payment_events where event_id=p_event;
  if found then
    if existing.payment_id<>payment.id or existing.outcome<>p_outcome then raise exception 'EVENT_CONFLICT'; end if;
    return o.status;
  end if;
  if o.status='pending' and o.expires_at<=now() then
    update public.ticket_orders set status='expired' where id=o.id;
    update public.payment_transactions set status='expired' where id=payment.id;
    return 'expired';
  end if;
  if o.status<>'pending' then
    if o.status='expired' then return 'expired'; end if;
    if (o.status='paid' and p_outcome='successful') or (o.status='failed' and p_outcome='failed') then return o.status; end if;
    raise exception 'PAYMENT_STATE_CONFLICT';
  end if;
  insert into public.payment_events(event_id,payment_id,outcome) values(p_event,payment.id,p_outcome);
  update public.payment_transactions set status=p_outcome,settled_at=now() where id=payment.id;
  update public.ticket_orders set status=case when p_outcome='successful' then 'paid' else 'failed' end where id=o.id;
  if p_outcome='successful' then
    for n in 1..o.quantity loop
      insert into public.tickets(order_id,edition_id,ticket_type_id,unit_number,holder_name,is_test)
        values(o.id,o.edition_id,o.ticket_type_id,n,o.customer_name,o.is_test);
    end loop;
  end if;
  return case when p_outcome='successful' then 'paid' else 'failed' end;
end;
$$;

create function public.check_in_ticket(p_edition text,p_input text,p_gate text,p_test boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.tickets; outcome text; attempts integer;
begin
  if not public.has_edition_role(p_edition,array['admin','manager','checkin']) then raise exception 'FORBIDDEN'; end if;
  if p_test is null or p_gate is null or p_input is null or length(trim(p_input)) not between 1 and 100 or length(trim(p_gate)) not between 1 and 60 then raise exception 'INVALID_INPUT'; end if;
  insert into public.submission_limits(bucket,window_start) values('scan:'||auth.uid()::text,date_trunc('minute',now()))
    on conflict(bucket,window_start) do update set attempts=public.submission_limits.attempts+1 returning submission_limits.attempts into attempts;
  if attempts>120 then raise exception 'RATE_LIMITED'; end if;
  select * into t from public.tickets where edition_id=p_edition and (ticket_code=upper(trim(p_input)) or qr_token=replace(trim(p_input),'CM-TICKET:','')) for update;
  if not found then outcome:='invalid';
  elsif t.is_test is distinct from p_test then outcome:='wrong_mode';
  elsif t.status='used' then outcome:='already_used';
  elsif t.status='void' then outcome:='void';
  else
    outcome:='accepted';
    update public.tickets set status='used',checked_in_at=now() where id=t.id;
  end if;
  insert into public.ticket_checkins(ticket_id,edition_id,scanned_by,gate,result) values(t.id,p_edition,auth.uid(),trim(p_gate),outcome);
  return jsonb_build_object('result',outcome,'ticket_code',t.ticket_code,'holder_name',t.holder_name,'is_test',t.is_test);
end;
$$;

create function public.configure_ticket_type(p_id uuid,p_edition text,p_name text,p_price integer,p_capacity integer,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare used_count integer; t public.ticket_types;
begin
  if not public.has_edition_role(p_edition,array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  select * into t from public.ticket_types where id=p_id and edition_id=p_edition for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where ticket_type_id=p_id and (status='paid' or (status='pending' and expires_at>now()));
  if p_capacity<used_count then raise exception 'CAPACITY_BELOW_ALLOCATED'; end if;
  update public.ticket_types set name=p_name,price_xaf=p_price,capacity=p_capacity,status=p_status where id=p_id;
  insert into public.audit_events(edition_id,actor_id,entity_id,action) values(p_edition,auth.uid(),p_id,'ticket_type.updated');
end;
$$;

create function public.void_ticket(p_code text,p_edition text) returns void
language plpgsql security definer set search_path='' as $$
declare t public.tickets;
begin
  if not public.has_edition_role(p_edition,array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  select * into t from public.tickets where ticket_code=p_code and edition_id=p_edition for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if t.status='used' then raise exception 'ALREADY_USED'; end if;
  if t.status='void' then return; end if;
  update public.tickets set status='void' where id=t.id;
  insert into public.audit_events(edition_id,actor_id,entity_id,action,old_status,new_status) values(p_edition,auth.uid(),t.id,'ticket.voided',t.status,'void');
end;
$$;

alter table public.ticket_types enable row level security;
alter table public.ticket_orders enable row level security;
alter table public.ticket_order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_events enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_checkins enable row level security;
revoke all on public.ticket_types,public.ticket_orders,public.ticket_order_items,public.payment_transactions,public.payment_events,public.tickets,public.ticket_checkins from anon,authenticated;
grant all on public.ticket_types,public.ticket_orders,public.ticket_order_items,public.payment_transactions,public.payment_events,public.tickets,public.ticket_checkins to service_role;
grant select on public.ticket_types,public.ticket_orders,public.ticket_order_items,public.payment_transactions,public.tickets,public.ticket_checkins to authenticated;
create policy ticket_types_staff on public.ticket_types for select to authenticated using(public.has_edition_role(edition_id,array['admin','manager']));
create policy ticket_orders_staff on public.ticket_orders for select to authenticated using(public.has_edition_role(edition_id,array['admin','manager']));
create policy ticket_items_staff on public.ticket_order_items for select to authenticated using(exists(select 1 from public.ticket_orders o where o.id=order_id));
create policy payments_staff on public.payment_transactions for select to authenticated using(exists(select 1 from public.ticket_orders o where o.id=order_id));
create policy tickets_staff on public.tickets for select to authenticated using(public.has_edition_role(edition_id,array['admin','manager']));
create policy checkins_staff on public.ticket_checkins for select to authenticated using(public.has_edition_role(edition_id,array['admin','manager']));
revoke all on function public.has_edition_role(text,text[]),public.ticket_catalog(text,boolean),public.reserve_ticket_order(uuid,integer,text,text,text,uuid,text,boolean),public.settle_test_payment(text,text,integer,text,text),public.check_in_ticket(text,text,text,boolean),public.configure_ticket_type(uuid,text,text,integer,integer,text),public.void_ticket(text,text) from public,anon,authenticated;
grant execute on function public.has_edition_role(text,text[]),public.check_in_ticket(text,text,text,boolean),public.configure_ticket_type(uuid,text,text,integer,integer,text),public.void_ticket(text,text) to authenticated;
grant execute on function public.ticket_catalog(text,boolean) to anon,authenticated,service_role;
grant execute on function public.reserve_ticket_order(uuid,integer,text,text,text,uuid,text,boolean),public.settle_test_payment(text,text,integer,text,text) to service_role;

insert into public.ticket_types(id,edition_id,name,price_xaf,capacity,status,is_test) values
('10000000-0000-4000-8000-000000000001','edition-8','Classique — TEST',1000,100,'active',true),
('10000000-0000-4000-8000-000000000002','edition-8','VIP — TEST',2000,50,'active',true);

commit;
