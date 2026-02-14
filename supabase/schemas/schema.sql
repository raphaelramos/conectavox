-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  qr_identifier uuid default uuid_generate_v4() unique not null,
  full_name text not null,
  avatar_url text,
  instagram text,
  tiktok text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

-- EVENTS
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  image_url text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  description text,
  created_at timestamp with time zone default now()
);

alter table public.events enable row level security;

create policy "Events are viewable by everyone."
  on events for select
  using ( true );

-- USER ROLES
create table public.user_roles (
  user_id uuid references auth.users on delete cascade not null,
  role text not null,
  created_at timestamp with time zone default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Users can view their own roles."
  on user_roles for select
  using ( (select auth.uid()) = user_id );

create policy "Admins can insert events"
  on events for insert
  with check ( exists ( select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin' ) );

create policy "Admins can update events"
  on events for update
  using ( exists ( select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin' ) );

create policy "Admins can delete events"
  on events for delete
  using ( exists ( select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin' ) );

-- USER EVENT POINTS
create table public.user_event_points (
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  points integer default 0,
  primary key (user_id, event_id)
);

alter table public.user_event_points enable row level security;

create policy "User points are viewable by everyone."
  on user_event_points for select
  using ( true );

-- ACTIVITIES (Unified Missions & Hidden Points)
create table public.activities (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  type text not null check (type in ('mission', 'hidden_point')),
  name text not null,
  description text,
  image_url text,
  points integer default 0,
  identifier uuid default uuid_generate_v4() unique not null,
  created_at timestamp with time zone default now()
);

alter table public.activities enable row level security;

create policy "Activities are viewable by everyone."
  on activities for select
  using ( true );

create policy "Admins can manage activities"
  on activities for all
  using ( exists ( select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin' ) );

-- INDEXES
create index if not exists idx_activities_event_id on public.activities(event_id);
create index if not exists idx_activities_identifier on public.activities(identifier);

-- CONNECTIONS
create table public.connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  connected_user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, connected_user_id, event_id)
);

alter table public.connections enable row level security;

create policy "Users can view their own connections."
  on connections for select
  using ( (select auth.uid()) = user_id );

-- SCANS (Log)
create table public.scans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  qrcode_identifier uuid not null,
  type text not null, -- 'mission', 'hidden_point', 'connection'
  created_at timestamp with time zone default now(),
  unique(user_id, event_id, qrcode_identifier)
);

alter table public.scans enable row level security;

create policy "Users can view their own scans."
  on scans for select
  using ( (select auth.uid()) = user_id );


-- FUNCTIONS FOR SCORING
create or replace function process_scan(
  p_event_id uuid,
  p_code text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_code_uuid uuid;
  v_activity_points int;
  v_target_user_id uuid;
  v_type text;
  v_name text;
  v_scan_inserted_count int;
begin
  -- Check authentication
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'User not authenticated');
  end if;

  -- Validate UUID format
  begin
    v_code_uuid := p_code::uuid;
  exception when others then
    return json_build_object('success', false, 'message', 'Invalid QR Code format');
  end;

  -- 1. Try Activity (Mission or Hidden Point)
  select points, type, name into v_activity_points, v_type, v_name
  from public.activities
  where identifier = v_code_uuid and event_id = p_event_id;

  if v_activity_points is not null then
    insert into public.scans (user_id, event_id, qrcode_identifier, type)
    values (v_user_id, p_event_id, v_code_uuid, v_type)
    on conflict (user_id, event_id, qrcode_identifier) do nothing;

    get diagnostics v_scan_inserted_count = row_count;
    if v_scan_inserted_count = 0 then
      return json_build_object('success', false, 'message', 'Missão já completada!');
    end if;

    -- Add Points
    insert into public.user_event_points (user_id, event_id, points)
    values (v_user_id, p_event_id, v_activity_points)
    on conflict (user_id, event_id)
    do update set points = public.user_event_points.points + excluded.points;

    return json_build_object('success', true, 'message', 'Missão completada: ' || v_name, 'points', v_activity_points);
  end if;

  -- 2. Try User Connection
  select id into v_target_user_id
  from public.profiles
  where qr_identifier = v_code_uuid or id = v_code_uuid
  limit 1;

  if v_target_user_id is not null then
    if v_target_user_id = v_user_id then
      return json_build_object('success', false, 'message', 'Você não pode escanear seu próprio QR Code!');
    end if;

    perform pg_advisory_xact_lock(hashtext(least(v_user_id::text, v_target_user_id::text) || ':' || greatest(v_user_id::text, v_target_user_id::text) || ':' || p_event_id::text));

    if exists (
      select 1
      from public.connections
      where event_id = p_event_id
        and (
          (user_id = v_user_id and connected_user_id = v_target_user_id)
          or (user_id = v_target_user_id and connected_user_id = v_user_id)
        )
    ) then
      return json_build_object('success', false, 'message', 'Vocês já estão conectados!');
    end if;

    -- Create bidirectional connection rows
    insert into public.connections (user_id, connected_user_id, event_id)
    values (v_user_id, v_target_user_id, p_event_id);

    insert into public.connections (user_id, connected_user_id, event_id)
    values (v_target_user_id, v_user_id, p_event_id);

    -- Add points for both participants
    insert into public.user_event_points (user_id, event_id, points)
    values
      (v_user_id, p_event_id, 1),
      (v_target_user_id, p_event_id, 1)
    on conflict (user_id, event_id)
    do update set points = public.user_event_points.points + excluded.points;

    return json_build_object('success', true, 'message', 'Nova conexão realizada!', 'points', 1);
  end if;

  return json_build_object('success', false, 'message', 'QR Code inválido ou não encontrado.');
end;
$$;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- STORAGE BUCKETS
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

insert into storage.buckets (id, name, public)
values ('images', 'images', true);

-- STORAGE POLICIES

-- Avatars: Public Read
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Avatars: Authenticated Upload (User folder)
create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    (select auth.uid()) = (storage.foldername(name))[1]::uuid
  );

-- Avatars: Authenticated Update (User folder)
create policy "Users can update their own avatar."
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    (select auth.uid()) = (storage.foldername(name))[1]::uuid
  );

-- Avatars: Authenticated Delete (User folder)
create policy "Users can delete their own avatar."
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    (select auth.uid()) = (storage.foldername(name))[1]::uuid
  );

-- Images: Public Read
create policy "Images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'images' );

-- Images: Admin Upload
create policy "Admins can upload images."
  on storage.objects for insert
  with check (
    bucket_id = 'images' and
    exists ( select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin' )
  );

-- Images: Admin Update
create policy "Admins can update images."
  on storage.objects for update
  using (
    bucket_id = 'images' and
    exists ( select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin' )
  );

-- Images: Admin Delete
create policy "Admins can delete images."
  on storage.objects for delete
  using (
    bucket_id = 'images' and
    exists ( select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin' )
  );

-- INDEXES
create index if not exists idx_connections_event_id on public.connections(event_id);
create index if not exists idx_connections_user_id on public.connections(user_id);
create index if not exists idx_connections_connected_user_id on public.connections(connected_user_id);
create index if not exists idx_scans_event_id on public.scans(event_id);
create index if not exists idx_scans_user_id on public.scans(user_id);
create index if not exists idx_user_event_points_event_id on public.user_event_points(event_id);
create index if not exists idx_profiles_full_name on public.profiles(full_name);
