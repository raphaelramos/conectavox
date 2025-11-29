create extension if not exists "pg_net";
create extension if not exists "supabase_vault";

-- Create a function to handle processing OAuth user avatars by calling the edge function
create or replace function public.handle_oauth_avatar()
returns trigger as $$
declare
  avatar_url text;
  edge_function_url text;
  supabase_url text;
  service_role_key text;
  payload jsonb;
  request_id bigint;
begin
  -- Check if the new user has an avatar_url in user_metadata
  avatar_url := new.raw_user_meta_data->>'avatar_url';
  
  -- Log entry for debugging
  RAISE LOG 'handle_oauth_avatar triggered for user %', new.id;

  -- If avatar_url exists, call the edge function for processing
  if avatar_url is not null and avatar_url != '' then
    -- Get settings from vault using the secret names
    supabase_url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL');
    service_role_key := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_PRIVATE_KEY');
    
    -- Validate secrets
    IF supabase_url IS NULL OR service_role_key IS NULL THEN
        RAISE WARNING 'Supabase URL or Private Key not found in Vault. Please set SUPABASE_URL and SUPABASE_PRIVATE_KEY secrets using vault.create_secret().';
        RETURN new;
    END IF;
    
    -- Construct the URL to the edge function
    edge_function_url := rtrim(supabase_url, '/') || '/functions/v1/process-avatar';
    
    RAISE LOG 'Calling edge function at %', edge_function_url;

    -- Prepare the payload for the edge function
    payload := jsonb_build_object(
      'userId', new.id,
      'avatarUrl', avatar_url
    );

    -- Call the edge function using the correct function signature with service role key in headers
    SELECT net.http_post(
      url => edge_function_url::text,
      body => payload::jsonb,
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      )::jsonb
    ) INTO request_id;
    
    RAISE LOG 'Edge function called, request_id: %', request_id;
    
  else
    RAISE LOG 'No avatar_url found for user %', new.id;
  end if;

  return new;
exception
  when others then
    -- Log error but continue processing to avoid transaction abortion
    RAISE WARNING 'Error in handle_oauth_avatar: %', SQLERRM;
    return new;
end
$$ language plpgsql security definer set search_path = public;

-- trigger to ensure it works with the updated function
create trigger on_oauth_user_created_process_avatar
  after insert on auth.users
  for each row
  when (new.raw_user_meta_data->>'avatar_url' is not null)
  execute function public.handle_oauth_avatar();
