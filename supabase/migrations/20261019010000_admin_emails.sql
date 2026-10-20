-- Emails listed here become admin automatically on first sign-in (Google or email).
-- Add more admins with: insert into public.admin_emails (email) values ('name@gmail.com');
create table if not exists public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security;  -- no policies: not readable via API
revoke all on public.admin_emails from anon, authenticated;

insert into public.admin_emails (email) values ('tanzirrifat78456@gmail.com') on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone,
    new.email,
    case when exists (select 1 from public.admin_emails a where a.email = lower(coalesce(new.email, '')))
         then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
