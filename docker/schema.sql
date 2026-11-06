-- SCHEMA
CREATE SCHEMA IF NOT EXISTS neiist;

-- ROLES
CREATE ROLE neiist_app_user WITH LOGIN PASSWORD 'CHANGE_ME_TO_A_SECURE_PASSWORD';
CREATE ROLE neiist_readonly WITH LOGIN PASSWORD 'CHANGE_ME_TO_A_SECURE_PASSWORD';

-- PERMISSIONS
GRANT USAGE ON SCHEMA neiist TO neiist_app_user;
GRANT USAGE ON SCHEMA neiist TO neiist_readonly;

REVOKE ALL ON ALL TABLES IN SCHEMA neiist FROM neiist_app_user;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA neiist FROM neiist_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA neiist TO neiist_app_user;

REVOKE ALL ON ALL TABLES IN SCHEMA neiist FROM neiist_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA neiist FROM neiist_readonly;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA neiist FROM neiist_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA neiist GRANT EXECUTE ON FUNCTIONS TO neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON TABLES FROM neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON SEQUENCES FROM neiist_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON TABLES FROM neiist_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON SEQUENCES FROM neiist_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON FUNCTIONS FROM neiist_readonly;

-- ENUM TYPES
CREATE TYPE neiist.permission_enum AS ENUM (
  'users:read',
  'users:write',
  'users:delete',
  'departments:read',
  'departments:write',
  'departments:delete',
  'roles:read',
  'roles:write',
  'roles:delete',
  'memberships:read',
  'memberships:write_global',
  'memberships:write_dept',
  'memberships:delete',
  'photos:read',
  'photos:write_global',
  'photos:write_dept',
  'shop:read',
  'shop:write',
  'orders:read',
  'orders:read_customer',
  'orders:create',
  'orders:write',
  'orders:deliver',
  'orders:delete',
  'orders:override',
  'pos:access',
  'pos:manage',
  'voting:read',
  'voting:write',
  'events:read',
  'events:write',
  'events:delete',
  'events:checkin'
);

CREATE TYPE neiist.access_label_enum AS ENUM (
  'admin',
  'coordinator'
);

CREATE TYPE neiist.contact_method_enum AS ENUM (
  'email',
  'alt_email',
  'phone'
);

CREATE TYPE neiist.shop_stock_type_enum AS ENUM (
  'limited',
  'on_demand',
  'untracked'
);

CREATE TYPE neiist.shop_order_status_enum AS ENUM (
  'pending',
  'paid',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TYPE neiist.product_type_enum AS ENUM (
  'merchandise',
  'event_ticket',
  'food_drink'
);

CREATE TYPE neiist.pos_shift_status_enum AS ENUM (
  'open',
  'closed'
);

CREATE TYPE neiist.payment_status_enum AS ENUM (
  'pending',
  'successful',
  'failed',
  'refunded'
);

CREATE TYPE neiist.event_hook_enum AS ENUM (
  'default_signup'
);

CREATE TYPE neiist.sales_channel_enum AS ENUM (
  'web',
  'pos',
  'fast-pos'
);

CREATE TYPE neiist.payment_method_enum AS ENUM (
  'cash',
  'tpa',
  'card-online',
  'instant-transfer',
  'other',
  'in-person'
);

CREATE TYPE neiist.discount_type_enum AS ENUM (
  'percentage',
  'fixed'
);

-- COMPOSITE RECORD TYPES
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

CREATE TYPE neiist.product_record AS (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  stock_type neiist.shop_stock_type_enum,
  stock_quantity INTEGER,
  order_start TIMESTAMPTZ,
  order_deadline TIMESTAMPTZ,
  estimated_delivery TEXT,
  size_guide TEXT,
  active BOOLEAN,
  product_type neiist.product_type_enum,
  channels neiist.sales_channel_enum[],
  event_id TEXT,
  event_hook neiist.event_hook_enum,
  variants JSONB
);

CREATE TYPE neiist.order_record AS (
  order_number TEXT,
  customer_name TEXT,
  user_istid VARCHAR(10),
  customer_email TEXT,
  customer_phone TEXT,
  customer_nif TEXT,
  campus TEXT,
  pickup_deadline TIMESTAMPTZ,
  notes TEXT,
  discount_code TEXT,
  discount_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  order_source neiist.sales_channel_enum,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by TEXT,
  status neiist.shop_order_status_enum,
  items JSONB,
  payments JSONB
);

CREATE TYPE neiist.pos_shift_record AS (
  id UUID,
  station_id UUID,
  opened_by VARCHAR(10),
  closed_by VARCHAR(10),
  initial_float NUMERIC(10,2),
  final_cash_counted NUMERIC(10,2),
  expected_cash NUMERIC(10,2),
  cash_variance NUMERIC(10,2),
  status neiist.pos_shift_status_enum,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  station_name TEXT,
  station_location TEXT,
  opened_by_name TEXT,
  closed_by_name TEXT
);

-- USERS TABLE
CREATE TABLE neiist.users (
  istid VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  github TEXT,
  linkedin TEXT
);

-- COURSES TABLE
CREATE TABLE neiist.user_courses (
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  course_name TEXT,
  PRIMARY KEY (user_istid, course_name)
);

-- CONTACTS TABLE
CREATE TABLE neiist.user_contacts (
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  contact_type neiist.contact_method_enum,
  contact_value TEXT NOT NULL,
  is_preferred BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_istid, contact_type),
  CONSTRAINT valid_contact_value CHECK (
    CASE contact_type
      WHEN 'email' THEN contact_value ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      WHEN 'alt_email' THEN contact_value ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      WHEN 'phone' THEN contact_value ~ '^\+?[0-9\s\-\(\)]{7,20}$'
      ELSE TRUE
    END
  )
);

-- Ensure only one preferred contact per user
CREATE UNIQUE INDEX idx_user_preferred_contact
ON neiist.user_contacts (user_istid, is_preferred)
WHERE is_preferred = TRUE;

-- EMAIL TOKEN VERIFICATION
CREATE TABLE neiist.email_token (
  id SERIAL PRIMARY KEY,
  istid VARCHAR(10) NOT NULL REFERENCES neiist.users(istid),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- DEPARTMENTS TABLE
CREATE TABLE neiist.departments (
  name TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  department_type TEXT CHECK (department_type IN ('team', 'admin_body')),
  display_order INTEGER NOT NULL DEFAULT 999
);

-- TEAMS TABLE
CREATE TABLE neiist.teams (
  name TEXT PRIMARY KEY REFERENCES neiist.departments(name),
  description JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ADMINISTRATION BODIES TABLE
CREATE TABLE neiist.admin_bodies (
  name TEXT PRIMARY KEY REFERENCES neiist.departments(name)
);

-- VALID (DEPARTMENT | ROLE) COMBINATIONS TABLE
CREATE TABLE neiist.valid_department_roles (
  department_name TEXT REFERENCES neiist.departments(name) ON UPDATE CASCADE ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  access_label neiist.access_label_enum DEFAULT NULL,
  PRIMARY KEY (department_name, role_name),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ROLE PERMISSIONS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS neiist.role_permissions (
  department_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  permission_name neiist.permission_enum NOT NULL,
  FOREIGN KEY (department_name, role_name)
    REFERENCES neiist.valid_department_roles(department_name, role_name) ON DELETE CASCADE,
  PRIMARY KEY (department_name, role_name, permission_name)
);

-- MEMBERSHIP TABLE
CREATE TABLE neiist.membership (
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  department_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  from_date DATE NOT NULL DEFAULT CURRENT_DATE,
  to_date DATE DEFAULT NULL,
  FOREIGN KEY (department_name, role_name)
    REFERENCES neiist.valid_department_roles(department_name, role_name),
  CONSTRAINT valid_member_dates CHECK (to_date IS NULL OR to_date > from_date),
  PRIMARY KEY (user_istid, department_name, role_name, from_date)
);

-- DEPARTMENT MEMBERS HIERARCHY
CREATE TABLE IF NOT EXISTS neiist.department_role_order (
    id SERIAL PRIMARY KEY,
    department_name TEXT NOT NULL REFERENCES neiist.departments(name),
    role_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    CONSTRAINT fk_valid_role FOREIGN KEY (department_name, role_name)
      REFERENCES neiist.valid_department_roles(department_name, role_name),
    UNIQUE (department_name, role_name)
);

-- Ensure performance to calculate the access level of a user
CREATE INDEX IF NOT EXISTS idx_membership_active ON neiist.membership (user_istid, to_date)
WHERE to_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_membership_to_date ON neiist.membership (to_date)
WHERE to_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_membership_dates ON neiist.membership (from_date, to_date);

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

-- SHOP CATEGORIES
CREATE TABLE neiist.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- SHOP DISCOUNT CODES
CREATE TABLE neiist.discount_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type neiist.discount_type_enum NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
  valid_product_ids INTEGER[],
  valid_istids TEXT[],
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_discount_codes_max_uses CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT chk_discount_codes_current_uses CHECK (current_uses >= 0)
);

-- PRODUCTS
CREATE TABLE neiist.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  category_id INTEGER REFERENCES neiist.categories(id),
  product_type neiist.product_type_enum NOT NULL DEFAULT 'merchandise',
  stock_type neiist.shop_stock_type_enum NOT NULL,
  channels neiist.sales_channel_enum[] NOT NULL DEFAULT ARRAY['web','pos']::neiist.sales_channel_enum[],
  event_id TEXT REFERENCES neiist.activities(id) ON DELETE SET NULL,
  event_hook neiist.event_hook_enum DEFAULT NULL,
  stock_quantity INTEGER,
  order_start TIMESTAMPTZ,
  order_deadline TIMESTAMPTZ,
  estimated_delivery TEXT,
  size_guide TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_products_stock
    CHECK (
      (stock_type = 'limited' AND (stock_quantity IS NULL OR stock_quantity >= 0))
      OR stock_type IN ('on_demand', 'untracked')
    ),
  CONSTRAINT chk_product_channels
    CHECK (cardinality(channels) > 0),
  CONSTRAINT chk_food_drink_channel
    CHECK (product_type <> 'food_drink' OR channels = ARRAY['fast-pos'::neiist.sales_channel_enum]),
  CONSTRAINT chk_fast_pos_untracked
    CHECK (NOT ('fast-pos'::neiist.sales_channel_enum = ANY(channels)) OR stock_type = 'untracked'),
  CONSTRAINT chk_event_ticket_rules
    CHECK (product_type <> 'event_ticket' OR (event_id IS NOT NULL AND event_hook IS NOT NULL AND NOT ('fast-pos'::neiist.sales_channel_enum = ANY(channels))))
);

-- PRODUCTS VARIANTS
CREATE TABLE neiist.product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES neiist.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  images TEXT[] NOT NULL DEFAULT '{}',
  price_modifier NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_variant_stock CHECK (stock_quantity IS NULL OR stock_quantity >= 0)
);

-- PRODUCTS VARIANTS OPTIONS
CREATE TABLE neiist.product_variant_options (
  variant_id INTEGER NOT NULL REFERENCES neiist.product_variants(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  option_value TEXT NOT NULL,
  PRIMARY KEY (variant_id, option_name)
);

-- Index for better search performance on products variants
CREATE INDEX idx_product_variants_product ON neiist.product_variants(product_id);

-- ORDER NUMBER GENERATOR
CREATE SEQUENCE neiist.order_sequence;

CREATE OR REPLACE FUNCTION neiist.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN to_char(clock_timestamp(), 'YYYYMMDD') || to_char(nextval('neiist.order_sequence'), 'FM999999');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POS STATIONS & SHIFTS
CREATE TABLE neiist.pos_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE neiist.pos_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  station_id UUID NOT NULL REFERENCES neiist.pos_stations(id) ON DELETE RESTRICT,
  opened_by VARCHAR(10) NOT NULL REFERENCES neiist.users(istid),
  initial_float NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (initial_float >= 0),
  final_cash_counted NUMERIC(10,2) DEFAULT NULL,
  status neiist.pos_shift_status_enum NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ DEFAULT NULL,
  closed_by VARCHAR(10) REFERENCES neiist.users(istid)
);

CREATE UNIQUE INDEX idx_pos_shifts_user_single_open 
ON neiist.pos_shifts(opened_by) 
WHERE status = 'open';

-- CAMPUS SCHEDULE SLOTS
CREATE TABLE neiist.campus_schedule_slots (
  id SERIAL PRIMARY KEY,
  campus VARCHAR(20) NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schedule_slot_order CHECK (start_time < end_time),
  CONSTRAINT uq_campus_schedule_slot UNIQUE (campus, day_of_week, start_time, end_time)
);

-- GAME SCORE
CREATE TABLE neiist.game_score (
  user_istid VARCHAR(10) PRIMARY KEY REFERENCES neiist.users(istid),
  best_score INT NOT NULL CHECK (best_score >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_score_leaderboard ON neiist.game_score(best_score DESC);

-- ORDERS
CREATE TABLE neiist.orders (
  order_number TEXT PRIMARY KEY DEFAULT neiist.generate_order_number(),
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  nif TEXT,
  campus TEXT,
  notes TEXT,
  discount_code TEXT,
  discount_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  order_source neiist.sales_channel_enum NOT NULL DEFAULT 'web',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pickup_deadline TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  CONSTRAINT orders_identity_mode_chk CHECK (
    user_istid IS NULL
    OR (customer_name IS NULL AND customer_email IS NULL AND customer_phone IS NULL)
  )
);

CREATE INDEX idx_orders_user_istid ON neiist.orders(user_istid) WHERE user_istid IS NOT NULL;

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

CREATE INDEX idx_activities_sign_up_order_number ON neiist.activities_sign_up(order_number);
CREATE INDEX idx_activities_sign_up_ticket_code ON neiist.activities_sign_up(ticket_code);

-- ORDER ITEMS
CREATE TABLE neiist.order_items (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL REFERENCES neiist.orders(order_number) ON UPDATE CASCADE ON DELETE CASCADE,
  product_id INTEGER REFERENCES neiist.products(id) ON DELETE SET NULL,
  variant_id INTEGER REFERENCES neiist.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT,
  variant_options JSONB,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status neiist.shop_order_status_enum NOT NULL DEFAULT 'pending',
  stock_decremented INTEGER NOT NULL DEFAULT 0 CHECK (stock_decremented >= 0),
  delivered_at TIMESTAMPTZ DEFAULT NULL,
  delivered_by VARCHAR(10) REFERENCES neiist.users(istid),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_number ON neiist.order_items(order_number);

-- PAYMENTS
CREATE TABLE neiist.payments (
  id SERIAL PRIMARY KEY,
  method neiist.payment_method_enum NOT NULL,
  status neiist.payment_status_enum NOT NULL DEFAULT 'pending',
  reference TEXT DEFAULT NULL,
  paid_at TIMESTAMPTZ DEFAULT NULL,
  received_by VARCHAR(10) REFERENCES neiist.users(istid),
  shift_id UUID REFERENCES neiist.pos_shifts(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pos_payment_shift CHECK (
    status <> 'successful' OR method NOT IN ('cash'::neiist.payment_method_enum, 'tpa'::neiist.payment_method_enum) OR shift_id IS NOT NULL
  )
);

-- ORDER PAYMENTS
CREATE TABLE neiist.order_payments (
  payment_id INTEGER NOT NULL REFERENCES neiist.payments(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL REFERENCES neiist.orders(order_number) ON UPDATE CASCADE ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  PRIMARY KEY (payment_id, order_number)
);

CREATE INDEX idx_order_payments_order ON neiist.order_payments(order_number);

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

-- Restock Limited stock items on order item cancellation
CREATE OR REPLACE FUNCTION neiist.restock_on_order_item_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
    -- 1. Restock variant stock (only for limited stock products)
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE neiist.product_variants pv
      SET stock_quantity = COALESCE(pv.stock_quantity, 0) + NEW.quantity,
          updated_at = NOW()
      FROM neiist.products p
      WHERE pv.id = NEW.variant_id
        AND pv.product_id = p.id
        AND p.stock_type = 'limited';
    ELSE
      -- Restock base product stock
      UPDATE neiist.products
      SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity
      WHERE id = NEW.product_id AND stock_type = 'limited';
    END IF;

    -- 2. Revoke event admission if this was a ticket
    DELETE FROM neiist.activities_sign_up
    WHERE order_number = NEW.order_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_item_cancel
AFTER UPDATE OF status ON neiist.order_items
FOR EACH ROW
EXECUTE FUNCTION neiist.restock_on_order_item_cancel();

-- Update the name of products on orders
CREATE OR REPLACE FUNCTION neiist.update_order_item_product_name_on_product_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE neiist.order_items oi
    SET product_name = NEW.name
    WHERE oi.product_id = NEW.id
      AND oi.product_name = OLD.name;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_order_item_product_name_on_product_rename
AFTER UPDATE OF name ON neiist.products
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION neiist.update_order_item_product_name_on_product_rename();

-- FUNCTIONS

-- Get user
CREATE OR REPLACE FUNCTION neiist.get_user(
  u_istid VARCHAR(10)
) RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  alt_email TEXT,
  phone TEXT,
  preferred_contact_method TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.istid,
    u.name,
    u.email,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'alt_email' LIMIT 1) AS alt_email,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'phone' LIMIT 1) AS phone,
    (SELECT contact_type::TEXT FROM neiist.user_contacts WHERE user_istid = u.istid AND is_preferred = TRUE LIMIT 1) AS preferred_contact_method,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    COALESCE(derived_permissions.permissions_array, ARRAY[]::TEXT[]) AS permissions,
    derived_label.top_label::TEXT AS access_label,
    COALESCE(team_list.team_array, ARRAY[]::TEXT[]) AS teams,
    u.github,
    u.linkedin,
    COALESCE(dept_perms.dept_perms_obj, '{}'::JSONB) AS department_permissions
  FROM neiist.users u
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT rp.permission_name::TEXT)
        FILTER (WHERE rp.permission_name IS NOT NULL AND rp.permission_name::TEXT NOT LIKE '%_dept') AS permissions_array
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_permissions ON u.istid = derived_permissions.user_istid
  LEFT JOIN (
    SELECT
      sub.user_istid,
      jsonb_object_agg(sub.department_name, sub.perms) AS dept_perms_obj
    FROM (
      SELECT
        m.user_istid,
        m.department_name::TEXT AS department_name,
        jsonb_agg(DISTINCT rp.permission_name::TEXT) FILTER (WHERE rp.permission_name IS NOT NULL) AS perms
      FROM neiist.membership m
      JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
      LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
      WHERE m.user_istid = u_istid
        AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
        AND vdr.active = TRUE
      GROUP BY m.user_istid, m.department_name
    ) sub
    GROUP BY sub.user_istid
  ) dept_perms ON u.istid = dept_perms.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      CASE
        WHEN bool_or(vdr.access_label = 'admin') THEN 'admin'
        WHEN bool_or(vdr.access_label = 'coordinator') THEN 'coordinator'
      END AS top_label
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_label ON u.istid = derived_label.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT m.department_name::TEXT) AS team_array
    FROM neiist.membership m
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
    GROUP BY m.user_istid
  ) team_list ON u.istid = team_list.user_istid
  WHERE u.istid = u_istid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add user
CREATE OR REPLACE FUNCTION neiist.add_user(
  p_istid VARCHAR(10),
  p_name TEXT,
  p_email TEXT,
  p_alt_email TEXT,
  p_phone TEXT,
  p_courses TEXT[],
  p_github TEXT DEFAULT NULL,
  p_linkedin TEXT DEFAULT NULL
) RETURNS TABLE(
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  alt_email TEXT,
  phone TEXT,
  preferred_contact_method TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO neiist.users (istid, name, email, github, linkedin)
  VALUES (p_istid, p_name, p_email, p_github, p_linkedin);

  -- Insert alternative email if provided
  IF p_alt_email IS NOT NULL THEN
    INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
    VALUES (p_istid, 'alt_email', p_alt_email);
  END IF;

  -- Insert phone if provided
  IF p_phone IS NOT NULL THEN
    INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
    VALUES (p_istid, 'phone', p_phone);
  END IF;

  -- Insert courses if provided
  IF p_courses IS NOT NULL THEN
    INSERT INTO neiist.user_courses (user_istid, course_name)
    SELECT DISTINCT p_istid, unnest(p_courses)
    ON CONFLICT (user_istid, course_name) DO NOTHING;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Add department
CREATE OR REPLACE FUNCTION neiist.add_department(
  u_name TEXT,
  u_department_type TEXT DEFAULT 'team',
  u_description JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" já existe.', u_name;
  END IF;

  IF u_department_type NOT IN ('team', 'admin_body') THEN
    RAISE EXCEPTION 'Tipo de departamento inválido. Deve ser "team" ou "admin_body".';
  END IF;

  INSERT INTO neiist.departments (name, department_type, active)
  VALUES (u_name, u_department_type, TRUE);

  IF u_department_type = 'team' THEN
    INSERT INTO neiist.teams (name, description)
    VALUES (u_name, COALESCE(u_description, '{}'::jsonb))
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
  ELSIF u_department_type = 'admin_body' THEN
    INSERT INTO neiist.admin_bodies (name)
    VALUES (u_name)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove department
CREATE OR REPLACE FUNCTION neiist.remove_department(
  u_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
  END IF;

  UPDATE neiist.departments SET active = FALSE WHERE name = u_name;
  UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
  UPDATE neiist.membership SET to_date = CURRENT_DATE WHERE department_name = u_name
    AND (to_date IS NULL OR to_date >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re/activate department
CREATE OR REPLACE FUNCTION neiist.activate_department(
  u_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
  END IF;

  UPDATE neiist.departments SET active = TRUE WHERE name = u_name;
  UPDATE neiist.valid_department_roles SET active = TRUE WHERE department_name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete department permanently (only if no members exist)
CREATE OR REPLACE FUNCTION neiist.delete_department(
  u_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
  END IF;

  IF EXISTS (SELECT 1 FROM neiist.membership WHERE department_name = u_name) THEN
    RAISE EXCEPTION 'Não é possível eliminar permanentemente um departamento com membros.';
  END IF;

  DELETE FROM neiist.role_permissions WHERE department_name = u_name;
  DELETE FROM neiist.department_role_order WHERE department_name = u_name;
  DELETE FROM neiist.valid_department_roles WHERE department_name = u_name;
  DELETE FROM neiist.teams WHERE name = u_name;
  DELETE FROM neiist.admin_bodies WHERE name = u_name;
  DELETE FROM neiist.departments WHERE name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update team description
CREATE OR REPLACE FUNCTION neiist.update_team_description(
  p_name TEXT,
  p_description JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.teams WHERE name = p_name) THEN
    RAISE EXCEPTION 'A equipa "%" não existe.', p_name;
  END IF;

  UPDATE neiist.teams
  SET description = p_description
  WHERE name = p_name;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION neiist.update_team_description(
  p_name TEXT,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN neiist.update_team_description(
    p_name,
    CASE
      WHEN p_description IS NULL OR p_description = '' THEN '{}'::jsonb
      ELSE jsonb_build_object('pt', p_description)
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add valid department role
CREATE OR REPLACE FUNCTION neiist.add_valid_department_role(
  u_department_name TEXT,
  u_role_name TEXT,
  u_access_label neiist.access_label_enum DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_department_name AND active = TRUE) THEN
    RAISE EXCEPTION 'O departamento "%" não existe ou não está ativo.', u_department_name;
  END IF;

  INSERT INTO neiist.valid_department_roles (department_name, role_name, access_label)
  VALUES (u_department_name, u_role_name, u_access_label)
  ON CONFLICT (department_name, role_name) DO UPDATE SET active = TRUE, access_label = u_access_label;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set role access label
CREATE OR REPLACE FUNCTION neiist.set_role_access_label(
  u_department_name TEXT,
  u_role_name TEXT,
  u_access_label neiist.access_label_enum DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE neiist.valid_department_roles
  SET access_label = u_access_label
  WHERE department_name = u_department_name AND role_name = u_role_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cargo "%" no departamento "%" não encontrado.', u_role_name, u_department_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove valid department role (deactivate)
CREATE OR REPLACE FUNCTION neiist.remove_valid_department_role(
  u_department_name TEXT,
  u_role_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.valid_department_roles WHERE department_name = u_department_name
    AND role_name = u_role_name) THEN
    RAISE EXCEPTION 'A posição "%" para o departamento "%" não existe.', u_role_name, u_department_name;
  END IF;

  UPDATE neiist.valid_department_roles SET active = FALSE
    WHERE department_name = u_department_name AND role_name = u_role_name;
  UPDATE neiist.membership SET to_date = CURRENT_DATE
    WHERE department_name = u_department_name AND role_name = u_role_name
      AND (to_date IS NULL OR to_date >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete valid department role permanently (only if no members exist)
CREATE OR REPLACE FUNCTION neiist.delete_valid_department_role(
  u_department_name TEXT,
  u_role_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM neiist.valid_department_roles
    WHERE department_name = u_department_name AND role_name = u_role_name
  ) THEN
    RAISE EXCEPTION 'A posição "%" para o departamento "%" não existe.', u_role_name, u_department_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM neiist.membership
    WHERE department_name = u_department_name AND role_name = u_role_name
  ) THEN
    RAISE EXCEPTION 'Não é possível eliminar permanentemente um cargo com membros.';
  END IF;

  DELETE FROM neiist.role_permissions WHERE department_name = u_department_name AND role_name = u_role_name;
  DELETE FROM neiist.department_role_order WHERE department_name = u_department_name AND role_name = u_role_name;
  DELETE FROM neiist.valid_department_roles WHERE department_name = u_department_name AND role_name = u_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add membership with dates
CREATE OR REPLACE FUNCTION neiist.add_membership(
  p_user_istid VARCHAR(10),
  p_department_name TEXT,
  p_role_name TEXT,
  p_from_date DATE DEFAULT CURRENT_DATE,
  p_to_date DATE DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = p_user_istid) THEN
    RAISE EXCEPTION 'O utilizador "%" não existe.', p_user_istid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM neiist.valid_department_roles
    WHERE department_name = p_department_name AND role_name = p_role_name AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'O cargo "%" no departamento "%" não existe ou não está ativo.', p_role_name, p_department_name;
  END IF;

  INSERT INTO neiist.membership (user_istid, department_name, role_name, from_date, to_date)
  VALUES (p_user_istid, p_department_name, p_role_name, p_from_date, p_to_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conclude membership
CREATE OR REPLACE FUNCTION neiist.conclude_membership(
  p_user_istid VARCHAR(10),
  p_department_name TEXT,
  p_role_name TEXT,
  p_from_date DATE
) RETURNS VOID AS $$
BEGIN
  UPDATE neiist.membership
  SET to_date = CURRENT_DATE
  WHERE user_istid = p_user_istid
    AND department_name = p_department_name
    AND role_name = p_role_name
    AND from_date = p_from_date
    AND (to_date IS NULL OR to_date >= CURRENT_DATE);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mandato ativo não encontrado para conclusão.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete membership permanently
CREATE OR REPLACE FUNCTION neiist.delete_membership(
  p_user_istid VARCHAR(10),
  p_department_name TEXT,
  p_role_name TEXT,
  p_from_date DATE
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.membership
  WHERE user_istid = p_user_istid
    AND department_name = p_department_name
    AND role_name = p_role_name
    AND from_date = p_from_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registo de mandato não encontrado para remoção.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all users
CREATE OR REPLACE FUNCTION neiist.get_all_users()
RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  phone TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.istid,
    u.name,
    u.email,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'phone' LIMIT 1) AS phone,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    COALESCE(derived_permissions.permissions_array, ARRAY[]::TEXT[]) AS permissions,
    derived_label.top_label::TEXT AS access_label,
    COALESCE(user_teams.teams_array, ARRAY[]::TEXT[]) as teams,
    u.github,
    u.linkedin,
    COALESCE(dept_perms.dept_perms_obj, '{}'::JSONB) AS department_permissions
  FROM neiist.users u
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT rp.permission_name::TEXT)
        FILTER (WHERE rp.permission_name IS NOT NULL AND rp.permission_name::TEXT NOT LIKE '%_dept') AS permissions_array
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
    WHERE (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_permissions ON u.istid = derived_permissions.user_istid
  LEFT JOIN (
    SELECT
      sub.user_istid,
      jsonb_object_agg(sub.department_name, sub.perms) AS dept_perms_obj
    FROM (
      SELECT
        m.user_istid,
        m.department_name::TEXT AS department_name,
        jsonb_agg(DISTINCT rp.permission_name::TEXT) FILTER (WHERE rp.permission_name IS NOT NULL) AS perms
      FROM neiist.membership m
      JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
      LEFT JOIN neiist.role_permissions rp ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
      WHERE (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
        AND vdr.active = TRUE
      GROUP BY m.user_istid, m.department_name
    ) sub
    GROUP BY sub.user_istid
  ) dept_perms ON u.istid = dept_perms.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      CASE
        WHEN bool_or(vdr.access_label = 'admin') THEN 'admin'
        WHEN bool_or(vdr.access_label = 'coordinator') THEN 'coordinator'
      END AS top_label
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    WHERE (m.to_date IS NULL OR m.to_date >= CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_label ON u.istid = derived_label.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT m.department_name::TEXT) as teams_array
    FROM neiist.membership m
    WHERE m.to_date IS NULL OR m.to_date >= CURRENT_DATE
    GROUP BY m.user_istid
  ) user_teams ON u.istid = user_teams.user_istid
  ORDER BY
    CASE derived_label.top_label
      WHEN 'admin' THEN 1
      WHEN 'coordinator' THEN 2
      ELSE 3
    END,
    u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user data
CREATE OR REPLACE FUNCTION neiist.update_user(
  p_istid VARCHAR(10),
  p_updates JSONB
) RETURNS TABLE(
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  alt_email TEXT,
  phone TEXT,
  preferred_contact_method TEXT,
  courses TEXT[],
  permissions TEXT[],
  access_label TEXT,
  teams TEXT[],
  github TEXT,
  linkedin TEXT,
  department_permissions JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update users table fields
  IF p_updates ? 'name' THEN
    UPDATE neiist.users SET name = p_updates->>'name' WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'email' THEN
    UPDATE neiist.users SET email = p_updates->>'email' WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'github' THEN
    UPDATE neiist.users SET github = p_updates->>'github' WHERE neiist.users.istid = p_istid;
  END IF;
  IF p_updates ? 'linkedin' THEN
    UPDATE neiist.users SET linkedin = p_updates->>'linkedin' WHERE neiist.users.istid = p_istid;
  END IF;

  -- Update alternativeEmail in user_contacts
  IF p_updates ? 'alternativeEmail' THEN
    IF p_updates->>'alternativeEmail' IS NULL THEN
      DELETE FROM neiist.user_contacts WHERE user_istid = p_istid AND contact_type = 'alt_email';
    ELSE
      INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
      VALUES (p_istid, 'alt_email', p_updates->>'alternativeEmail')
      ON CONFLICT (user_istid, contact_type) DO UPDATE SET contact_value = EXCLUDED.contact_value;
    END IF;
  END IF;

  -- Update phone in user_contacts
  IF p_updates ? 'phone' THEN
    IF p_updates->>'phone' IS NULL THEN
      DELETE FROM neiist.user_contacts WHERE user_istid = p_istid AND contact_type = 'phone';
    ELSE
      INSERT INTO neiist.user_contacts (user_istid, contact_type, contact_value)
      VALUES (p_istid, 'phone', p_updates->>'phone')
      ON CONFLICT (user_istid, contact_type) DO UPDATE SET contact_value = EXCLUDED.contact_value;
    END IF;
  END IF;

  -- Update preferredContactMethod in user_contacts
  IF p_updates ? 'preferredContactMethod' THEN
    UPDATE neiist.user_contacts SET is_preferred = FALSE WHERE user_istid = p_istid;
    UPDATE neiist.user_contacts
    SET is_preferred = TRUE
    WHERE user_istid = p_istid AND contact_type = (p_updates->>'preferredContactMethod')::neiist.contact_method_enum;
  END IF;

  -- Update courses in user_courses
  IF p_updates ? 'courses' THEN
    DELETE FROM neiist.user_courses WHERE user_istid = p_istid;
    IF jsonb_array_length(p_updates->'courses') > 0 THEN
      INSERT INTO neiist.user_courses (user_istid, course_name)
      SELECT DISTINCT p_istid, value::TEXT
      FROM jsonb_array_elements_text(p_updates->'courses') AS value
      ON CONFLICT (user_istid, course_name) DO NOTHING;
    END IF;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Create a new email verification request
CREATE OR REPLACE FUNCTION neiist.add_email_verification(
  p_istid VARCHAR(10),
  p_email TEXT,
  p_token TEXT,
  p_expires_at TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  INSERT INTO neiist.email_token (istid, email, token, expires_at)
  VALUES (p_istid, p_email, p_token, p_expires_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get verification request by token
CREATE OR REPLACE FUNCTION neiist.get_email_verification(
  p_token TEXT
) RETURNS TABLE(istid VARCHAR(10), email TEXT, expires_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY SELECT email_token.istid, email_token.email, email_token.expires_at
  FROM neiist.email_token
  WHERE email_token.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a verification request
CREATE OR REPLACE FUNCTION neiist.delete_email_verification(
  p_token TEXT
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.email_token WHERE token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get verification request by user
CREATE OR REPLACE FUNCTION neiist.get_email_verification_by_user(
  p_istid VARCHAR(10)
) RETURNS TABLE(email TEXT, expires_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT email_token.email, email_token.expires_at
  FROM neiist.email_token
  WHERE email_token.istid = p_istid
    AND email_token.expires_at > NOW()
  ORDER BY email_token.expires_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all departments
CREATE OR REPLACE FUNCTION neiist.get_all_departments()
RETURNS TABLE (
  name TEXT,
  active BOOLEAN,
  department_type TEXT,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.name::TEXT, d.active, d.department_type::TEXT, d.display_order
  FROM neiist.departments d
  ORDER BY d.display_order, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all teams
CREATE OR REPLACE FUNCTION neiist.get_all_teams()
RETURNS TABLE (
  name TEXT,
  description JSONB,
  active BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.name::TEXT, t.description, d.active, d.display_order
  FROM neiist.teams t
  JOIN neiist.departments d ON t.name = d.name
  ORDER BY d.display_order, t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all admin bodies
CREATE OR REPLACE FUNCTION neiist.get_all_admin_bodies()
RETURNS TABLE (
  name TEXT,
  active BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT ab.name::TEXT, d.active, d.display_order
  FROM neiist.admin_bodies ab
  JOIN neiist.departments d ON ab.name = d.name
  ORDER BY d.display_order, ab.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all department roles
CREATE OR REPLACE FUNCTION neiist.get_all_department_roles()
RETURNS TABLE (
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  active BOOLEAN,
  access_label TEXT,
  permissions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vdr.department_name::TEXT,
    d.department_type::TEXT,
    vdr.role_name::TEXT,
    vdr.active,
    vdr.access_label::TEXT,
    COALESCE(
      array_agg(rp.permission_name::TEXT ORDER BY rp.permission_name)
        FILTER (WHERE rp.permission_name IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS permissions
  FROM neiist.valid_department_roles vdr
  JOIN neiist.departments d ON vdr.department_name = d.name
  LEFT JOIN neiist.role_permissions rp
    ON vdr.department_name = rp.department_name AND vdr.role_name = rp.role_name
  GROUP BY vdr.department_name, d.department_type, vdr.role_name, vdr.active, vdr.access_label
  ORDER BY d.department_type, vdr.department_name, vdr.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all memberships
CREATE OR REPLACE FUNCTION neiist.get_all_memberships()
RETURNS TABLE (
  user_istid VARCHAR(10),
  user_name TEXT,
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  from_date DATE,
  to_date DATE,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.user_istid,
    u.name AS user_name,
    m.department_name::TEXT,
    d.department_type::TEXT,
    m.role_name::TEXT,
    m.from_date,
    m.to_date,
    CASE
      WHEN m.to_date IS NULL OR m.to_date >= CURRENT_DATE THEN TRUE
      ELSE FALSE
    END AS active
  FROM neiist.membership m
  JOIN neiist.users u ON m.user_istid = u.istid
  JOIN neiist.departments d ON m.department_name = d.name
  ORDER BY d.display_order, u.name, m.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set role permissions
CREATE OR REPLACE FUNCTION neiist.set_role_permissions(
  p_department_name TEXT,
  p_role_name TEXT,
  p_permissions TEXT[]
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM neiist.valid_department_roles
    WHERE department_name = p_department_name AND role_name = p_role_name AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'O cargo "%" no departamento "%" não existe ou não está ativo.', p_role_name, p_department_name;
  END IF;

  DELETE FROM neiist.role_permissions
  WHERE department_name = p_department_name
    AND role_name = p_role_name;

  IF p_permissions IS NOT NULL AND array_length(p_permissions, 1) > 0 THEN
    INSERT INTO neiist.role_permissions (department_name, role_name, permission_name)
    SELECT p_department_name, p_role_name, unnest(p_permissions)::neiist.permission_enum
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get academic years
CREATE OR REPLACE FUNCTION neiist.get_academic_years()
RETURNS TABLE (
  academic_year TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH bounds AS (
    SELECT
      COALESCE(MIN(
        CASE
          WHEN (EXTRACT(MONTH FROM from_date) = 8 AND EXTRACT(DAY FROM from_date) >= 15)
               OR EXTRACT(MONTH FROM from_date) >= 9
            THEN EXTRACT(YEAR FROM from_date)::INT
          ELSE EXTRACT(YEAR FROM from_date)::INT - 1
        END
      ), EXTRACT(YEAR FROM CURRENT_DATE)::INT) AS min_year,
      COALESCE(MAX(
        CASE
          WHEN to_date IS NOT NULL THEN
            CASE
              WHEN (EXTRACT(MONTH FROM to_date) = 8 AND EXTRACT(DAY FROM to_date) >= 15)
                   OR EXTRACT(MONTH FROM to_date) >= 9
                THEN EXTRACT(YEAR FROM to_date)::INT
              ELSE EXTRACT(YEAR FROM to_date)::INT - 1
            END
          ELSE
            CASE
              WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8 THEN EXTRACT(YEAR FROM CURRENT_DATE)::INT
              ELSE EXTRACT(YEAR FROM CURRENT_DATE)::INT - 1
            END
        END
      ), EXTRACT(YEAR FROM CURRENT_DATE)::INT) AS max_year
    FROM neiist.membership
  ),
  series AS (
    SELECT generate_series(min_year, max_year) AS y FROM bounds
  )
  SELECT (y::TEXT || '/' || (y + 1)::TEXT) AS academic_year
  FROM series
  ORDER BY y DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get memberships for specific academic year
CREATE OR REPLACE FUNCTION neiist.get_memberships_for_academic_year(p_academic_year TEXT)
RETURNS TABLE (
  user_istid VARCHAR(10),
  user_name TEXT,
  user_email TEXT,
  user_github TEXT,
  user_linkedin TEXT,
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  from_date DATE,
  to_date DATE,
  active BOOLEAN
) AS $$
DECLARE
  v_start_year INT;
  v_end_year INT;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  IF p_academic_year !~ '^\d{4}/\d{4}$' THEN
    RAISE EXCEPTION 'Formato de ano letivo inválido. Esperado YYYY/YYYY (ex: 2024/2025).';
  END IF;

  v_start_year := SPLIT_PART(p_academic_year, '/', 1)::INT;
  v_end_year := SPLIT_PART(p_academic_year, '/', 2)::INT;
  v_start_date := TO_DATE(v_start_year::TEXT || '-09-01', 'YYYY-MM-DD');
  v_end_date := TO_DATE(v_end_year::TEXT || '-07-31', 'YYYY-MM-DD');

  RETURN QUERY
  SELECT
    m.user_istid,
    u.name AS user_name,
    u.email::TEXT AS user_email,
    u.github::TEXT AS user_github,
    u.linkedin::TEXT AS user_linkedin,
    m.department_name::TEXT,
    d.department_type::TEXT,
    m.role_name::TEXT,
    m.from_date,
    m.to_date,
    CASE
      WHEN m.to_date IS NULL OR m.to_date >= CURRENT_DATE THEN TRUE
      ELSE FALSE
    END AS active
  FROM neiist.membership m
  JOIN neiist.users u ON m.user_istid = u.istid
  JOIN neiist.departments d ON m.department_name = d.name
  WHERE m.from_date <= v_end_date
    AND (m.to_date IS NULL OR m.to_date > v_start_date)
  ORDER BY d.display_order, u.name, m.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get hierarchy for a department
CREATE OR REPLACE FUNCTION neiist.get_department_role_order(
  p_department TEXT
) RETURNS TABLE(role_name TEXT, "position" INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT dro.role_name::TEXT, dro.position
  FROM neiist.department_role_order dro
  WHERE dro.department_name = p_department
  ORDER BY dro.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set hierarchy for a department
CREATE OR REPLACE FUNCTION neiist.set_department_role_order(
  p_department TEXT,
  p_roles TEXT[]
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.department_role_order
  WHERE department_name = p_department;

  INSERT INTO neiist.department_role_order (department_name, role_name, position)
  SELECT p_department, role, idx
  FROM unnest(p_roles) WITH ORDINALITY AS t(role, idx);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  v_ticket_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 9));
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

-- GET OR CREATE A CATEGORY
CREATE OR REPLACE FUNCTION neiist.get_or_create_category(p_name TEXT)
RETURNS TABLE (
  category_id INTEGER,
  category_name TEXT
) AS $$
DECLARE
  v_category_id INTEGER;
  v_clean_name TEXT;
BEGIN
  v_clean_name := BTRIM(p_name);
  IF v_clean_name IS NULL OR LENGTH(v_clean_name) = 0 THEN
    RETURN;
  END IF;
  SELECT c.id INTO v_category_id
  FROM neiist.categories c
  WHERE LOWER(c.name) = LOWER(v_clean_name);
  IF v_category_id IS NULL THEN
    INSERT INTO neiist.categories (name)
    VALUES (v_clean_name)
    RETURNING neiist.categories.id INTO v_category_id;
  END IF;

  RETURN QUERY
  SELECT v_category_id, v_clean_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Consolidated get_products
CREATE OR REPLACE FUNCTION neiist.get_products(
  p_product_id INTEGER DEFAULT NULL,
  p_channel neiist.sales_channel_enum DEFAULT NULL,
  p_include_archived BOOLEAN DEFAULT FALSE
)
RETURNS SETOF neiist.product_record AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.images,
    c.name AS category,
    p.stock_type,
    p.stock_quantity,
    p.order_start,
    p.order_deadline,
    p.estimated_delivery,
    p.size_guide,
    p.active,
    p.product_type,
    p.channels,
    p.event_id,
    p.event_hook,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', v.id,
          'sku', v.sku,
          'images', v.images,
          'price_modifier', v.price_modifier,
          'stock_quantity', v.stock_quantity,
          'active', v.active,
          'options', COALESCE((
            SELECT jsonb_object_agg(vo.option_name, vo.option_value)
            FROM neiist.product_variant_options vo
            WHERE vo.variant_id = v.id
            ), '{}'::jsonb),
          'label', NULLIF((
            SELECT string_agg(vo.option_name || ': ' || vo.option_value, ' | ' ORDER BY vo.option_name)
            FROM neiist.product_variant_options vo
            WHERE vo.variant_id = v.id
            ), '')
        )
        ORDER BY v.id
      )
      FROM neiist.product_variants v
      WHERE v.product_id = p.id
    ), '[]'::JSONB) AS variants
  FROM neiist.products p
  LEFT JOIN neiist.categories c ON c.id = p.category_id
  WHERE (p_product_id IS NULL OR p.id = p_product_id)
    AND (p_include_archived OR p.active = TRUE)
    AND (p_channel IS NULL OR p_channel = ANY(p.channels))
  ORDER BY
    CASE WHEN p_include_archived THEN p.active END DESC NULLS LAST,
    p.id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create Product
CREATE OR REPLACE FUNCTION neiist.create_product(
  p_data JSONB
)
RETURNS SETOF neiist.product_record AS $$
DECLARE
  v_id INTEGER;
  v_cat_id INTEGER;
  v_channels neiist.sales_channel_enum[];
BEGIN
  IF p_data ? 'category' AND p_data->>'category' IS NOT NULL AND BTRIM(p_data->>'category') <> '' THEN
    SELECT category_id INTO v_cat_id FROM neiist.get_or_create_category(p_data->>'category');
  END IF;

  IF p_data ? 'channels' AND p_data->'channels' IS NOT NULL AND jsonb_typeof(p_data->'channels') = 'array' THEN
    SELECT COALESCE(array_agg(elem::neiist.sales_channel_enum), ARRAY['web'::neiist.sales_channel_enum, 'pos'::neiist.sales_channel_enum])
    INTO v_channels
    FROM jsonb_array_elements_text(p_data->'channels') elem;
  END IF;

  INSERT INTO neiist.products (
    name, description, price, images, category_id, stock_type, stock_quantity,
    order_start, order_deadline, estimated_delivery, size_guide, active,
    product_type, channels, event_id, event_hook
  ) VALUES (
    COALESCE(p_data->>'name', ''),
    NULLIF(p_data->>'description', ''),
    COALESCE((p_data->>'price')::NUMERIC(10,2), 0.00),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'images')), '{}'),
    v_cat_id,
    CASE
      WHEN COALESCE((p_data->>'product_type')::neiist.product_type_enum, 'merchandise') = 'food_drink' THEN 'untracked'::neiist.shop_stock_type_enum
      ELSE COALESCE((p_data->>'stock_type')::neiist.shop_stock_type_enum, 'limited')
    END,
    CASE
      WHEN COALESCE((p_data->>'product_type')::neiist.product_type_enum, 'merchandise') = 'food_drink' THEN NULL
      WHEN COALESCE((p_data->>'stock_type')::neiist.shop_stock_type_enum, 'limited') IN ('on_demand', 'untracked') THEN NULL
      ELSE NULLIF(p_data->>'stock_quantity', '')::INTEGER
    END,
    NULLIF(p_data->>'order_start', '')::TIMESTAMPTZ,
    NULLIF(p_data->>'order_deadline', '')::TIMESTAMPTZ,
    NULLIF(p_data->>'estimated_delivery', ''),
    NULLIF(p_data->>'size_guide', ''),
    COALESCE((p_data->>'active')::BOOLEAN, TRUE),
    COALESCE((p_data->>'product_type')::neiist.product_type_enum, 'merchandise'),
    CASE
      WHEN COALESCE((p_data->>'product_type')::neiist.product_type_enum, 'merchandise') = 'food_drink' THEN ARRAY['fast-pos'::neiist.sales_channel_enum]
      ELSE COALESCE(v_channels, ARRAY['web'::neiist.sales_channel_enum, 'pos'::neiist.sales_channel_enum])
    END,
    NULLIF(p_data->>'event_id', ''),
    NULLIF(p_data->>'event_hook', '')::neiist.event_hook_enum
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT * FROM neiist.get_products(v_id, NULL, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Product
CREATE OR REPLACE FUNCTION neiist.update_product(
  p_product_id INTEGER,
  p_data JSONB
)
RETURNS SETOF neiist.product_record AS $$
DECLARE
  v_cat_id INTEGER;
  v_channels neiist.sales_channel_enum[];
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID cannot be null';
  END IF;

  IF p_data ? 'category' AND p_data->>'category' IS NOT NULL AND BTRIM(p_data->>'category') <> '' THEN
    SELECT category_id INTO v_cat_id FROM neiist.get_or_create_category(p_data->>'category');
  END IF;

  IF p_data ? 'channels' AND p_data->'channels' IS NOT NULL AND jsonb_typeof(p_data->'channels') = 'array' THEN
    SELECT COALESCE(array_agg(elem::neiist.sales_channel_enum), ARRAY['web'::neiist.sales_channel_enum, 'pos'::neiist.sales_channel_enum])
    INTO v_channels
    FROM jsonb_array_elements_text(p_data->'channels') elem;
  END IF;

  UPDATE neiist.products
  SET
    category_id = CASE WHEN p_data ? 'category' THEN v_cat_id ELSE category_id END,
    name = CASE WHEN p_data ? 'name' THEN COALESCE(p_data->>'name', name) ELSE name END,
    description = CASE WHEN p_data ? 'description' THEN NULLIF(p_data->>'description', '') ELSE description END,
    price = CASE WHEN p_data ? 'price' THEN (p_data->>'price')::NUMERIC(10,2) ELSE price END,
    images = CASE WHEN p_data ? 'images' THEN COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'images')), '{}') ELSE images END,
    stock_type = CASE
      WHEN (CASE WHEN p_data ? 'product_type' THEN (p_data->>'product_type')::neiist.product_type_enum ELSE product_type END) = 'food_drink' THEN 'untracked'::neiist.shop_stock_type_enum
      WHEN p_data ? 'stock_type' THEN (p_data->>'stock_type')::neiist.shop_stock_type_enum
      ELSE stock_type
    END,
    stock_quantity = CASE
      WHEN (CASE
        WHEN (CASE WHEN p_data ? 'product_type' THEN (p_data->>'product_type')::neiist.product_type_enum ELSE product_type END) = 'food_drink' THEN 'untracked'::neiist.shop_stock_type_enum
        WHEN p_data ? 'stock_type' THEN (p_data->>'stock_type')::neiist.shop_stock_type_enum
        ELSE stock_type
      END) IN ('on_demand', 'untracked') THEN NULL
      WHEN p_data ? 'stock_quantity' THEN NULLIF(p_data->>'stock_quantity', '')::INTEGER
      ELSE stock_quantity
    END,
    order_start = CASE WHEN p_data ? 'order_start' THEN NULLIF(p_data->>'order_start', '')::TIMESTAMPTZ ELSE order_start END,
    order_deadline = CASE WHEN p_data ? 'order_deadline' THEN NULLIF(p_data->>'order_deadline', '')::TIMESTAMPTZ ELSE order_deadline END,
    estimated_delivery = CASE WHEN p_data ? 'estimated_delivery' THEN NULLIF(p_data->>'estimated_delivery', '') ELSE estimated_delivery END,
    size_guide = CASE WHEN p_data ? 'size_guide' THEN NULLIF(p_data->>'size_guide', '') ELSE size_guide END,
    active = CASE WHEN p_data ? 'active' THEN (p_data->>'active')::BOOLEAN ELSE active END,
    product_type = CASE WHEN p_data ? 'product_type' THEN (p_data->>'product_type')::neiist.product_type_enum ELSE product_type END,
    channels = CASE
      WHEN (CASE WHEN p_data ? 'product_type' THEN (p_data->>'product_type')::neiist.product_type_enum ELSE product_type END) = 'food_drink' THEN ARRAY['fast-pos'::neiist.sales_channel_enum]
      WHEN p_data ? 'channels' THEN COALESCE(v_channels, channels)
      ELSE channels
    END,
    event_id = CASE WHEN p_data ? 'event_id' THEN NULLIF(p_data->>'event_id', '') ELSE event_id END,
    event_hook = CASE WHEN p_data ? 'event_hook' THEN NULLIF(p_data->>'event_hook', '')::neiist.event_hook_enum ELSE event_hook END
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_products(p_product_id, NULL, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Propagate changes to all variants
CREATE OR REPLACE FUNCTION neiist.sync_product_variants(
  p_product_id INTEGER,
  p_variants JSONB,
  p_delete_ids INTEGER[] DEFAULT '{}'::INTEGER[]
) RETURNS SETOF neiist.product_record AS $$
DECLARE
  v_var JSONB;
  v_var_id INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  IF p_delete_ids IS NOT NULL AND cardinality(p_delete_ids) > 0 THEN
    DELETE FROM neiist.product_variants
    WHERE product_id = p_product_id AND id = ANY(p_delete_ids);
  END IF;

  IF p_variants IS NOT NULL AND jsonb_typeof(p_variants) = 'array' THEN
    FOR v_var IN SELECT * FROM jsonb_array_elements(p_variants)
    LOOP
      v_var_id := NULLIF(v_var->>'id', '')::INTEGER;

      IF v_var_id IS NOT NULL AND EXISTS (SELECT 1 FROM neiist.product_variants WHERE id = v_var_id AND product_id = p_product_id) THEN
        UPDATE neiist.product_variants
        SET
          sku = NULLIF(v_var->>'sku', ''),
          images = COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_var->'images')), '{}'),
          price_modifier = COALESCE((v_var->>'price_modifier')::NUMERIC(10,2), 0.00),
          stock_quantity = NULLIF(v_var->>'stock_quantity', '')::INTEGER,
          active = COALESCE((v_var->>'active')::BOOLEAN, TRUE),
          updated_at = NOW()
        WHERE id = v_var_id;

        IF v_var ? 'options' THEN
          DELETE FROM neiist.product_variant_options WHERE variant_id = v_var_id;
          IF v_var->'options' IS NOT NULL AND jsonb_typeof(v_var->'options') = 'object' THEN
            INSERT INTO neiist.product_variant_options(variant_id, option_name, option_value)
            SELECT v_var_id, key, value FROM jsonb_each_text(v_var->'options');
          END IF;
        END IF;
      ELSE
        INSERT INTO neiist.product_variants (
          product_id, sku, images, price_modifier, stock_quantity, active
        ) VALUES (
          p_product_id,
          NULLIF(v_var->>'sku', ''),
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_var->'images')), '{}'),
          COALESCE((v_var->>'price_modifier')::NUMERIC(10,2), 0.00),
          NULLIF(v_var->>'stock_quantity', '')::INTEGER,
          COALESCE((v_var->>'active')::BOOLEAN, TRUE)
        ) RETURNING id INTO v_var_id;

        IF v_var ? 'options' AND v_var->'options' IS NOT NULL AND jsonb_typeof(v_var->'options') = 'object' THEN
          INSERT INTO neiist.product_variant_options(variant_id, option_name, option_value)
          SELECT v_var_id, key, value FROM jsonb_each_text(v_var->'options');
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_products(p_product_id, NULL, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permanently delete a product and all its variants
CREATE OR REPLACE FUNCTION neiist.delete_product(p_product_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.products WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permanently delete a single product variant
CREATE OR REPLACE FUNCTION neiist.delete_product_variant(p_variant_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.product_variants WHERE id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete a product category
CREATE OR REPLACE FUNCTION neiist.delete_category(p_category_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM neiist.categories WHERE id = p_category_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Discount Code
CREATE OR REPLACE FUNCTION neiist.create_discount_code(
  p_data JSONB
) RETURNS SETOF neiist.discount_codes AS $$
DECLARE
  v_id INTEGER;
  v_code TEXT;
  v_type neiist.discount_type_enum;
  v_val NUMERIC(10,2);
  v_products INTEGER[];
  v_istids TEXT[];
  v_max_uses INTEGER;
  v_expires TIMESTAMPTZ;
  v_active BOOLEAN;
BEGIN
  v_code := UPPER(BTRIM(COALESCE(p_data->>'code', '')));
  IF v_code = '' THEN
    RAISE EXCEPTION 'Discount code is required';
  END IF;

  IF (p_data->>'discount_type') NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'Invalid discount type';
  END IF;
  v_type := (p_data->>'discount_type')::neiist.discount_type_enum;
  v_val := ROUND(COALESCE((p_data->>'discount_value')::NUMERIC, 0.00), 2);

  IF p_data ? 'valid_product_ids' AND p_data->'valid_product_ids' IS NOT NULL AND jsonb_typeof(p_data->'valid_product_ids') = 'array' THEN
    SELECT array_agg(elem::INTEGER) INTO v_products
    FROM jsonb_array_elements_text(p_data->'valid_product_ids') elem;
  END IF;

  IF p_data ? 'valid_istids' AND p_data->'valid_istids' IS NOT NULL AND jsonb_typeof(p_data->'valid_istids') = 'array' THEN
    SELECT array_agg(elem::TEXT) INTO v_istids
    FROM jsonb_array_elements_text(p_data->'valid_istids') elem;
  END IF;

  v_max_uses := NULLIF(p_data->>'max_uses', '')::INTEGER;
  v_expires := NULLIF(p_data->>'expires_at', '')::TIMESTAMPTZ;
  v_active := COALESCE((p_data->>'active')::BOOLEAN, TRUE);

  INSERT INTO neiist.discount_codes (
    code, discount_type, discount_value, valid_product_ids, valid_istids,
    max_uses, expires_at, active
  ) VALUES (
    v_code, v_type, v_val, NULLIF(v_products, '{}'), NULLIF(v_istids, '{}'),
    v_max_uses, v_expires, v_active
  ) RETURNING id INTO v_id;

  RETURN QUERY SELECT * FROM neiist.discount_codes WHERE id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Discount Code
CREATE OR REPLACE FUNCTION neiist.update_discount_code(
  p_id INTEGER,
  p_data JSONB
) RETURNS SETOF neiist.discount_codes AS $$
DECLARE
  v_products INTEGER[];
  v_istids TEXT[];
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Discount code ID cannot be null';
  END IF;

  IF p_data ? 'valid_product_ids' THEN
    SELECT COALESCE(array_agg(elem::INTEGER), '{}'::INTEGER[]) INTO v_products
    FROM jsonb_array_elements_text(COALESCE(p_data->'valid_product_ids', '[]'::jsonb)) elem;
  END IF;

  IF p_data ? 'valid_istids' THEN
    SELECT COALESCE(array_agg(elem::TEXT), '{}'::TEXT[]) INTO v_istids
    FROM jsonb_array_elements_text(COALESCE(p_data->'valid_istids', '[]'::jsonb)) elem;
  END IF;

  UPDATE neiist.discount_codes dc
  SET
    code = CASE WHEN p_data ? 'code' THEN UPPER(BTRIM(COALESCE(p_data->>'code', dc.code))) ELSE dc.code END,
    discount_type = CASE WHEN p_data ? 'discount_type' THEN (p_data->>'discount_type')::neiist.discount_type_enum ELSE dc.discount_type END,
    discount_value = CASE WHEN p_data ? 'discount_value' THEN ROUND(COALESCE((p_data->>'discount_value')::NUMERIC, dc.discount_value), 2) ELSE dc.discount_value END,
    valid_product_ids = CASE WHEN p_data ? 'valid_product_ids' THEN NULLIF(v_products, '{}') ELSE dc.valid_product_ids END,
    valid_istids = CASE WHEN p_data ? 'valid_istids' THEN NULLIF(v_istids, '{}') ELSE dc.valid_istids END,
    max_uses = CASE WHEN p_data ? 'max_uses' THEN NULLIF(p_data->>'max_uses', '')::INTEGER ELSE dc.max_uses END,
    expires_at = CASE WHEN p_data ? 'expires_at' THEN NULLIF(p_data->>'expires_at', '')::TIMESTAMPTZ ELSE dc.expires_at END,
    active = CASE WHEN p_data ? 'active' THEN (p_data->>'active')::BOOLEAN ELSE dc.active END,
    updated_at = NOW()
  WHERE dc.id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discount code % not found', p_id;
  END IF;

  RETURN QUERY SELECT * FROM neiist.discount_codes WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete discount code
CREATE OR REPLACE FUNCTION neiist.delete_discount_code(
  p_discount_code_id INTEGER
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.discount_codes WHERE id = p_discount_code_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discount code % not found', p_discount_code_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all discount codes
CREATE OR REPLACE FUNCTION neiist.get_all_discount_codes()
RETURNS SETOF neiist.discount_codes AS $$
  SELECT * FROM neiist.discount_codes ORDER BY id DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Validate discount code
CREATE OR REPLACE FUNCTION neiist.validate_discount_code(
  p_code TEXT,
  p_user_istid VARCHAR(10),
  p_cart_items JSONB
) RETURNS TABLE (
  is_valid BOOLEAN,
  discount_code_id INTEGER,
  discount_code TEXT,
  discount_type TEXT,
  discount_value NUMERIC(10,2),
  discount_amount NUMERIC(10,2),
  error TEXT
) AS $$
DECLARE
  v_code TEXT;
  v_discount neiist.discount_codes%ROWTYPE;
  it JSONB;
  v_pid INTEGER;
  v_vid INTEGER;
  v_qty INTEGER;
  v_price NUMERIC(10,2);
  v_modifier NUMERIC(10,2);
  v_unit NUMERIC(10,2);
  v_eligible_total NUMERIC(10,2) := 0;
  v_has_cart BOOLEAN := FALSE;
  v_matching_items BOOLEAN := FALSE;
BEGIN
  v_code := UPPER(BTRIM(COALESCE(p_code, '')));

  IF v_code = '' THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::TEXT, NULL::TEXT, NULL::NUMERIC(10,2), 0::NUMERIC(10,2), 'Discount code is required';
    RETURN;
  END IF;

  SELECT * INTO v_discount
  FROM neiist.discount_codes
  WHERE UPPER(code) = v_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, v_code, NULL::TEXT, NULL::NUMERIC(10,2), 0::NUMERIC(10,2), 'Discount code not found';
    RETURN;
  END IF;

  IF NOT v_discount.active THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not found or inactive';
    RETURN;
  END IF;

  IF v_discount.expires_at IS NOT NULL AND NOW() > v_discount.expires_at THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code expired';
    RETURN;
  END IF;

  IF v_discount.max_uses IS NOT NULL AND v_discount.current_uses >= v_discount.max_uses THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code max uses reached';
    RETURN;
  END IF;

  IF v_discount.valid_istids IS NOT NULL AND COALESCE(array_length(v_discount.valid_istids, 1), 0) > 0 THEN
    IF p_user_istid IS NULL OR NOT EXISTS (
      SELECT 1
      FROM unnest(v_discount.valid_istids) AS allowed_istid
      WHERE LOWER(BTRIM(allowed_istid)) = LOWER(BTRIM(p_user_istid))
    ) THEN
      RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not valid for user';
      RETURN;
    END IF;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(p_cart_items, '[]'::jsonb))
  LOOP
    v_has_cart := TRUE;
    v_pid := (it->>'product_id')::INTEGER;
    v_vid := NULLIF(it->>'variant_id', '')::INTEGER;
    v_qty := COALESCE((it->>'quantity')::INTEGER, 0);

    IF v_qty <= 0 THEN
      RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Invalid quantity in cart';
      RETURN;
    END IF;

    SELECT p.price
      INTO v_price
    FROM neiist.products p
    WHERE p.id = v_pid AND p.active = TRUE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Product not found or inactive';
      RETURN;
    END IF;

    v_unit := ROUND(v_price, 2);

    IF v_vid IS NOT NULL THEN
      SELECT pv.price_modifier
        INTO v_modifier
      FROM neiist.product_variants pv
      WHERE pv.id = v_vid
        AND pv.product_id = v_pid
        AND pv.active = TRUE;

      IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Variant not found or inactive';
        RETURN;
      END IF;

      v_unit := ROUND(v_unit + COALESCE(v_modifier, 0), 2);
    END IF;

    IF v_discount.valid_product_ids IS NULL OR COALESCE(array_length(v_discount.valid_product_ids, 1), 0) = 0 OR v_pid = ANY(v_discount.valid_product_ids) THEN
      v_eligible_total := v_eligible_total + (v_unit * v_qty);
      v_matching_items := TRUE;
    END IF;
  END LOOP;

  IF NOT v_has_cart THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Cart is empty';
    RETURN;
  END IF;

  IF v_discount.valid_product_ids IS NOT NULL AND COALESCE(array_length(v_discount.valid_product_ids, 1), 0) > 0 AND NOT v_matching_items THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not applicable to these products';
    RETURN;
  END IF;

  IF v_discount.discount_type = 'percentage' THEN
    v_eligible_total := ROUND(v_eligible_total * (v_discount.discount_value / 100.0), 2);
  ELSE
    v_eligible_total := ROUND(LEAST(v_eligible_total, v_discount.discount_value), 2);
  END IF;

  IF v_eligible_total <= 0 THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not applicable to these products';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_discount.id, v_discount.code, v_discount.discount_type::TEXT, v_discount.discount_value, v_eligible_total, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Orders by Number or User
CREATE OR REPLACE FUNCTION neiist.get_orders(
  p_order_number TEXT DEFAULT NULL,
  p_user_istid TEXT DEFAULT NULL,
  p_status neiist.shop_order_status_enum DEFAULT NULL
)
RETURNS SETOF neiist.order_record AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.order_number,
    CASE
      WHEN o.user_istid IS NULL THEN COALESCE(o.customer_name, '')
      ELSE COALESCE(u.name, '')
    END AS customer_name,
    o.user_istid,
    CASE
      WHEN o.user_istid IS NULL THEN o.customer_email
      ELSE u.email
    END AS customer_email,
    CASE
      WHEN o.user_istid IS NULL THEN o.customer_phone
      ELSE (
        SELECT c.contact_value
        FROM neiist.user_contacts c
        WHERE c.user_istid = o.user_istid AND c.contact_type = 'phone'
        LIMIT 1
      )
    END AS customer_phone,
    o.nif AS customer_nif,
    o.campus,
    o.pickup_deadline,
    o.notes,
    o.discount_code,
    o.discount_amount,
    o.total_amount,
    o.order_source,
    o.created_by,
    o.created_at,
    o.updated_at,
    o.updated_by,
    neiist.compute_order_status(o.order_number) AS status,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'product_type', p.product_type,
          'event_id', p.event_id,
          'event_hook', p.event_hook,
          'variant_id', oi.variant_id,
          'variant_label', oi.variant_label,
          'variant_options', oi.variant_options,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price,
          'status', oi.status,
          'delivered_at', oi.delivered_at,
          'delivered_by', oi.delivered_by
        )
        ORDER BY oi.id
      ), '[]'::jsonb)
      FROM neiist.order_items oi
      LEFT JOIN neiist.products p ON p.id = oi.product_id
      WHERE oi.order_number = o.order_number
    ) AS items,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'order_number', op.order_number,
          'method', p.method,
          'amount', op.amount,
          'status', p.status,
          'reference', p.reference,
          'paid_at', p.paid_at,
          'received_by', p.received_by,
          'shift_id', p.shift_id,
          'created_at', p.created_at
        )
        ORDER BY p.id
      ), '[]'::jsonb)
      FROM neiist.payments p
      JOIN neiist.order_payments op ON op.payment_id = p.id
      WHERE op.order_number = o.order_number
    ) AS payments
  FROM neiist.orders o
  LEFT JOIN neiist.users u ON u.istid = o.user_istid
  WHERE (p_order_number IS NULL OR o.order_number = p_order_number)
    AND (p_user_istid IS NULL OR o.user_istid = p_user_istid)
    AND (p_status IS NULL OR neiist.compute_order_status(o.order_number) = p_status)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- NEW ORDER
CREATE OR REPLACE FUNCTION neiist.new_order(
  p_order JSONB
) RETURNS SETOF neiist.order_record AS $$
DECLARE
  v_order_number TEXT;
  v_source neiist.sales_channel_enum;
  v_user_istid TEXT;
  v_cust_name TEXT;
  v_cust_email TEXT;
  v_cust_phone TEXT;
  v_nif TEXT;
  v_campus TEXT;
  v_notes TEXT;
  v_discount_code TEXT;
  v_discount_amount NUMERIC(10,2) := 0.00;
  v_discount_result RECORD;
  v_total_amount NUMERIC(10,2) := 0.00;
  v_created_by TEXT;
  v_stock_override BOOLEAN := FALSE;
  it JSONB;
  v_pid INTEGER;
  v_vid INTEGER;
  v_qty INTEGER;
  v_qty_to_decrement INTEGER := 0;
  v_pname TEXT;
  v_base NUMERIC(10,2);
  v_unit NUMERIC(10,2);
  v_line_total NUMERIC(10,2);
  v_stock_type neiist.shop_stock_type_enum;
  v_prod_type neiist.product_type_enum;
  v_channels neiist.sales_channel_enum[];
  v_event_id TEXT;
  v_v_stock INTEGER;
  v_p_stock INTEGER;
  v_v_label TEXT;
  v_v_opts JSONB;
  v_item_deliver BOOLEAN;
  v_item_status neiist.shop_order_status_enum;
  v_pay JSONB;
  v_pay_id INTEGER;
  v_pay_method neiist.payment_method_enum;
  v_pay_amount NUMERIC(10,2);
  v_pay_status neiist.payment_status_enum;
  v_pay_shift_id UUID;
  v_pay_received_by TEXT;
  v_pay_ref TEXT;
  v_order_start TIMESTAMPTZ;
  v_order_deadline TIMESTAMPTZ;
BEGIN
  v_order_number := COALESCE(NULLIF(p_order->>'order_number', ''), neiist.generate_order_number());

  IF EXISTS (SELECT 1 FROM neiist.orders WHERE orders.order_number = v_order_number) THEN
    RETURN QUERY SELECT * FROM neiist.get_orders(v_order_number, NULL, NULL);
    RETURN;
  END IF;

  v_source := COALESCE(NULLIF(p_order->>'order_source', '')::neiist.sales_channel_enum, 'web'::neiist.sales_channel_enum);
  v_user_istid := NULLIF(p_order->>'user_istid', '');
  v_cust_name := CASE WHEN v_user_istid IS NOT NULL THEN NULL ELSE NULLIF(BTRIM(p_order->>'customer_name'), '') END;
  v_cust_email := CASE WHEN v_user_istid IS NOT NULL THEN NULL ELSE NULLIF(BTRIM(p_order->>'customer_email'), '') END;
  v_cust_phone := CASE WHEN v_user_istid IS NOT NULL THEN NULL ELSE NULLIF(BTRIM(p_order->>'customer_phone'), '') END;
  v_nif := NULLIF(p_order->>'customer_nif', '');
  v_campus := NULLIF(p_order->>'campus', '');
  v_notes := NULLIF(p_order->>'notes', '');
  v_discount_code := NULLIF(p_order->>'discount_code', '');
  v_created_by := NULLIF(p_order->>'created_by', '');
  v_stock_override := COALESCE((p_order->>'stock_override')::BOOLEAN, FALSE);

  v_pay := p_order->'payment';
  IF v_pay IS NOT NULL AND (v_pay->>'method' = 'in-person' OR v_pay->>'method' IS NULL) THEN
    v_pay := NULL;
  END IF;

  IF v_pay IS NOT NULL THEN
    v_pay_method := (v_pay->>'method')::neiist.payment_method_enum;
    v_pay_shift_id := NULLIF(v_pay->>'shift_id', '')::UUID;
    v_pay_amount := COALESCE((v_pay->>'amount')::NUMERIC, 0.00);
    v_pay_status := COALESCE((v_pay->>'status')::neiist.payment_status_enum, 'pending');
    v_pay_received_by := NULLIF(v_pay->>'received_by', '');
    v_pay_ref := CASE
      WHEN v_pay_method = 'cash'::neiist.payment_method_enum THEN NULL
      ELSE NULLIF(v_pay->>'reference', '')
    END;

    IF v_pay_method IN ('cash'::neiist.payment_method_enum, 'tpa'::neiist.payment_method_enum) AND v_pay_status = 'successful' THEN
      IF v_pay_shift_id IS NULL THEN
        RAISE EXCEPTION 'shift_id is required for in-person payment method %', v_pay_method;
      END IF;
      PERFORM 1 FROM neiist.pos_shifts WHERE id = v_pay_shift_id AND status = 'open' FOR SHARE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Active shift % not found or closed', v_pay_shift_id;
      END IF;
    ELSIF v_pay_shift_id IS NOT NULL THEN
      PERFORM 1 FROM neiist.pos_shifts WHERE id = v_pay_shift_id AND status = 'open' FOR SHARE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Active shift % not found or closed', v_pay_shift_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO neiist.orders (
    order_number, user_istid, customer_name, customer_email, customer_phone,
    nif, campus, notes, discount_code, discount_amount, total_amount,
    order_source, created_by
  ) VALUES (
    v_order_number, v_user_istid, v_cust_name, v_cust_email, v_cust_phone,
    v_nif, v_campus, v_notes, v_discount_code, v_discount_amount, 0.00,
    v_source, v_created_by
  );

  FOR it IN
    SELECT elem
    FROM jsonb_array_elements(p_order->'items') AS elem
    ORDER BY (elem->>'product_id')::INTEGER NULLS LAST, NULLIF(elem->>'variant_id', '')::INTEGER NULLS FIRST
  LOOP
    v_pid := (it->>'product_id')::INTEGER;
    v_vid := NULLIF(it->>'variant_id', '')::INTEGER;
    v_qty := (it->>'quantity')::INTEGER;
    v_item_deliver := COALESCE((it->>'deliver_now')::BOOLEAN, FALSE);

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product_id %', v_pid;
    END IF;

    SELECT p.name, p.price, p.stock_type, p.product_type, p.channels, p.event_id, p.stock_quantity,
      p.order_start, p.order_deadline
    INTO v_pname, v_base, v_stock_type, v_prod_type, v_channels, v_event_id, v_p_stock,
      v_order_start, v_order_deadline
    FROM neiist.products p
    WHERE p.id = v_pid AND p.active = TRUE;

    IF v_pname IS NULL THEN
      RAISE EXCEPTION 'Product % not found or inactive', v_pid;
    END IF;

    IF NOT v_stock_override THEN
      IF v_order_start IS NOT NULL AND NOW() < v_order_start THEN
        RAISE EXCEPTION 'Orders have not started yet for product %', v_pname;
      END IF;
      IF v_order_deadline IS NOT NULL AND NOW() > v_order_deadline THEN
        RAISE EXCEPTION 'Order deadline has passed for product %', v_pname;
      END IF;
    END IF;

    IF NOT (v_source = ANY(v_channels)) AND NOT (v_source = 'pos'::neiist.sales_channel_enum AND 'pos'::neiist.sales_channel_enum = ANY(v_channels)) THEN
      RAISE EXCEPTION 'Product % is not available on channel %', v_pname, v_source;
    END IF;

    IF v_source = 'fast-pos'::neiist.sales_channel_enum AND v_stock_type <> 'untracked' THEN
      RAISE EXCEPTION 'Only untracked products can be sold on fast-pos: %', v_pname;
    END IF;

    v_unit := v_base;
    v_v_label := NULL;
    v_v_opts := '{}'::jsonb;

    IF v_vid IS NOT NULL THEN
      SELECT pv.price_modifier, pv.stock_quantity,
        (SELECT string_agg(pvo.option_name || ': ' || pvo.option_value, ' | ' ORDER BY pvo.option_name)
         FROM neiist.product_variant_options pvo WHERE pvo.variant_id = pv.id),
        (SELECT jsonb_object_agg(pvo.option_name, pvo.option_value)
         FROM neiist.product_variant_options pvo WHERE pvo.variant_id = pv.id)
      INTO v_unit, v_v_stock, v_v_label, v_v_opts
      FROM neiist.product_variants pv
      WHERE pv.id = v_vid AND pv.product_id = v_pid AND pv.active = TRUE
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant % for product % not found or inactive', v_vid, v_pid;
      END IF;

      v_unit := ROUND(v_base + COALESCE(v_unit, 0.00), 2);

      IF v_stock_type = 'limited' THEN
        IF NOT v_stock_override THEN
          IF v_v_stock IS NULL OR v_v_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient variant stock for %: have %, requested %', v_pname, v_v_stock, v_qty;
          END IF;
          v_qty_to_decrement := v_qty;
        ELSE
          v_qty_to_decrement := GREATEST(0, LEAST(COALESCE(v_v_stock, 0), v_qty));
        END IF;

        IF v_qty_to_decrement > 0 THEN
          UPDATE neiist.product_variants
          SET stock_quantity = GREATEST(0, stock_quantity - v_qty_to_decrement), updated_at = NOW()
          WHERE id = v_vid;
        END IF;
      ELSE
        v_qty_to_decrement := 0;
      END IF;
    ELSE
      IF v_stock_type = 'limited' THEN
        SELECT stock_quantity INTO v_p_stock FROM neiist.products WHERE id = v_pid FOR UPDATE;
        IF NOT v_stock_override THEN
          IF v_p_stock IS NULL OR v_p_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient product stock for %: have %, requested %', v_pname, v_p_stock, v_qty;
          END IF;
          v_qty_to_decrement := v_qty;
        ELSE
          v_qty_to_decrement := GREATEST(0, LEAST(COALESCE(v_p_stock, 0), v_qty));
        END IF;

        IF v_qty_to_decrement > 0 THEN
          UPDATE neiist.products
          SET stock_quantity = GREATEST(0, stock_quantity - v_qty_to_decrement)
          WHERE id = v_pid;
        END IF;
      ELSE
        v_qty_to_decrement := 0;
      END IF;
    END IF;

    v_line_total := ROUND(v_unit * v_qty, 2);
    v_total_amount := v_total_amount + v_line_total;

    IF v_source = 'fast-pos'::neiist.sales_channel_enum OR v_item_deliver THEN
      v_item_status := 'delivered';
    ELSIF v_pay_status = 'successful' THEN
      v_item_status := 'paid';
    ELSE
      v_item_status := 'pending';
    END IF;

    INSERT INTO neiist.order_items (
      order_number, product_id, variant_id, product_name, variant_label,
      variant_options, quantity, unit_price, total_price, status,
      stock_decremented, delivered_at, delivered_by
    ) VALUES (
      v_order_number, v_pid, v_vid, v_pname, v_v_label,
      v_v_opts, v_qty, v_unit, v_line_total, v_item_status,
      v_qty_to_decrement,
      CASE WHEN v_item_status = 'delivered' THEN NOW() END,
      CASE WHEN v_item_status = 'delivered' THEN v_created_by END
    );
  END LOOP;

  IF v_discount_code IS NOT NULL THEN
    SELECT * INTO v_discount_result
    FROM neiist.validate_discount_code(v_discount_code, v_user_istid, p_order->'items');

    IF NOT COALESCE(v_discount_result.is_valid, FALSE) THEN
      RAISE EXCEPTION '%', COALESCE(v_discount_result.error, 'Invalid discount code');
    END IF;

    UPDATE neiist.discount_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = v_discount_result.discount_code_id
      AND active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_uses IS NULL OR current_uses < max_uses)
    RETURNING code INTO v_discount_code;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Discount code max uses reached';
    END IF;

    v_discount_amount := LEAST(v_total_amount, COALESCE(v_discount_result.discount_amount, 0.00));
  END IF;

  v_total_amount := GREATEST(0.00, v_total_amount - v_discount_amount);

  UPDATE neiist.orders
  SET discount_amount = v_discount_amount,
      total_amount = v_total_amount
  WHERE orders.order_number = v_order_number;

  IF v_pay IS NOT NULL AND v_total_amount > 0 THEN
    INSERT INTO neiist.payments (
      method, status, reference, paid_at, received_by, shift_id
    ) VALUES (
      v_pay_method, v_pay_status, v_pay_ref,
      CASE WHEN v_pay_status = 'successful' THEN NOW() END,
      v_pay_received_by, v_pay_shift_id
    ) RETURNING id INTO v_pay_id;

    INSERT INTO neiist.order_payments (payment_id, order_number, amount)
    VALUES (v_pay_id, v_order_number, v_total_amount);
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_orders(v_order_number, NULL, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all available product categories
CREATE OR REPLACE FUNCTION neiist.get_all_categories()
RETURNS TABLE (
  id INTEGER,
  name TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT c.id, c.name FROM neiist.categories c ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper for LISTEN
CREATE OR REPLACE FUNCTION neiist.listen_voting_updates()
RETURNS VOID AS $$
BEGIN
  EXECUTE 'LISTEN voting_update';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- GET USER MEMBERSHIPS
CREATE OR REPLACE FUNCTION neiist.get_user_memberships(
  p_istid VARCHAR(10),
  p_active_only BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  user_istid VARCHAR(10),
  user_name TEXT,
  department_name TEXT,
  department_type TEXT,
  role_name TEXT,
  from_date DATE,
  to_date DATE,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.user_istid,
    u.name AS user_name,
    m.department_name::TEXT,
    d.department_type::TEXT,
    m.role_name::TEXT,
    m.from_date,
    m.to_date,
    (m.to_date IS NULL OR m.to_date >= CURRENT_DATE) AS active
  FROM neiist.membership m
  JOIN neiist.users u ON m.user_istid = u.istid
  LEFT JOIN neiist.departments d ON m.department_name = d.name
  WHERE m.user_istid = p_istid
    AND (NOT p_active_only OR (m.to_date IS NULL OR m.to_date >= CURRENT_DATE))
  ORDER BY m.from_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET BATCH DEPARTMENT ROLE ORDERS
CREATE OR REPLACE FUNCTION neiist.get_department_role_orders(p_departments TEXT[])
RETURNS TABLE (
  department_name TEXT,
  role_name TEXT,
  "position" INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT dro.department_name::TEXT, dro.role_name::TEXT, dro.position
  FROM neiist.department_role_order dro
  WHERE dro.department_name = ANY(p_departments)
  ORDER BY dro.department_name, dro.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DELETE USER
CREATE OR REPLACE FUNCTION neiist.delete_user(p_istid VARCHAR(10))
RETURNS TABLE(success BOOLEAN, was_member BOOLEAN) AS $$
DECLARE
  v_is_member BOOLEAN;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = p_istid) THEN
    RETURN QUERY SELECT FALSE, FALSE;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM neiist.membership WHERE user_istid = p_istid
  ) INTO v_is_member;

  DELETE FROM neiist.user_contacts WHERE user_istid = p_istid;
  DELETE FROM neiist.user_courses WHERE user_istid = p_istid;
  DELETE FROM neiist.email_token WHERE istid = p_istid;
  DELETE FROM neiist.activities_sign_up WHERE user_istid = p_istid;
  DELETE FROM neiist.game_score WHERE user_istid = p_istid;

  UPDATE neiist.orders o
  SET user_istid = NULL,
    customer_name = u.name,
    customer_email = u.email,
    customer_phone = NULL
  FROM neiist.users u
  WHERE o.user_istid = p_istid AND u.istid = p_istid;

  IF v_is_member THEN
    UPDATE neiist.users
    SET email = 'deleted-' || gen_random_uuid() || '@deleted.neiist.pt',
      github = NULL,
      linkedin = NULL
    WHERE istid = p_istid;
  ELSE
    DELETE FROM neiist.users WHERE istid = p_istid;
  END IF;

  RETURN QUERY SELECT TRUE, v_is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- REMOVE DELETED USER ORDERS (GDPR 10 YEAR RETENTION)
CREATE OR REPLACE FUNCTION neiist.remove_deleted_user_orders_pii()
RETURNS VOID AS $$
BEGIN
  UPDATE neiist.orders
  SET customer_name = 'Guest',
    customer_email = 'deleted-' || gen_random_uuid() || '@deleted.neiist.pt',
    customer_phone = NULL,
    nif = NULL
  WHERE user_istid IS NULL
    AND created_at < NOW() - INTERVAL '10 years'
    AND customer_name IS DISTINCT FROM 'Guest';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get department display order
CREATE OR REPLACE FUNCTION neiist.get_department_display_order()
RETURNS TABLE (
  name TEXT,
  department_type TEXT,
  active BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.name::TEXT, d.department_type::TEXT, d.active, d.display_order
  FROM neiist.departments d
  ORDER BY d.display_order, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set department display order
CREATE OR REPLACE FUNCTION neiist.set_department_display_order(p_departments TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  dept_name TEXT;
  idx INT := 1;
BEGIN
  FOREACH dept_name IN ARRAY p_departments
  LOOP
    UPDATE neiist.departments SET display_order = idx WHERE name = dept_name;
    idx := idx + 1;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compute Order Status function
CREATE OR REPLACE FUNCTION neiist.compute_order_status(p_order_number TEXT)
RETURNS neiist.shop_order_status_enum LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE
    WHEN bool_and(status = 'cancelled') THEN 'cancelled'
    WHEN bool_and(status IN ('delivered','cancelled')) THEN 'delivered'
    WHEN bool_and(status IN ('ready','delivered','cancelled')) THEN 'ready'
    WHEN bool_or (status = 'pending') THEN 'pending'
    ELSE 'paid'
  END::neiist.shop_order_status_enum
  FROM neiist.order_items 
  WHERE order_number = p_order_number;
$$;

-- Settle Orders
CREATE OR REPLACE FUNCTION neiist.settle_orders(
  p_order_numbers TEXT[],
  p_method neiist.payment_method_enum,
  p_shift_id UUID DEFAULT NULL,
  p_by TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL
) RETURNS SETOF neiist.order_record LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_payment_id INTEGER;
  v_ord TEXT;
  v_current_status neiist.shop_order_status_enum;
  v_pending_orders TEXT[] := '{}';
  v_single_pending_payment_id INTEGER;
  v_batch_total NUMERIC(10,2) := 0.00;
  v_effective_ref TEXT;
BEGIN
  IF p_order_numbers IS NULL OR cardinality(p_order_numbers) = 0 THEN
    RAISE EXCEPTION 'At least one order number is required';
  END IF;

  -- Deduplicate order numbers deterministically
  SELECT array_agg(DISTINCT x ORDER BY x) INTO p_order_numbers FROM unnest(p_order_numbers) AS x;

  IF p_method IN ('cash'::neiist.payment_method_enum, 'tpa'::neiist.payment_method_enum) AND p_shift_id IS NULL THEN
    RAISE EXCEPTION '% payment requires an active POS shift', p_method;
  END IF;

  IF p_shift_id IS NOT NULL THEN
    PERFORM 1 FROM neiist.pos_shifts WHERE id = p_shift_id AND status = 'open' FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Active shift % not found or closed', p_shift_id;
    END IF;
  END IF;

  -- Verify every requested order number exists
  FOREACH v_ord IN ARRAY p_order_numbers LOOP
    IF NOT EXISTS (SELECT 1 FROM neiist.orders WHERE order_number = v_ord) THEN
      RAISE EXCEPTION 'Order % not found', v_ord;
    END IF;
  END LOOP;

  -- Lock matching orders in deterministic order to prevent deadlocks
  PERFORM 1
  FROM neiist.orders
  WHERE order_number = ANY(p_order_numbers)
  ORDER BY order_number
  FOR UPDATE;

  -- Verify not canceled/refunded and process already settled orders
  FOREACH v_ord IN ARRAY p_order_numbers LOOP
    SELECT neiist.compute_order_status(v_ord) INTO v_current_status;
    IF v_current_status = 'cancelled' THEN
      RAISE EXCEPTION 'Order % is % and cannot be settled', v_ord, v_current_status;
    END IF;

    IF v_current_status IN ('paid', 'ready', 'delivered') THEN
      IF p_shift_id IS NOT NULL THEN
        UPDATE neiist.payments
        SET shift_id = p_shift_id
        WHERE id IN (
          SELECT payment_id FROM neiist.order_payments WHERE order_number = v_ord
        ) AND shift_id IS NULL;
      END IF;
    ELSE
      v_pending_orders := array_append(v_pending_orders, v_ord);
    END IF;
  END LOOP;

  -- Settle remaining pending orders
  v_effective_ref := CASE WHEN p_method = 'cash' THEN NULL ELSE NULLIF(p_reference, '') END;

  IF cardinality(v_pending_orders) > 0 THEN
    SELECT COALESCE(SUM(total_amount), 0.00) INTO v_batch_total
    FROM neiist.orders
    WHERE order_number = ANY(v_pending_orders);

    IF v_batch_total > 0 THEN
      IF cardinality(v_pending_orders) = 1 THEN
        SELECT p.id INTO v_single_pending_payment_id
        FROM neiist.payments p
        JOIN neiist.order_payments op ON op.payment_id = p.id
        WHERE op.order_number = v_pending_orders[1] AND p.status = 'pending'
        ORDER BY p.id
        LIMIT 1
        FOR UPDATE OF p;
      END IF;

      IF v_single_pending_payment_id IS NOT NULL THEN
        UPDATE neiist.payments
        SET method = p_method,
          status = 'successful',
          reference = v_effective_ref,
          paid_at = NOW(),
          received_by = p_by,
          shift_id = p_shift_id
        WHERE id = v_single_pending_payment_id;
        v_payment_id := v_single_pending_payment_id;
      ELSE
        INSERT INTO neiist.payments (
          method, status, reference, paid_at, received_by, shift_id
        ) VALUES (
          p_method, 'successful', v_effective_ref, NOW(), p_by, p_shift_id
        ) RETURNING id INTO v_payment_id;
      END IF;
    END IF;

    FOREACH v_ord IN ARRAY v_pending_orders LOOP
      IF v_batch_total > 0 THEN
        IF v_single_pending_payment_id IS NULL THEN
          DELETE FROM neiist.payments
          WHERE id IN (
            SELECT op.payment_id FROM neiist.order_payments op WHERE op.order_number = v_ord
          ) AND status = 'pending';

          INSERT INTO neiist.order_payments (payment_id, order_number, amount)
          SELECT v_payment_id, v_ord, total_amount
          FROM neiist.orders WHERE orders.order_number = v_ord AND total_amount > 0;
        ELSE
          UPDATE neiist.order_payments
          SET amount = orders.total_amount
          FROM neiist.orders
          WHERE neiist.order_payments.payment_id = v_payment_id
            AND neiist.order_payments.order_number = v_ord
            AND orders.order_number = v_ord;
        END IF;
      END IF;

      UPDATE neiist.order_items
      SET status = 'paid',
        updated_at = NOW()
      WHERE order_items.order_number = v_ord AND order_items.status = 'pending';

      UPDATE neiist.orders
      SET order_source = CASE WHEN p_shift_id IS NOT NULL THEN 'pos'::neiist.sales_channel_enum ELSE order_source END,
        updated_at = NOW(),
        updated_by = p_by
      WHERE orders.order_number = v_ord;
    END LOOP;
  END IF;

  FOREACH v_ord IN ARRAY p_order_numbers LOOP
    RETURN QUERY SELECT * FROM neiist.get_orders(v_ord, NULL, NULL);
  END LOOP;
END;
$$;


-- Get POS Station
CREATE OR REPLACE FUNCTION neiist.get_pos_stations(p_id UUID DEFAULT NULL)
RETURNS SETOF neiist.pos_stations LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM neiist.pos_stations
  WHERE (p_id IS NULL OR id = p_id)
  ORDER BY name;
$$;

-- Create POS Station
CREATE OR REPLACE FUNCTION neiist.create_pos_station(
  p_name TEXT,
  p_location TEXT,
  p_active BOOLEAN DEFAULT TRUE
) RETURNS SETOF neiist.pos_stations LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  INSERT INTO neiist.pos_stations (name, location, active)
  VALUES (p_name, p_location, COALESCE(p_active, TRUE))
  RETURNING *;
END;
$$;

-- Update POS Station
CREATE OR REPLACE FUNCTION neiist.update_pos_station(
  p_id UUID,
  p_name TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL
) RETURNS SETOF neiist.pos_stations LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Station ID cannot be null';
  END IF;

  RETURN QUERY
  UPDATE neiist.pos_stations
  SET name = COALESCE(p_name, name),
    location = COALESCE(p_location, location),
    active = COALESCE(p_active, active)
  WHERE id = p_id
  RETURNING *;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Station % not found', p_id;
  END IF;
END;
$$;

-- Get Pos Shifts by ID os Station
CREATE OR REPLACE FUNCTION neiist.get_pos_shifts(
  p_shift_id UUID DEFAULT NULL,
  p_station_id UUID DEFAULT NULL,
  p_status neiist.pos_shift_status_enum DEFAULT NULL,
  p_limit INT DEFAULT NULL
)
RETURNS SETOF neiist.pos_shift_record LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT s.id,
    s.station_id,
    s.opened_by,
    s.closed_by,
    s.initial_float,
    s.final_cash_counted,
    ROUND(s.initial_float + COALESCE(cash.total, 0.00), 2) AS expected_cash,
    CASE
      WHEN s.final_cash_counted IS NOT NULL
      THEN ROUND(s.final_cash_counted - (s.initial_float + COALESCE(cash.total, 0.00)), 2)
    END AS cash_variance,
    s.status,
    s.opened_at,
    s.closed_at,
    st.name AS station_name,
    st.location AS station_location,
    COALESCE(u_open.name, s.opened_by) AS opened_by_name,
    COALESCE(u_close.name, s.closed_by) AS closed_by_name
  FROM neiist.pos_shifts s
  JOIN neiist.pos_stations st ON st.id = s.station_id
  LEFT JOIN neiist.users u_open ON u_open.istid = s.opened_by
  LEFT JOIN neiist.users u_close ON u_close.istid = s.closed_by
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(op.amount), 0.00) AS total
    FROM neiist.payments p
    JOIN neiist.order_payments op ON op.payment_id = p.id
    WHERE p.shift_id = s.id AND p.method = 'cash' AND p.status = 'successful'
  ) cash ON TRUE
  WHERE (p_shift_id IS NULL OR s.id = p_shift_id)
    AND (p_station_id IS NULL OR s.station_id = p_station_id)
    AND (p_status IS NULL OR s.status = p_status)
  ORDER BY s.opened_at DESC
  LIMIT p_limit;
END;
$$;

-- Open Shift (returns SETOF pos_shift_record)
CREATE OR REPLACE FUNCTION neiist.open_pos_shift(
  p_station_id UUID,
  p_opened_by TEXT,
  p_initial_float NUMERIC(10,2)
) RETURNS SETOF neiist.pos_shift_record LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_shift_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.pos_stations WHERE id = p_station_id AND active = true) THEN
    RAISE EXCEPTION 'Station not found or inactive';
  END IF;

  IF EXISTS (SELECT 1 FROM neiist.pos_shifts WHERE opened_by = p_opened_by AND status = 'open') THEN
    RAISE EXCEPTION 'User % already has an open shift', p_opened_by;
  END IF;

  INSERT INTO neiist.pos_shifts (
    station_id,
    opened_by,
    initial_float,
    status
  ) VALUES (
    p_station_id,
    p_opened_by,
    p_initial_float,
    'open'
  ) RETURNING id INTO v_shift_id;

  RETURN QUERY SELECT * FROM neiist.get_pos_shifts(v_shift_id, NULL, NULL, 1);
END;
$$;

-- Close Shift (returns SETOF pos_shift_record)
CREATE OR REPLACE FUNCTION neiist.close_pos_shift(
  p_shift_id UUID,
  p_final_cash_counted NUMERIC(10,2),
  p_closed_by TEXT
) RETURNS SETOF neiist.pos_shift_record LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE neiist.pos_shifts
  SET final_cash_counted = p_final_cash_counted,
    status = 'closed',
    closed_by = p_closed_by,
    closed_at = NOW()
  WHERE id = p_shift_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift % not found or already closed', p_shift_id;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_pos_shifts(p_shift_id, NULL, NULL, 1);
END;
$$;

CREATE OR REPLACE FUNCTION neiist.get_order_item(p_item_id INT)
RETURNS SETOF neiist.order_items LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM neiist.order_items
  WHERE id = p_item_id;
$$;

CREATE OR REPLACE FUNCTION neiist.assert_item_transition(
  p_old neiist.shop_order_status_enum,
  p_new neiist.shop_order_status_enum
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF p_old = p_new THEN
    RETURN;
  END IF;

  IF p_old = 'cancelled'::neiist.shop_order_status_enum THEN
    RAISE EXCEPTION 'Cannot transition cancelled item to %', p_new USING ERRCODE = '22023';
  END IF;

  IF p_old = 'delivered'::neiist.shop_order_status_enum THEN
    RAISE EXCEPTION 'Cannot transition delivered item to %', p_new USING ERRCODE = '22023';
  END IF;

  IF p_old = 'ready'::neiist.shop_order_status_enum AND p_new NOT IN ('delivered'::neiist.shop_order_status_enum, 'cancelled'::neiist.shop_order_status_enum) THEN
    RAISE EXCEPTION 'Invalid transition from ready to %', p_new USING ERRCODE = '22023';
  END IF;

  IF p_old = 'paid'::neiist.shop_order_status_enum AND p_new = 'pending'::neiist.shop_order_status_enum THEN
    RAISE EXCEPTION 'Cannot transition paid item back to pending' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION neiist.set_order_items_status(
  p_item_ids INT[],
  p_status neiist.shop_order_status_enum,
  p_user_istid TEXT DEFAULT NULL
) RETURNS TABLE (
  order_number TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ord TEXT;
  r RECORD;
BEGIN
  IF p_item_ids IS NULL OR cardinality(p_item_ids) = 0 THEN
    RETURN;
  END IF;

  FOR r IN (
    SELECT id, status FROM neiist.order_items WHERE id = ANY(p_item_ids)
  ) LOOP
    PERFORM neiist.assert_item_transition(r.status, p_status);
  END LOOP;

  UPDATE neiist.order_items
  SET status = p_status,
      delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
      delivered_by = CASE WHEN p_status = 'delivered' THEN p_user_istid ELSE delivered_by END,
      updated_at = NOW()
  WHERE id = ANY(p_item_ids);

  FOR v_ord IN
    SELECT DISTINCT order_items.order_number FROM neiist.order_items WHERE id = ANY(p_item_ids)
  LOOP
    UPDATE neiist.orders
    SET updated_at = NOW(),
        updated_by = p_user_istid
    WHERE orders.order_number = v_ord;

    order_number := v_ord;
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION neiist.cancel_order(
  p_order_number TEXT,
  p_user_istid TEXT DEFAULT NULL,
  p_only_if_pending BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_status neiist.shop_order_status_enum;
BEGIN
  PERFORM 1 FROM neiist.orders WHERE order_number = p_order_number FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_number;
  END IF;

  SELECT neiist.compute_order_status(p_order_number) INTO v_current_status;
  IF p_only_if_pending AND v_current_status <> 'pending' THEN
    RETURN FALSE;
  END IF;

  UPDATE neiist.order_items
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE order_number = p_order_number
    AND status <> 'cancelled';

  UPDATE neiist.payments p
  SET status = 'failed'
  FROM neiist.order_payments op
  WHERE op.payment_id = p.id
    AND op.order_number = p_order_number
    AND p.status = 'pending';

  UPDATE neiist.orders
  SET updated_at = NOW(),
      updated_by = COALESCE(p_user_istid, 'system-expiry')
  WHERE order_number = p_order_number;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION neiist.update_order_details(
  p_order_number TEXT,
  p_updates JSONB,
  p_user_istid TEXT DEFAULT NULL
) RETURNS SETOF neiist.order_record LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE neiist.orders
  SET customer_name = CASE WHEN p_updates ? 'customer_name' THEN NULLIF(BTRIM(p_updates->>'customer_name'), '') ELSE customer_name END,
    customer_email = CASE WHEN p_updates ? 'customer_email' THEN NULLIF(BTRIM(p_updates->>'customer_email'), '') ELSE customer_email END,
    customer_phone = CASE WHEN p_updates ? 'customer_phone' THEN NULLIF(BTRIM(p_updates->>'customer_phone'), '') ELSE customer_phone END,
    nif = CASE WHEN p_updates ? 'customer_nif' THEN NULLIF(BTRIM(p_updates->>'customer_nif'), '')
      WHEN p_updates ? 'nif' THEN NULLIF(BTRIM(p_updates->>'nif'), '')
      ELSE nif END,
    campus = CASE WHEN p_updates ? 'campus' THEN NULLIF(BTRIM(p_updates->>'campus'), '') ELSE campus END,
    notes = CASE WHEN p_updates ? 'notes' THEN NULLIF(BTRIM(p_updates->>'notes'), '') ELSE notes END,
    updated_at = NOW(),
    updated_by = p_user_istid
  WHERE order_number = p_order_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_number;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_orders(p_order_number, NULL, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION neiist.update_order_payment(
  p_order_number TEXT,
  p_method neiist.payment_method_enum,
  p_reference TEXT DEFAULT NULL,
  p_user_istid TEXT DEFAULT NULL
) RETURNS SETOF neiist.order_record LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ref TEXT := NULLIF(BTRIM(COALESCE(p_reference, '')), '');
  v_payment_id INTEGER;
BEGIN
  UPDATE neiist.payments p
  SET method = COALESCE(p_method, p.method),
    reference = COALESCE(v_ref, p.reference)
  FROM neiist.order_payments op
  WHERE op.payment_id = p.id
    AND op.order_number = p_order_number
    AND p.status = 'pending';

  IF NOT FOUND AND p_method IS NOT NULL THEN
    INSERT INTO neiist.payments (method, status, reference)
    VALUES (p_method, 'pending', v_ref)
    RETURNING id INTO v_payment_id;

    INSERT INTO neiist.order_payments (payment_id, order_number, amount)
    SELECT v_payment_id, p_order_number, total_amount
    FROM neiist.orders WHERE order_number = p_order_number;
  END IF;

  UPDATE neiist.orders
  SET updated_at = NOW(),
    updated_by = p_user_istid
  WHERE order_number = p_order_number;

  RETURN QUERY SELECT * FROM neiist.get_orders(p_order_number, NULL, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION neiist.get_user_ordered_products_in_category(
  p_user_istid VARCHAR(10),
  p_category_name TEXT
) RETURNS TABLE(product_id INTEGER, total INTEGER) AS $$
  SELECT oi.product_id, SUM(oi.quantity)::INT AS total
  FROM neiist.order_items oi
  JOIN neiist.orders o ON oi.order_number = o.order_number
  JOIN neiist.products p ON oi.product_id = p.id
  JOIN neiist.categories c ON p.category_id = c.id
  WHERE o.user_istid = p_user_istid
    AND oi.status <> 'cancelled'
    AND lower(c.name) = lower(p_category_name)
  GROUP BY oi.product_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get Campus Schedule Slots
CREATE OR REPLACE FUNCTION neiist.get_campus_schedule_slots(
  p_campus TEXT DEFAULT NULL
) RETURNS TABLE (
  id INT,
  campus VARCHAR(20),
  day_of_week INT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT s.id, s.campus, s.day_of_week, s.start_time, s.end_time, s.created_at, s.updated_at
  FROM neiist.campus_schedule_slots s
  WHERE (p_campus IS NULL OR s.campus = p_campus)
  ORDER BY s.campus, s.day_of_week, s.start_time;
$$;

-- Add Campus Schedule Slots
CREATE OR REPLACE FUNCTION neiist.add_campus_schedule_slot(
  p_campus TEXT,
  p_day_of_week INT,
  p_start_time TIME,
  p_end_time TIME
) RETURNS TABLE (
  id INT,
  campus VARCHAR(20),
  day_of_week INT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  INSERT INTO neiist.campus_schedule_slots (campus, day_of_week, start_time, end_time)
  VALUES (p_campus, p_day_of_week, p_start_time, p_end_time)
  RETURNING neiist.campus_schedule_slots.id,
    neiist.campus_schedule_slots.campus,
    neiist.campus_schedule_slots.day_of_week,
    neiist.campus_schedule_slots.start_time,
    neiist.campus_schedule_slots.end_time,
    neiist.campus_schedule_slots.created_at,
    neiist.campus_schedule_slots.updated_at;
END;
$$;

-- Delete Campus Schedule Slots
CREATE OR REPLACE FUNCTION neiist.delete_campus_schedule_slot(
  p_id INT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM neiist.campus_schedule_slots WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- Get Game Best Score for User
CREATE OR REPLACE FUNCTION neiist.get_game_best_score(
  p_user_istid VARCHAR(10)
) RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT best_score FROM neiist.game_score WHERE user_istid = p_user_istid),
    0
  );
$$;

-- Submit Game Best Score
CREATE OR REPLACE FUNCTION neiist.submit_game_score(
  p_user_istid VARCHAR(10),
  p_score INT
) RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO neiist.game_score (user_istid, best_score)
  VALUES (p_user_istid, p_score)
  ON CONFLICT (user_istid) DO UPDATE
    SET best_score = EXCLUDED.best_score,
        updated_at = NOW()
    WHERE EXCLUDED.best_score > neiist.game_score.best_score;

  RETURN neiist.get_game_best_score(p_user_istid);
END;
$$;

-- Only necessary permissions to specific read only user
GRANT EXECUTE ON FUNCTION neiist.get_products(INTEGER, neiist.sales_channel_enum, BOOLEAN) TO neiist_readonly;
GRANT EXECUTE ON FUNCTION neiist.get_all_categories() TO neiist_readonly;
