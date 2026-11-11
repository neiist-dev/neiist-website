-- Activities domain
-- Depends on: 10_users (users)

-- ===== TYPES =====

CREATE TYPE neiist.activity_record AS (
  id TEXT,
  title TEXT,
  description TEXT,
  url TEXT,
  location TEXT[],
  type TEXT,
  teams TEXT[],
  attendees TEXT[],
  start TIMESTAMPTZ,
  "end" TIMESTAMPTZ,
  all_day BOOLEAN,
  last_edited_time TIMESTAMPTZ,
  signup_enabled BOOLEAN,
  signup_deadline TIMESTAMPTZ,
  max_attendees INTEGER,
  custom_icon TEXT,
  public BOOLEAN,
  source_type TEXT,
  signup_fields JSONB,
  event_ticket_product_id INTEGER,
  event_ticket_price NUMERIC(10,2),
  subscribers VARCHAR(10)[],
  subscriber_count BIGINT
);

-- ===== TABLES =====

-- ACTIVITIES EVENTS TABLE
CREATE TABLE neiist.activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  location TEXT[],
  type TEXT,
  teams TEXT[],
  attendees TEXT[],
  start TIMESTAMPTZ,
  "end" TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  last_edited_time TIMESTAMPTZ NOT NULL,
  signup_enabled BOOLEAN DEFAULT FALSE,
  signup_deadline TIMESTAMPTZ,
  max_attendees INTEGER,
  custom_icon TEXT,
  public BOOLEAN NOT NULL DEFAULT TRUE,
  source_type TEXT NOT NULL DEFAULT 'notion',
  signup_fields JSONB DEFAULT NULL,
  created_by VARCHAR(10) REFERENCES neiist.users(istid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== FUNCTIONS =====

-- GET ACTIVITIES OR ACTIVITY BY ID OR PUBLIC
CREATE OR REPLACE FUNCTION neiist.get_activities(
  p_id TEXT DEFAULT NULL,
  p_public_only BOOLEAN DEFAULT FALSE
) RETURNS SETOF neiist.activity_record AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.url,
    e.location,
    e.type,
    e.teams,
    e.attendees,
    e.start,
    e."end",
    e.all_day,
    e.last_edited_time,
    e.signup_enabled,
    e.signup_deadline,
    e.max_attendees,
    e.custom_icon,
    e.public,
    e.source_type,
    e.signup_fields,
    tp.ticket_product_id,
    tp.ticket_price,
    COALESCE(
      ARRAY_AGG(es.user_istid ORDER BY es.signed_up_at) FILTER (WHERE es.user_istid IS NOT NULL),
      ARRAY[]::VARCHAR(10)[]
    )::VARCHAR(10)[] AS subscribers,
    COUNT(es.user_istid) AS subscriber_count
  FROM neiist.activities e
  LEFT JOIN neiist.activities_sign_up es ON e.id = es.event_id
  LEFT JOIN LATERAL (
    SELECT p.id AS ticket_product_id, p.price AS ticket_price
    FROM neiist.products p
    WHERE p.event_id = e.id AND p.product_type = 'event_ticket' AND p.active = TRUE
    ORDER BY p.id
    LIMIT 1
  ) tp ON TRUE
  WHERE (p_id IS NOT NULL AND e.id = p_id)
    OR (p_id IS NULL AND e.start IS NOT NULL AND (NOT p_public_only OR e.public = TRUE))
  GROUP BY e.id, e.title, e.description, e.url, e.location, e.type,
    e.teams, e.attendees, e.start, e."end", e.all_day, e.last_edited_time,
    e.signup_enabled, e.signup_deadline, e.max_attendees, e.custom_icon,
    e.public, e.source_type, e.signup_fields, tp.ticket_product_id, tp.ticket_price
  ORDER BY e.start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Activity
CREATE OR REPLACE FUNCTION neiist.create_activity(
  p_data JSONB
) RETURNS TEXT AS $$
DECLARE
  v_id TEXT;
  v_location TEXT[];
  v_teams TEXT[];
  v_attendees TEXT[];
  v_source TEXT;
BEGIN
  v_id := COALESCE(NULLIF(p_data->>'id', ''), gen_random_uuid()::TEXT);

  IF p_data ? 'location' AND jsonb_typeof(p_data->'location') = 'array' THEN
    SELECT COALESCE(array_agg(elem::TEXT), '{}') INTO v_location FROM jsonb_array_elements_text(p_data->'location') AS elem;
  END IF;

  IF p_data ? 'teams' AND jsonb_typeof(p_data->'teams') = 'array' THEN
    SELECT COALESCE(array_agg(elem::TEXT), '{}') INTO v_teams FROM jsonb_array_elements_text(p_data->'teams') AS elem;
  END IF;

  IF p_data ? 'attendees' AND jsonb_typeof(p_data->'attendees') = 'array' THEN
    SELECT COALESCE(array_agg(elem::TEXT), '{}') INTO v_attendees FROM jsonb_array_elements_text(p_data->'attendees') AS elem;
  END IF;

  v_source := COALESCE(p_data->>'source_type', 'website');

  INSERT INTO neiist.activities (
    id, title, description, url, location, type, teams, attendees,
    start, "end", all_day, last_edited_time, signup_enabled,
    signup_deadline, max_attendees, custom_icon, public, source_type,
    signup_fields, created_by, created_at, updated_at
  ) VALUES (
    v_id,
    COALESCE(p_data->>'title', ''),
    NULLIF(p_data->>'description', ''),
    NULLIF(p_data->>'url', ''),
    COALESCE(v_location, ARRAY[]::TEXT[]),
    COALESCE(p_data->>'type', 'Outros'),
    COALESCE(v_teams, ARRAY[]::TEXT[]),
    COALESCE(v_attendees, ARRAY[]::TEXT[]),
    NULLIF(p_data->>'start', '')::TIMESTAMPTZ,
    NULLIF(p_data->>'end', '')::TIMESTAMPTZ,
    COALESCE((p_data->>'all_day')::BOOLEAN, FALSE),
    COALESCE(NULLIF(p_data->>'last_edited_time', '')::TIMESTAMPTZ, NOW()),
    COALESCE((p_data->>'signup_enabled')::BOOLEAN, FALSE),
    NULLIF(p_data->>'signup_deadline', '')::TIMESTAMPTZ,
    NULLIF(p_data->>'max_attendees', '')::INTEGER,
    NULLIF(p_data->>'custom_icon', ''),
    COALESCE((p_data->>'public')::BOOLEAN, TRUE),
    v_source,
    p_data->'signup_fields',
    NULLIF(p_data->>'created_by', ''),
    NOW(),
    NOW()
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Activity
CREATE OR REPLACE FUNCTION neiist.update_activity(
  p_id TEXT,
  p_data JSONB
) RETURNS TEXT AS $$
DECLARE
  v_location TEXT[];
  v_teams TEXT[];
  v_attendees TEXT[];
  v_source TEXT;
BEGIN
  IF p_id IS NULL OR BTRIM(p_id) = '' THEN
    RAISE EXCEPTION 'Activity ID cannot be null or empty';
  END IF;

  IF p_data ? 'location' AND jsonb_typeof(p_data->'location') = 'array' THEN
    SELECT COALESCE(array_agg(elem::TEXT), '{}') INTO v_location FROM jsonb_array_elements_text(p_data->'location') AS elem;
  END IF;

  IF p_data ? 'teams' AND jsonb_typeof(p_data->'teams') = 'array' THEN
    SELECT COALESCE(array_agg(elem::TEXT), '{}') INTO v_teams FROM jsonb_array_elements_text(p_data->'teams') AS elem;
  END IF;

  IF p_data ? 'attendees' AND jsonb_typeof(p_data->'attendees') = 'array' THEN
    SELECT COALESCE(array_agg(elem::TEXT), '{}') INTO v_attendees FROM jsonb_array_elements_text(p_data->'attendees') AS elem;
  END IF;

  v_source := COALESCE(p_data->>'source_type', 'website');

  UPDATE neiist.activities
  SET
    title = CASE WHEN p_data ? 'title' THEN p_data->>'title' ELSE title END,
    description = CASE
      WHEN p_data ? 'description' THEN
        CASE WHEN v_source = 'notion' THEN COALESCE(activities.description, NULLIF(p_data->>'description', ''))
             ELSE NULLIF(p_data->>'description', '') END
      ELSE description END,
    url = CASE WHEN p_data ? 'url' THEN NULLIF(p_data->>'url', '') ELSE url END,
    location = CASE WHEN p_data ? 'location' THEN COALESCE(v_location, ARRAY[]::TEXT[]) ELSE location END,
    type = CASE WHEN p_data ? 'type' THEN COALESCE(p_data->>'type', 'Outros') ELSE type END,
    teams = CASE WHEN p_data ? 'teams' THEN COALESCE(v_teams, ARRAY[]::TEXT[]) ELSE teams END,
    attendees = CASE WHEN p_data ? 'attendees' THEN COALESCE(v_attendees, ARRAY[]::TEXT[]) ELSE attendees END,
    start = CASE WHEN p_data ? 'start' THEN NULLIF(p_data->>'start', '')::TIMESTAMPTZ ELSE start END,
    "end" = CASE WHEN p_data ? 'end' THEN NULLIF(p_data->>'end', '')::TIMESTAMPTZ ELSE "end" END,
    all_day = CASE WHEN p_data ? 'all_day' THEN COALESCE((p_data->>'all_day')::BOOLEAN, FALSE) ELSE all_day END,
    last_edited_time = CASE WHEN p_data ? 'last_edited_time' THEN NULLIF(p_data->>'last_edited_time', '')::TIMESTAMPTZ ELSE NOW() END,
    signup_enabled = CASE
      WHEN v_source = 'notion' THEN signup_enabled
      WHEN p_data ? 'signup_enabled' THEN COALESCE((p_data->>'signup_enabled')::BOOLEAN, FALSE)
      ELSE signup_enabled END,
    signup_deadline = CASE
      WHEN v_source = 'notion' THEN signup_deadline
      WHEN p_data ? 'signup_deadline' THEN NULLIF(p_data->>'signup_deadline', '')::TIMESTAMPTZ
      ELSE signup_deadline END,
    max_attendees = CASE
      WHEN v_source = 'notion' THEN max_attendees
      WHEN p_data ? 'max_attendees' THEN NULLIF(p_data->>'max_attendees', '')::INTEGER
      ELSE max_attendees END,
    custom_icon = CASE
      WHEN v_source = 'notion' THEN custom_icon
      WHEN p_data ? 'custom_icon' THEN NULLIF(p_data->>'custom_icon', '')
      ELSE custom_icon END,
    public = CASE WHEN p_data ? 'public' THEN (p_data->>'public')::BOOLEAN ELSE public END,
    signup_fields = CASE
      WHEN v_source = 'notion' THEN signup_fields
      WHEN p_data ? 'signup_fields' THEN p_data->'signup_fields'
      ELSE signup_fields END,
    updated_at = NOW()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity % not found', p_id;
  END IF;

  RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DELETE ACTIVITY BY ID
CREATE OR REPLACE FUNCTION neiist.delete_activity(p_id TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.activities_sign_up WHERE event_id = p_id;
  DELETE FROM neiist.activities WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
