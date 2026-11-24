-- Local stand-in for the Supabase pieces the articles migration and API rely on
-- (roles, storage.buckets, public.users). Used only by tests/support/articles-stack.sh.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login noinherit;
grant anon, authenticated, service_role to authenticator;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]);

create table public.users (id uuid primary key, email text not null, role text not null default 'student');
grant all on public.users to anon, authenticated, service_role;
