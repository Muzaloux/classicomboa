begin;

create function public.ticket_referral_stats(p_edition text)
returns table(referral_source text, customer_count bigint, ticket_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_edition_role(p_edition, array['admin','manager']) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    referral.source_key,
    count(distinct orders.customer_phone)::bigint,
    coalesce(sum(orders.quantity), 0)::bigint
  from unnest(array[
    'friends',
    'facebook',
    'instagram',
    'whatsapp',
    'influencer_tik_dengue',
    'influencer_willy_namaso'
  ]::text[]) as referral(source_key)
  left join public.ticket_orders orders
    on orders.edition_id = p_edition
    and orders.status = 'paid'
    and not orders.is_test
    and referral.source_key = any(orders.referral_sources)
  group by referral.source_key
  order by array_position(array[
    'friends',
    'facebook',
    'instagram',
    'whatsapp',
    'influencer_tik_dengue',
    'influencer_willy_namaso'
  ]::text[], referral.source_key);
end;
$$;

revoke all on function public.ticket_referral_stats(text) from public, anon, authenticated;
grant execute on function public.ticket_referral_stats(text) to authenticated;

commit;
