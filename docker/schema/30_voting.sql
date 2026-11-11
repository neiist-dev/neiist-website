-- Voting domain
-- Depends on: 10_users (users), 20_activities (activities)

-- ===== TABLES =====

-- VOTING SESSIONS
CREATE TABLE neiist.voting_sessions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('activity', 'users', 'custom')),
  activity_id TEXT REFERENCES neiist.activities(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'voting', 'finished')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  show_results BOOLEAN NOT NULL DEFAULT false,
  max_choices INTEGER NOT NULL DEFAULT 1 CHECK (max_choices BETWEEN 1 AND 5)
);

-- VOTING NOMINEES
CREATE TABLE neiist.voting_nominees (
  session_id INTEGER NOT NULL REFERENCES neiist.voting_sessions(id) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL,
  PRIMARY KEY (session_id, nominee_id)
);

-- VOTING CUSTOM OPTIONS
CREATE TABLE neiist.voting_custom_options (
  session_id INTEGER NOT NULL REFERENCES neiist.voting_sessions(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_path TEXT,
  description_photo_path TEXT,
  description TEXT,
  PRIMARY KEY (session_id, id)
);

-- CAST VOTES
CREATE TABLE neiist.votes (
  session_id INTEGER NOT NULL REFERENCES neiist.voting_sessions(id) ON DELETE CASCADE,
  voter_istid VARCHAR(10) NOT NULL REFERENCES neiist.users(istid) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, voter_istid, nominee_id)
);

-- VOTE RESULTS
CREATE TABLE neiist.voting_results (
  session_id INTEGER NOT NULL REFERENCES neiist.voting_sessions(id) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL,
  vote_count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, nominee_id),
  FOREIGN KEY (session_id, nominee_id) REFERENCES neiist.voting_nominees(session_id, nominee_id) ON DELETE CASCADE
);

-- ===== VIEWS =====

-- Helper view for session data with total votes
CREATE OR REPLACE VIEW neiist.voting_sessions_with_total_votes AS
SELECT
  s.id,
  s.name,
  s.description,
  s.type,
  s.activity_id,
  s.status,
  s.start_at,
  s.end_at,
  s.created_at,
  s.updated_at,
  (SELECT COUNT(DISTINCT voter_istid) FROM neiist.votes WHERE session_id = s.id)::BIGINT AS total_votes,
  s.show_results,
  s.max_choices
FROM neiist.voting_sessions s;

-- ===== TRIGGERS =====

--Triggers

-- Trigger to touch updated_at on session when a vote is cast and notify listeners
CREATE OR REPLACE FUNCTION neiist.touch_voting_session_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  UPDATE neiist.voting_sessions
  SET updated_at = v_now
  WHERE id = NEW.session_id;

  -- Broadcast to the 'voting_update' channel
  PERFORM pg_notify('voting_update', json_build_object(
    'type', 'VOTE',
    'updated_at', v_now
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_touch_voting_session
AFTER INSERT OR UPDATE ON neiist.votes
FOR EACH ROW
EXECUTE FUNCTION neiist.touch_voting_session_updated_at();

-- Trigger to notify on voting session changes
CREATE OR REPLACE FUNCTION neiist.notify_voting_session_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('voting_update', json_build_object(
    'type', 'STATE_CHANGE',
    'updated_at', NOW()
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_voting_session_change
AFTER INSERT OR UPDATE OF status, start_at, end_at, name, description, show_results ON neiist.voting_sessions
FOR EACH ROW
EXECUTE FUNCTION neiist.notify_voting_session_change();

-- ===== FUNCTIONS =====

-- Wrapper for LISTEN
CREATE OR REPLACE FUNCTION neiist.listen_voting_updates()
RETURNS VOID AS $$
BEGIN
  EXECUTE 'LISTEN voting_update';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET VOTING SESSIONS
CREATE OR REPLACE FUNCTION neiist.get_voting_sessions(p_limit INTEGER)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  type VARCHAR(20),
  activity_id TEXT,
  status TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_votes BIGINT,
  show_results BOOLEAN,
  max_choices INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.description,
    v.type,
    v.activity_id,
    v.status,
    v.start_at,
    v.end_at,
    v.created_at,
    v.updated_at,
    v.total_votes,
    v.show_results,
    v.max_choices
  FROM neiist.voting_sessions_with_total_votes v
  ORDER BY v.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET VOTING SESSION BY ID
CREATE OR REPLACE FUNCTION neiist.get_voting_session_by_id(p_session_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  type VARCHAR(20),
  activity_id TEXT,
  status TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_votes BIGINT,
  show_results BOOLEAN,
  max_choices INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.description,
    v.type,
    v.activity_id,
    v.status,
    v.start_at,
    v.end_at,
    v.created_at,
    v.updated_at,
    v.total_votes,
    v.show_results,
    v.max_choices
  FROM neiist.voting_sessions_with_total_votes v
  WHERE v.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ADD VOTING SESSION
CREATE OR REPLACE FUNCTION neiist.create_voting_session(
  p_name TEXT,
  p_description TEXT,
  p_type VARCHAR(20),
  p_nominees JSONB,
  p_activity_id TEXT DEFAULT NULL,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL,
  p_max_choices INTEGER DEFAULT 1
) RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  type VARCHAR(20),
  activity_id TEXT,
  status TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_votes BIGINT,
  show_results BOOLEAN,
  max_choices INTEGER
) AS $$
DECLARE
  v_session_id INTEGER;
  elem JSONB;
BEGIN
  IF p_max_choices < 1 OR p_max_choices > 5 THEN
    RAISE EXCEPTION 'max_choices must be between 1 and 5';
  END IF;

  INSERT INTO neiist.voting_sessions (name, description, type, activity_id, start_at, end_at, max_choices)
  VALUES (p_name, p_description, p_type, p_activity_id, p_start_at, p_end_at, COALESCE(p_max_choices, 1))
  RETURNING neiist.voting_sessions.id INTO v_session_id;

  IF p_nominees IS NOT NULL AND jsonb_typeof(p_nominees) = 'array' THEN
    FOR elem IN SELECT * FROM jsonb_array_elements(p_nominees)
    LOOP
      IF jsonb_typeof(elem) = 'object' THEN
        INSERT INTO neiist.voting_custom_options (session_id, id, name, photo_path, description_photo_path, description)
        VALUES (
          v_session_id,
          elem->>'id',
          elem->>'name',
          elem->>'photo_path',
          COALESCE(elem->>'description_photo_path', elem->>'photo_path'),
          elem->>'description'
        );

        INSERT INTO neiist.voting_nominees (session_id, nominee_id)
        VALUES (v_session_id, elem->>'id');
      ELSE
        INSERT INTO neiist.voting_nominees (session_id, nominee_id)
        VALUES (v_session_id, elem #>> '{}');
      END IF;
    END LOOP;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_voting_session_by_id(v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SET SESSION SHOW RESULTS
CREATE OR REPLACE FUNCTION neiist.set_session_show_results(
  p_session_id INTEGER,
  p_show_results BOOLEAN
) RETURNS VOID AS $$
BEGIN
  UPDATE neiist.voting_sessions
  SET show_results = p_show_results,
    updated_at = NOW()
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voting session % not found', p_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET SESSION NOMINEES
CREATE OR REPLACE FUNCTION neiist.get_session_nominees(p_session_id INTEGER)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  photo_path TEXT,
  description_photo_path TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vn.nominee_id as id,
    COALESCE(co.name, u.name, vn.nominee_id) as name,
    co.photo_path,
    COALESCE(co.description_photo_path, co.photo_path) as description_photo_path,
    co.description
  FROM neiist.voting_nominees vn
  LEFT JOIN neiist.users u ON u.istid = vn.nominee_id
  LEFT JOIN neiist.voting_custom_options co ON co.session_id = vn.session_id AND co.id = vn.nominee_id
  WHERE vn.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- START VOTING
CREATE OR REPLACE FUNCTION neiist.start_voting(p_session_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE neiist.voting_sessions
  SET status = 'voting',
    start_at = COALESCE(start_at, NOW())
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SUBMIT VOTES
CREATE OR REPLACE FUNCTION neiist.submit_votes(
  p_session_id INTEGER,
  p_voter_istid VARCHAR(10),
  p_nominee_ids TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_session neiist.voting_sessions%ROWTYPE;
  v_unique_nominees TEXT[];
  v_nominee_count INTEGER;
  v_valid_count INTEGER;
  v_id TEXT;
BEGIN
  SELECT * INTO v_session FROM neiist.voting_sessions WHERE id = p_session_id;

  IF NOT FOUND OR v_session.status <> 'voting' THEN
    RAISE EXCEPTION 'Voting is not active for this session';
  END IF;

  IF v_session.start_at IS NOT NULL AND NOW() < v_session.start_at THEN
    RAISE EXCEPTION 'A votação ainda não começou';
  END IF;

  IF v_session.end_at IS NOT NULL AND NOW() > v_session.end_at THEN
    RAISE EXCEPTION 'A votação já terminou';
  END IF;

  IF p_nominee_ids IS NULL OR array_length(p_nominee_ids, 1) IS NULL OR array_length(p_nominee_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No nominees selected';
  END IF;

  -- Deduplicate nominee IDs
  SELECT ARRAY(SELECT DISTINCT unnest(p_nominee_ids)) INTO v_unique_nominees;
  v_nominee_count := array_length(v_unique_nominees, 1);

  IF v_nominee_count > v_session.max_choices THEN
    RAISE EXCEPTION 'Cannot select more than % options (selected %)', v_session.max_choices, v_nominee_count;
  END IF;

  -- Validate each nominee exists for this session
  SELECT COUNT(*) INTO v_valid_count
  FROM neiist.voting_nominees
  WHERE session_id = p_session_id AND nominee_id = ANY(v_unique_nominees);

  IF v_valid_count <> v_nominee_count THEN
    RAISE EXCEPTION 'One or more selected nominees are invalid for this session';
  END IF;

  -- Atomically replace prior votes for this voter in this session
  DELETE FROM neiist.votes
  WHERE session_id = p_session_id AND voter_istid = p_voter_istid;

  -- Insert new votes
  FOREACH v_id IN ARRAY v_unique_nominees
  LOOP
    INSERT INTO neiist.votes (session_id, voter_istid, nominee_id, voted_at)
    VALUES (p_session_id, p_voter_istid, v_id, NOW());
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FINISH VOTING
CREATE OR REPLACE FUNCTION neiist.finish_voting(p_session_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE neiist.voting_sessions
  SET status = 'finished',
    end_at = COALESCE(end_at, NOW())
  WHERE id = p_session_id;

  -- Clear any existing results for this session
  DELETE FROM neiist.voting_results WHERE session_id = p_session_id;

  -- Frozen tally
  INSERT INTO neiist.voting_results (session_id, nominee_id, vote_count)
  SELECT 
    p_session_id,
    vn.nominee_id,
    COUNT(v.voter_istid)
  FROM neiist.voting_nominees vn
  LEFT JOIN neiist.votes v ON v.session_id = vn.session_id AND v.nominee_id = vn.nominee_id
  WHERE vn.session_id = p_session_id
  GROUP BY vn.nominee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET SESSION RESULTS
CREATE OR REPLACE FUNCTION neiist.get_session_results(p_session_id INTEGER)
RETURNS TABLE (
  nominee_id TEXT,
  nominee_name TEXT,
  nominee_photo_path TEXT,
  vote_count BIGINT,
  description TEXT
) AS $$
BEGIN
  -- If session is finished, return frozen tally
  IF EXISTS (SELECT 1 FROM neiist.voting_sessions WHERE neiist.voting_sessions.id = p_session_id AND status = 'finished') THEN
    RETURN QUERY
    SELECT 
      vr.nominee_id,
      COALESCE(co.name, u.name, vr.nominee_id) as nominee_name,
      co.photo_path as nominee_photo_path,
      vr.vote_count,
      co.description
    FROM neiist.voting_results vr
    LEFT JOIN neiist.voting_custom_options co ON co.session_id = vr.session_id AND co.id = vr.nominee_id
    LEFT JOIN neiist.users u ON u.istid = vr.nominee_id
    WHERE vr.session_id = p_session_id
    ORDER BY vr.vote_count DESC;
  ELSE
    -- Live tally
    RETURN QUERY
    SELECT 
      vn.nominee_id,
      COALESCE(co.name, u.name, vn.nominee_id) as nominee_name,
      co.photo_path as nominee_photo_path,
      COUNT(v.voter_istid)::BIGINT as vote_count,
      co.description
    FROM neiist.voting_nominees vn
    LEFT JOIN neiist.voting_custom_options co ON co.session_id = vn.session_id AND co.id = vn.nominee_id
    LEFT JOIN neiist.users u ON u.istid = vn.nominee_id
    LEFT JOIN neiist.votes v ON v.session_id = vn.session_id AND v.nominee_id = vn.nominee_id
    WHERE vn.session_id = p_session_id
    GROUP BY vn.nominee_id, co.name, co.photo_path, co.description, u.name
    ORDER BY COUNT(v.voter_istid) DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET USER VOTES
CREATE OR REPLACE FUNCTION neiist.get_user_votes(p_session_id INTEGER, p_voter_istid VARCHAR(10))
RETURNS TABLE (nominee_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT v.nominee_id
  FROM neiist.votes v
  WHERE v.session_id = p_session_id AND v.voter_istid = p_voter_istid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET SESSION VOTES LOG
CREATE OR REPLACE FUNCTION neiist.get_session_votes_log(p_session_id INTEGER)
RETURNS TABLE (
  voted_at TIMESTAMPTZ,
  nominee_id TEXT,
  nominee_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.voted_at,
    v.nominee_id,
    COALESCE(co.name, u.name, v.nominee_id) AS nominee_name
  FROM neiist.votes v
  LEFT JOIN neiist.voting_custom_options co ON co.session_id = v.session_id AND co.id = v.nominee_id
  LEFT JOIN neiist.users u ON u.istid = v.nominee_id
  WHERE v.session_id = p_session_id
  ORDER BY v.voted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DELETE VOTING SESSION
CREATE OR REPLACE FUNCTION neiist.delete_voting_session(p_session_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.voting_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voting session % not found', p_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
