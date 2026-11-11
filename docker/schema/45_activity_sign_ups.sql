-- Activity sign-ups and tickets
-- Depends on: 10_users (users), 20_activities (activities), 40_shop (orders)

-- ===== TYPES =====

CREATE TYPE neiist.activity_ticket_record AS (
  event_id TEXT,
  event_title TEXT,
  event_description TEXT,
  event_location TEXT[],
  event_start TIMESTAMPTZ,
  event_end TIMESTAMPTZ,
  event_all_day BOOLEAN,
  event_custom_icon TEXT,
  ticket_code TEXT,
  qr_signature TEXT,
  order_number TEXT,
  is_paid BOOLEAN,
  form_responses JSONB,
  checked_in_at TIMESTAMPTZ,
  checked_in_by VARCHAR(10),
  checked_in_by_name TEXT,
  signed_up_at TIMESTAMPTZ,
  attendee_istid VARCHAR(10),
  attendee_name TEXT
);

CREATE TYPE neiist.activity_checkin_result AS (
  ticket_input TEXT,
  success BOOLEAN,
  already_checked_in BOOLEAN,
  error TEXT,
  attendee_name TEXT,
  attendee_istid VARCHAR(10),
  ticket_code TEXT,
  order_number TEXT,
  form_responses JSONB,
  checked_in_at TIMESTAMPTZ,
  checked_in_by VARCHAR(10),
  checked_in_by_name TEXT
);

-- ===== TABLES =====

-- EVENT SUBSCRIPTIONS / TICKETS
CREATE TABLE neiist.activities_sign_up (
  event_id TEXT NOT NULL REFERENCES neiist.activities(id) ON DELETE CASCADE,
  user_istid VARCHAR(10) NOT NULL REFERENCES neiist.users(istid),
  order_number TEXT REFERENCES neiist.orders(order_number) ON UPDATE CASCADE ON DELETE SET NULL,
  ticket_code TEXT UNIQUE,
  qr_signature TEXT,
  form_responses JSONB DEFAULT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NULL,
  checked_in_by VARCHAR(10) REFERENCES neiist.users(istid) ON DELETE SET NULL,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_istid)
);

-- ===== INDEXES =====

CREATE INDEX idx_activities_sign_up_order_number ON neiist.activities_sign_up(order_number);

CREATE INDEX idx_activities_sign_up_ticket_code ON neiist.activities_sign_up(ticket_code);

-- ===== FUNCTIONS =====

-- Sign Up User to Activity
CREATE OR REPLACE FUNCTION neiist.sign_up_to_activity(
  p_event_id TEXT,
  p_user_istid VARCHAR(10),
  p_order_number TEXT DEFAULT NULL,
  p_form_responses JSONB DEFAULT NULL,
  p_qr_signature TEXT DEFAULT NULL
)
RETURNS TABLE (
  ticket_code TEXT,
  qr_signature TEXT
) AS $$
DECLARE
  v_signup_enabled BOOLEAN;
  v_signup_deadline TIMESTAMPTZ;
  v_max_attendees INTEGER;
  v_end TIMESTAMPTZ;
  v_current_count INTEGER;
  v_existing_order TEXT;
  v_ticket_code TEXT;
  v_qr_signature TEXT;
BEGIN
  SELECT signup_enabled, signup_deadline, max_attendees, "end"
  INTO v_signup_enabled, v_signup_deadline, v_max_attendees, v_end
  FROM neiist.activities
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event % does not exist', p_event_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = p_user_istid) THEN
    RAISE EXCEPTION 'User % does not exist', p_user_istid;
  END IF;

  SELECT es.order_number, es.ticket_code, es.qr_signature
  INTO v_existing_order, v_ticket_code, v_qr_signature
  FROM neiist.activities_sign_up es
  WHERE es.event_id = p_event_id AND es.user_istid = p_user_istid;

  IF FOUND THEN
    IF v_existing_order IS NULL AND p_order_number IS NOT NULL THEN
      UPDATE neiist.activities_sign_up
      SET order_number = p_order_number,
          form_responses = COALESCE(p_form_responses, form_responses)
      WHERE event_id = p_event_id AND user_istid = p_user_istid;
      RETURN QUERY SELECT v_ticket_code, v_qr_signature;
      RETURN;
    ELSIF v_existing_order = p_order_number OR (v_existing_order IS NULL AND p_order_number IS NULL) THEN
      RETURN QUERY SELECT v_ticket_code, v_qr_signature;
      RETURN;
    ELSE
      RAISE EXCEPTION 'User % is already registered for event % under order %',
        p_user_istid, p_event_id, v_existing_order;
    END IF;
  END IF;

  IF p_order_number IS NULL THEN
    IF NOT COALESCE(v_signup_enabled, FALSE) THEN
      RAISE EXCEPTION 'Sign-ups are not enabled for event %', p_event_id;
    END IF;

    IF v_signup_deadline IS NOT NULL AND NOW() > v_signup_deadline THEN
      RAISE EXCEPTION 'Sign-up deadline has passed for event %', p_event_id;
    END IF;

    IF v_end IS NOT NULL AND NOW() > v_end THEN
      RAISE EXCEPTION 'Cannot sign up for past event %', p_event_id;
    END IF;
  END IF;

  IF v_max_attendees IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_count
    FROM neiist.activities_sign_up
    WHERE event_id = p_event_id;

    IF v_current_count >= v_max_attendees THEN
      RAISE EXCEPTION 'Event capacity reached (%/%)', v_current_count, v_max_attendees;
    END IF;
  END IF;

  LOOP
    v_ticket_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM neiist.activities_sign_up WHERE ticket_code = v_ticket_code);
  END LOOP;
  v_qr_signature := COALESCE(p_qr_signature, MD5(p_event_id || ':' || p_user_istid || ':' || v_ticket_code || ':' || CLOCK_TIMESTAMP()::TEXT));

  INSERT INTO neiist.activities_sign_up (
    event_id, user_istid, order_number, ticket_code, qr_signature,
    form_responses, signed_up_at
  ) VALUES (
    p_event_id, p_user_istid, p_order_number, v_ticket_code, v_qr_signature,
    p_form_responses, NOW()
  );

  RETURN QUERY SELECT v_ticket_code, v_qr_signature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove Sign Up User from Activity
CREATE OR REPLACE FUNCTION neiist.remove_sign_up_from_activity(
  p_event_id TEXT,
  p_user_istid VARCHAR(10)
) RETURNS VOID AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  SELECT order_number INTO v_order_number
  FROM neiist.activities_sign_up
  WHERE event_id = p_event_id AND user_istid = p_user_istid;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_order_number IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot cancel paid ticket (order %) through public unregister. Contact NEIIST coordination.', v_order_number;
  END IF;

  DELETE FROM neiist.activities_sign_up
  WHERE event_id = p_event_id AND user_istid = p_user_istid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check in User(s) for Activities
CREATE OR REPLACE FUNCTION neiist.check_in_activity(
  p_activity_id TEXT,
  p_tickets TEXT[],
  p_check_in BOOLEAN DEFAULT TRUE,
  p_staff_istid VARCHAR(10) DEFAULT NULL
) RETURNS SETOF neiist.activity_checkin_result AS $$
DECLARE
  v_ticket_input TEXT;
  v_rec RECORD;
  v_res neiist.activity_checkin_result;
  v_staff_name TEXT;
BEGIN
  IF p_staff_istid IS NOT NULL THEN
    SELECT name INTO v_staff_name FROM neiist.users WHERE istid = p_staff_istid;
  END IF;

  FOREACH v_ticket_input IN ARRAY p_tickets LOOP
    v_res.ticket_input := v_ticket_input;
    v_res.success := FALSE;
    v_res.already_checked_in := FALSE;
    v_res.error := NULL;
    v_res.attendee_name := NULL;
    v_res.attendee_istid := NULL;
    v_res.ticket_code := NULL;
    v_res.order_number := NULL;
    v_res.form_responses := NULL;
    v_res.checked_in_at := NULL;
    v_res.checked_in_by := NULL;
    v_res.checked_in_by_name := NULL;

    SELECT es.*, u.name INTO v_rec
    FROM neiist.activities_sign_up es
    JOIN neiist.users u ON es.user_istid = u.istid
    WHERE es.event_id = p_activity_id
      AND (LOWER(es.ticket_code) = LOWER(BTRIM(v_ticket_input)) OR LOWER(es.user_istid) = LOWER(BTRIM(v_ticket_input)));

    IF NOT FOUND THEN
      v_res.error := 'Ticket ' || v_ticket_input || ' not found for event ' || p_activity_id;
      RETURN NEXT v_res;
      CONTINUE;
    END IF;

    v_res.attendee_name := v_rec.name;
    v_res.attendee_istid := v_rec.user_istid;
    v_res.ticket_code := v_rec.ticket_code;
    v_res.order_number := v_rec.order_number;
    v_res.form_responses := v_rec.form_responses;

    IF p_check_in THEN
      IF v_rec.checked_in_at IS NOT NULL THEN
        v_res.already_checked_in := TRUE;
        v_res.checked_in_at := v_rec.checked_in_at;
        v_res.checked_in_by := v_rec.checked_in_by;
        SELECT name INTO v_res.checked_in_by_name FROM neiist.users WHERE istid = v_rec.checked_in_by;
        RETURN NEXT v_res;
        CONTINUE;
      END IF;

      UPDATE neiist.activities_sign_up asu
      SET checked_in_at = NOW(),
          checked_in_by = p_staff_istid
      WHERE asu.event_id = p_activity_id AND (asu.ticket_code = v_rec.ticket_code OR asu.user_istid = v_rec.user_istid)
      RETURNING asu.checked_in_at, asu.checked_in_by INTO v_res.checked_in_at, v_res.checked_in_by;

      v_res.success := TRUE;
      v_res.checked_in_by_name := v_staff_name;
      RETURN NEXT v_res;
    ELSE
      -- Unmark attendance
      UPDATE neiist.activities_sign_up asu
      SET checked_in_at = NULL,
          checked_in_by = NULL
      WHERE asu.event_id = p_activity_id AND (asu.ticket_code = v_rec.ticket_code OR asu.user_istid = v_rec.user_istid);

      v_res.success := TRUE;
      v_res.checked_in_at := NULL;
      v_res.checked_in_by := NULL;
      v_res.checked_in_by_name := NULL;
      RETURN NEXT v_res;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Activity Tickers by User or All
CREATE OR REPLACE FUNCTION neiist.get_activity_tickets(
  p_activity_id TEXT DEFAULT NULL,
  p_user_istid VARCHAR(10) DEFAULT NULL,
  p_ticket_code TEXT DEFAULT NULL
) RETURNS SETOF neiist.activity_ticket_record AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS event_id,
    a.title AS event_title,
    a.description AS event_description,
    a.location AS event_location,
    a.start AS event_start,
    a."end" AS event_end,
    a.all_day AS event_all_day,
    a.custom_icon AS event_custom_icon,
    es.ticket_code,
    es.qr_signature,
    es.order_number,
    (es.order_number IS NOT NULL) AS is_paid,
    es.form_responses,
    es.checked_in_at,
    es.checked_in_by,
    staff.name AS checked_in_by_name,
    es.signed_up_at,
    u.istid AS attendee_istid,
    u.name AS attendee_name
  FROM neiist.activities_sign_up es
  JOIN neiist.activities a ON es.event_id = a.id
  JOIN neiist.users u ON es.user_istid = u.istid
  LEFT JOIN neiist.users staff ON es.checked_in_by = staff.istid
  WHERE (p_activity_id IS NULL OR es.event_id = p_activity_id)
    AND (p_user_istid IS NULL OR es.user_istid = p_user_istid)
    AND (p_ticket_code IS NULL OR es.ticket_code = p_ticket_code)
  ORDER BY a.start DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all Attendees for an Activity
CREATE OR REPLACE FUNCTION neiist.get_activity_roster(p_activity_id TEXT)
RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  signed_up_at TIMESTAMPTZ,
  ticket_code TEXT,
  qr_signature TEXT,
  order_number TEXT,
  form_responses JSONB,
  checked_in_at TIMESTAMPTZ,
  checked_in_by VARCHAR(10),
  checked_in_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.istid,
    u.name,
    COALESCE(
      CASE WHEN uc.is_preferred = TRUE AND uc.contact_type = 'alt_email' THEN uc.contact_value ELSE u.email END,
      u.email
    ) AS email,
    es.signed_up_at,
    es.ticket_code,
    es.qr_signature,
    es.order_number,
    es.form_responses,
    es.checked_in_at,
    es.checked_in_by,
    staff.name AS checked_in_by_name
  FROM neiist.activities_sign_up es
  JOIN neiist.users u ON es.user_istid = u.istid
  LEFT JOIN neiist.user_contacts uc ON u.istid = uc.user_istid AND uc.contact_type = 'alt_email' AND uc.is_preferred = TRUE
  LEFT JOIN neiist.orders o ON es.order_number = o.order_number
  LEFT JOIN neiist.users staff ON es.checked_in_by = staff.istid
  WHERE es.event_id = p_activity_id
  ORDER BY es.checked_in_at DESC NULLS LAST, es.signed_up_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
