-- Fix infinite recursion in RLS policies for 'users' table

-- 1. Create a secure function to check if the user is a GERENTE
-- This function runs as the database owner (SECURITY DEFINER), bypassing RLS on the users table.
create or replace function public.is_gerente()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
    and rol = 'GERENTE'
  );
$$;

-- 2. Drop the recursive policy
drop policy "Admin gestiona usuarios" on public.users;

-- 3. Re-create the policy using the secure function
create policy "Admin gestiona usuarios" on public.users
  for all
  using ( public.is_gerente() );
