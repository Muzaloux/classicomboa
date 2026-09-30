begin;

alter table public.event_editions add column ticket_capacity integer check(ticket_capacity between 0 and 1000000);
update public.event_editions set ticket_capacity=500 where id='edition-8';
alter table public.payment_transactions drop constraint payment_transactions_provider_check;
alter table public.payment_transactions add constraint payment_transactions_provider_check check(provider in ('test','manual_mobile_money'));
alter table public.payment_transactions add column contact text check(contact in ('manuel','youana'));
alter table public.payment_transactions add column receipt_reference text;
alter table public.payment_transactions add column confirmed_by uuid references public.user_profiles(id);
create unique index manual_receipt_once on public.payment_transactions(lower(receipt_reference)) where receipt_reference is not null;

insert into public.ticket_types(id,edition_id,name,price_xaf,capacity,status,is_test) values
('10000000-0000-4000-8000-000000000011','edition-8','Classique',1000,500,'active',false),
('10000000-0000-4000-8000-000000000012','edition-8','VIP',2000,500,'active',false);

create or replace function public.ticket_catalog(p_edition text,p_test boolean)
returns table(id uuid,name text,price_xaf integer,available integer,is_test boolean)
language sql stable security definer set search_path='' as $$
  select t.id,t.name,t.price_xaf,greatest(0,least(
    t.capacity-coalesce((select sum(o.quantity)::integer from public.ticket_orders o where o.ticket_type_id=t.id and (o.status='paid' or (o.status='pending' and o.expires_at>now()))),0),
    case when p_test then t.capacity else coalesce(e.ticket_capacity,0)-coalesce((select sum(o.quantity)::integer from public.ticket_orders o where o.edition_id=e.id and not o.is_test and (o.status='paid' or (o.status='pending' and o.expires_at>now()))),0) end
  )),t.is_test from public.ticket_types t join public.event_editions e on e.id=t.edition_id
  where t.edition_id=p_edition and t.is_test=p_test and t.status='active' and e.status in ('upcoming','sales_open','live')
    and (t.sale_start is null or t.sale_start<=now()) and (t.sale_end is null or t.sale_end>now()) order by t.price_xaf,t.name;
$$;

create function public.reserve_manual_ticket_order(p_edition text,p_type uuid,p_quantity integer,p_name text,p_email text,p_phone text,p_request uuid,p_access_hash text,p_contact text)
returns text language plpgsql security definer set search_path='' as $$
declare e public.event_editions; t public.ticket_types; o public.ticket_orders; used_count integer; attempts integer;
begin
  if p_contact is null or p_contact not in ('manuel','youana') or p_request is null or p_type is null or p_quantity is null or p_quantity not between 1 and 10 or p_access_hash is null or p_access_hash !~ '^[a-f0-9]{64}$' or p_name is null or p_email is null or p_phone is null then raise exception 'INVALID_ORDER'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select * into o from public.ticket_orders where request_id=p_request;
  if found then
    if o.edition_id<>p_edition or o.is_test or o.access_hash<>p_access_hash or o.ticket_type_id<>p_type or o.quantity<>p_quantity or o.customer_email<>lower(trim(p_email)) or o.customer_name<>trim(p_name) or o.customer_phone<>p_phone or not exists(select 1 from public.payment_transactions where order_id=o.id and contact=p_contact) then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
  -- All real orders lock the edition first: Classique and VIP share 500 places.
  select * into e from public.event_editions where id=p_edition for update;
  if not found or e.ticket_capacity is null or e.status not in ('upcoming','sales_open','live') then raise exception 'SALES_CLOSED'; end if;
  select * into t from public.ticket_types where id=p_type and edition_id=p_edition for update;
  if not found or t.is_test or t.status<>'active' or (t.sale_start is not null and t.sale_start>now()) or (t.sale_end is not null and t.sale_end<=now()) then raise exception 'SALES_CLOSED'; end if;
  update public.ticket_orders set status='expired' where edition_id=p_edition and not is_test and status='pending' and expires_at<=now();
  update public.payment_transactions set status='expired' where provider='manual_mobile_money' and status='pending' and order_id in(select id from public.ticket_orders where edition_id=p_edition and status='expired');
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where edition_id=p_edition and not is_test and status in ('pending','paid');
  if used_count+p_quantity>e.ticket_capacity then raise exception 'SOLD_OUT'; end if;
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where ticket_type_id=p_type and status in ('pending','paid');
  if used_count+p_quantity>t.capacity then raise exception 'SOLD_OUT'; end if;
  insert into public.submission_limits(bucket,window_start) values('order:'||md5(lower(trim(p_email))),date_trunc('hour',now()))
    on conflict(bucket,window_start) do update set attempts=public.submission_limits.attempts+1 returning submission_limits.attempts into attempts;
  if attempts>5 then raise exception 'RATE_LIMITED'; end if;
  -- A single phone can hold at most ten unpaid places, even across email addresses.
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where edition_id=p_edition and not is_test and status='pending' and customer_phone=p_phone;
  if used_count+p_quantity>10 then raise exception 'TOO_MANY_PENDING'; end if;
  insert into public.ticket_orders(request_id,access_hash,edition_id,ticket_type_id,quantity,customer_name,customer_email,customer_phone,total_xaf,is_test,expires_at)
    values(p_request,p_access_hash,p_edition,p_type,p_quantity,trim(p_name),lower(trim(p_email)),p_phone,t.price_xaf*p_quantity,false,now()+interval '2 hours') returning * into o;
  insert into public.ticket_order_items(order_id,ticket_type_id,name,quantity,unit_price_xaf) values(o.id,t.id,t.name,p_quantity,t.price_xaf);
  insert into public.payment_transactions(order_id,provider,provider_reference,amount_xaf,contact) values(o.id,'manual_mobile_money',o.reference,o.total_xaf,p_contact);
  return o.reference;
end;
$$;

create function public.confirm_manual_payment(p_edition text,p_reference text,p_amount integer,p_receipt text)
returns text language plpgsql security definer set search_path='' as $$
declare o public.ticket_orders; payment public.payment_transactions; n integer; used_count integer; total_capacity integer; t public.ticket_types;
begin
  if not public.has_edition_role(p_edition,array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  if p_receipt is null or length(trim(p_receipt)) not between 6 and 100 then raise exception 'INVALID_RECEIPT'; end if;
  select ticket_capacity into total_capacity from public.event_editions where id=p_edition for update;
  select * into o from public.ticket_orders where reference=p_reference and edition_id=p_edition;
  if not found or o.is_test then raise exception 'NOT_FOUND'; end if;
  select * into t from public.ticket_types where id=o.ticket_type_id for update;
  select * into o from public.ticket_orders where id=o.id for update;
  select * into payment from public.payment_transactions where order_id=o.id for update;
  if payment.provider<>'manual_mobile_money' then raise exception 'WRONG_PROVIDER'; end if;
  if p_amount is distinct from payment.amount_xaf then raise exception 'AMOUNT_MISMATCH'; end if;
  if o.status='paid' then
    if lower(payment.receipt_reference)=lower(trim(p_receipt)) then return 'paid'; end if;
    raise exception 'PAYMENT_STATE_CONFLICT';
  end if;
  if o.status not in ('pending','expired') then raise exception 'PAYMENT_STATE_CONFLICT'; end if;
  -- An actual late receipt can be reconciled only if capacity still exists.
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where edition_id=p_edition and not is_test and id<>o.id and (status='paid' or (status='pending' and expires_at>now()));
  if total_capacity is null or used_count+o.quantity>total_capacity then raise exception 'SOLD_OUT_REVIEW_PAYMENT'; end if;
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where ticket_type_id=o.ticket_type_id and id<>o.id and (status='paid' or (status='pending' and expires_at>now()));
  if used_count+o.quantity>t.capacity then raise exception 'SOLD_OUT_REVIEW_PAYMENT'; end if;
  update public.payment_transactions set status='successful',settled_at=now(),receipt_reference=trim(p_receipt),confirmed_by=auth.uid() where id=payment.id;
  update public.ticket_orders set status='paid' where id=o.id;
  for n in 1..o.quantity loop
    insert into public.tickets(order_id,edition_id,ticket_type_id,unit_number,holder_name,is_test) values(o.id,o.edition_id,o.ticket_type_id,n,o.customer_name,false);
  end loop;
  insert into public.audit_events(edition_id,actor_id,entity_id,action,old_status,new_status) values(p_edition,auth.uid(),o.id,'payment.manually_confirmed',o.status,'paid');
  return 'paid';
end;
$$;
revoke all on function public.reserve_manual_ticket_order(text,uuid,integer,text,text,text,uuid,text,text),public.confirm_manual_payment(text,text,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_manual_ticket_order(text,uuid,integer,text,text,text,uuid,text,text) to service_role;
grant execute on function public.confirm_manual_payment(text,text,integer,text) to authenticated;
commit;
