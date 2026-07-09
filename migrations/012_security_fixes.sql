-- Migration 012: Security fixes
-- Run this as the `service_role` or use the Supabase CLI linked project.

BEGIN;

-- 1) Set search_path for security-sensitive functions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'meu_role'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'ALTER FUNCTION public.meu_role() SET search_path = ''public, pg_temp''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'meu_catequista_id'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'ALTER FUNCTION public.meu_catequista_id() SET search_path = ''public, pg_temp''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'contar_faltas_mes'
      AND pg_get_function_identity_arguments(p.oid) = 'p_paroquia_id uuid, p_inicio_mes timestamp with time zone, p_max_faltas integer'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.contar_faltas_mes(uuid, timestamptz, integer) SET search_path = ''public, pg_temp''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'is_superadmin'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'ALTER FUNCTION public.is_superadmin() SET search_path = ''public, pg_temp''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'update_timestamp'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'ALTER FUNCTION public.update_timestamp() SET search_path = ''public, pg_temp''';
  END IF;
END$$;

-- 2) Move pg_net extension out of public if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
    EXECUTE 'ALTER EXTENSION pg_net SET SCHEMA extensions';
  END IF;
END$$;

-- 3) Recreate views without SECURITY DEFINER
DO $$
DECLARE
  v RECORD;
  def TEXT;
BEGIN
  FOR v IN
    SELECT viewname
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname IN ('v_aniversariantes_mes', 'v_linha_tempo_catequizando')
  LOOP
    SELECT pg_get_viewdef(format('public.%I', v.viewname)::regclass, true) INTO def;
    IF def IS NOT NULL THEN
      EXECUTE format('CREATE OR REPLACE VIEW public.%I AS %s', v.viewname, def);
    END IF;
  END LOOP;
END$$;

-- 4) Refactor RLS policies to use select wrapped auth/current_setting calls
DO $$
DECLARE
  p RECORD;
  new_qual TEXT;
  new_check TEXT;
  role_clause TEXT;
  create_sql TEXT;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND (qual ~ 'auth\\\.' OR qual ~ 'current_setting\\\('))
        OR (with_check IS NOT NULL AND (with_check ~ 'auth\\\.' OR with_check ~ 'current_setting\\\('))
      )
  LOOP
    new_qual := p.qual;
    new_check := p.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, 'auth\\.([a-zA-Z0-9_]+)\\s*\\(\\s*\\)', '(select auth.\1())', 'g');
      new_qual := regexp_replace(new_qual, 'current_setting\\(([^)]+)\\)', '(select current_setting(\1))', 'g');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(new_check, 'auth\\.([a-zA-Z0-9_]+)\\s*\\(\\s*\\)', '(select auth.\1())', 'g');
      new_check := regexp_replace(new_check, 'current_setting\\(([^)]+)\\)', '(select current_setting(\1))', 'g');
    END IF;

    IF p.roles IS NULL OR array_length(p.roles, 1) = 0 THEN
      role_clause := '';
    ELSE
      role_clause := ' TO ' || array_to_string(p.roles, ',');
    END IF;

    create_sql := 'CREATE POLICY ' || quote_ident(p.policyname)
      || ' ON ' || quote_ident(p.schemaname) || '.' || quote_ident(p.tablename)
      || ' FOR ' || upper(p.cmd) || role_clause;

    IF new_qual IS NOT NULL AND new_qual <> '' THEN
      create_sql := create_sql || ' USING (' || new_qual || ')';
    END IF;
    IF new_check IS NOT NULL AND new_check <> '' THEN
      create_sql := create_sql || ' WITH CHECK (' || new_check || ')';
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    EXECUTE create_sql;
  END LOOP;
END$$;

COMMIT;
