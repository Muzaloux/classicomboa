-- Supabase's optional platform event trigger does not need API execution grants.
-- Preserve the trigger itself and its table-creation RLS behavior.
begin;
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
commit;
