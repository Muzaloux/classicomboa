begin;

alter table public.ticket_orders
  add column referral_sources text[] not null default '{}',
  add constraint ticket_orders_referral_sources_check
    check (
      cardinality(referral_sources) <= 6
      and referral_sources <@ array[
        'friends',
        'facebook',
        'instagram',
        'whatsapp',
        'influencer_tik_dengue',
        'influencer_willy_namaso'
      ]::text[]
    );

drop function public.reserve_ticket_order(uuid,integer,text,text,text,uuid,text,boolean);
create function public.reserve_ticket_order(
  p_type uuid,
  p_quantity integer,
  p_name text,
  p_email text,
  p_phone text,
  p_request uuid,
  p_access_hash text,
  p_test boolean,
  p_referral_sources text[]
)
returns text language plpgsql security definer set search_path='' as $$
declare t public.ticket_types; o public.ticket_orders; used_count integer; attempts integer;
begin
  if p_test is distinct from true or p_request is null or p_type is null or p_name is null or p_phone is null or p_quantity is null or p_quantity not between 1 and 100 or p_access_hash is null or p_access_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_ORDER'; end if;
  if p_referral_sources is null
    or array_position(p_referral_sources, null) is not null
    or cardinality(p_referral_sources) > 6
    or exists (
      select 1 from unnest(p_referral_sources) as source(value)
      where source.value not in ('friends','facebook','instagram','whatsapp','influencer_tik_dengue','influencer_willy_namaso')
    )
    or cardinality(p_referral_sources) <> (
      select count(distinct value) from unnest(p_referral_sources) as source(value)
    )
  then raise exception 'INVALID_REFERRAL_SOURCES'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select * into o from public.ticket_orders where request_id=p_request;
  if found then
    if o.access_hash<>p_access_hash or o.ticket_type_id<>p_type or o.quantity<>p_quantity or o.customer_email is distinct from nullif(lower(trim(p_email)),'') or o.customer_name<>trim(p_name) or o.customer_phone<>p_phone or o.is_test<>p_test or o.referral_sources<>p_referral_sources then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
  select * into t from public.ticket_types where id=p_type for update;
  if not found or t.status<>'active' or t.is_test<>p_test or (t.sale_start is not null and t.sale_start>now()) or (t.sale_end is not null and t.sale_end<=now()) then raise exception 'SALES_CLOSED'; end if;
  if not exists(select 1 from public.event_editions where id=t.edition_id and status in ('upcoming','sales_open','live')) then raise exception 'SALES_CLOSED'; end if;
  if not p_test then raise exception 'LIVE_PAYMENTS_UNAVAILABLE'; end if;
  update public.ticket_orders set status='expired' where ticket_type_id=t.id and status='pending' and expires_at<=now();
  update public.payment_transactions set status='expired' where status='pending' and order_id in (select id from public.ticket_orders where ticket_type_id=t.id and status='expired');
  select coalesce(sum(quantity),0)::integer into used_count from public.ticket_orders where ticket_type_id=t.id and status in ('pending','paid');
  if used_count+p_quantity>t.capacity then raise exception 'SOLD_OUT'; end if;
  insert into public.submission_limits(bucket,window_start) values ('order-phone:'||md5(p_phone),date_trunc('hour',now()))
    on conflict(bucket,window_start) do update set attempts=public.submission_limits.attempts+1 returning submission_limits.attempts into attempts;
  if attempts>10 then raise exception 'RATE_LIMITED'; end if;
  insert into public.ticket_orders(request_id,access_hash,edition_id,ticket_type_id,quantity,customer_name,customer_email,customer_phone,total_xaf,is_test,referral_sources)
    values(p_request,p_access_hash,t.edition_id,t.id,p_quantity,trim(p_name),nullif(lower(trim(p_email)),''),p_phone,t.price_xaf*p_quantity,p_test,p_referral_sources) returning * into o;
  insert into public.ticket_order_items(order_id,ticket_type_id,name,quantity,unit_price_xaf) values(o.id,t.id,t.name,p_quantity,t.price_xaf);
  insert into public.payment_transactions(order_id,provider,provider_reference,amount_xaf) values(o.id,'test',o.reference,o.total_xaf);
  return o.reference;
end;
$$;

drop function public.reserve_manual_ticket_order(text,uuid,integer,text,text,text,uuid,text,text);
create function public.reserve_manual_ticket_order(
  p_edition text,
  p_type uuid,
  p_quantity integer,
  p_name text,
  p_email text,
  p_phone text,
  p_request uuid,
  p_access_hash text,
  p_contact text,
  p_referral_sources text[]
)
returns text language plpgsql security definer set search_path='' as $$
declare e public.event_editions; t public.ticket_types; o public.ticket_orders; used_count integer; attempts integer;
begin
  if p_contact is null or p_contact not in ('manuel','youana') or p_request is null or p_type is null or p_quantity is null or p_quantity not between 1 and 100 or p_access_hash is null or p_access_hash !~ '^[a-f0-9]{64}$' or p_name is null or p_phone is null then raise exception 'INVALID_ORDER'; end if;
  if p_referral_sources is null
    or array_position(p_referral_sources, null) is not null
    or cardinality(p_referral_sources) > 6
    or exists (
      select 1 from unnest(p_referral_sources) as source(value)
      where source.value not in ('friends','facebook','instagram','whatsapp','influencer_tik_dengue','influencer_willy_namaso')
    )
    or cardinality(p_referral_sources) <> (
      select count(distinct value) from unnest(p_referral_sources) as source(value)
    )
  then raise exception 'INVALID_REFERRAL_SOURCES'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select * into o from public.ticket_orders where request_id=p_request;
  if found then
    if o.edition_id<>p_edition or o.is_test or o.access_hash<>p_access_hash or o.ticket_type_id<>p_type or o.quantity<>p_quantity or o.customer_email is distinct from nullif(lower(trim(p_email)),'') or o.customer_name<>trim(p_name) or o.customer_phone<>p_phone or o.referral_sources<>p_referral_sources or not exists(select 1 from public.payment_transactions where order_id=o.id and contact=p_contact) then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
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
  insert into public.submission_limits(bucket,window_start) values('order-phone:'||md5(p_phone),date_trunc('hour',now()))
    on conflict(bucket,window_start) do update set attempts=public.submission_limits.attempts+1 returning submission_limits.attempts into attempts;
  if attempts>5 then raise exception 'RATE_LIMITED'; end if;
  insert into public.ticket_orders(request_id,access_hash,edition_id,ticket_type_id,quantity,customer_name,customer_email,customer_phone,total_xaf,is_test,expires_at,referral_sources)
    values(p_request,p_access_hash,p_edition,p_type,p_quantity,trim(p_name),nullif(lower(trim(p_email)),''),p_phone,t.price_xaf*p_quantity,false,now()+interval '2 hours',p_referral_sources) returning * into o;
  insert into public.ticket_order_items(order_id,ticket_type_id,name,quantity,unit_price_xaf) values(o.id,t.id,t.name,p_quantity,t.price_xaf);
  insert into public.payment_transactions(order_id,provider,provider_reference,amount_xaf,contact) values(o.id,'manual_mobile_money',o.reference,o.total_xaf,p_contact);
  return o.reference;
end;
$$;

revoke all on function public.reserve_ticket_order(uuid,integer,text,text,text,uuid,text,boolean,text[]) from public,anon,authenticated;
revoke all on function public.reserve_manual_ticket_order(text,uuid,integer,text,text,text,uuid,text,text,text[]) from public,anon,authenticated;
grant execute on function public.reserve_ticket_order(uuid,integer,text,text,text,uuid,text,boolean,text[]) to service_role;
grant execute on function public.reserve_manual_ticket_order(text,uuid,integer,text,text,text,uuid,text,text,text[]) to service_role;

commit;
