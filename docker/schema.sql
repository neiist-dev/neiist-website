-- TODO: Add blog tables. Add getter functions.

-- SCHEMA
CREATE SCHEMA IF NOT EXISTS neiist;

-- ROLES
CREATE ROLE neiist_app_user WITH LOGIN PASSWORD 'neiist_app_user_password';

-- PERMISSIONS
GRANT USAGE ON SCHEMA neiist TO neiist_app_user;
REVOKE ALL ON ALL TABLES IN SCHEMA neiist FROM neiist_app_user;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA neiist FROM neiist_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA neiist TO neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist GRANT EXECUTE ON FUNCTIONS TO neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON TABLES FROM neiist_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA neiist REVOKE ALL ON SEQUENCES FROM neiist_app_user;

-- ENUM TYPES
CREATE TYPE neiist.user_access_enum AS ENUM (
  'admin',
  'coordinator',
  'shop_manager',
  'member'
);

CREATE TYPE neiist.contact_method_enum AS ENUM (
  'email',
  'alt_email',
  'phone'
);

 CREATE TYPE neiist.shop_stock_type_enum AS ENUM (
  'limited',
  'on_demand'
);

CREATE TYPE neiist.shop_order_status_enum AS ENUM (
  'pending',
  'paid',
  'ready',
  'delivered',
  'cancelled'
);

-- USERS TABLE
CREATE TABLE neiist.users (
  istid VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  github TEXT,
  linkedin TEXT,
  photo_path TEXT
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
  name VARCHAR(30) PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  department_type VARCHAR(20) CHECK (department_type IN ('team', 'admin_body'))
);

-- TEAMS TABLE
CREATE TABLE neiist.teams (
  name VARCHAR(30) PRIMARY KEY REFERENCES neiist.departments(name),
  description TEXT
);

-- ADMINISTRATION BODIES TABLE
CREATE TABLE neiist.admin_bodies (
  name VARCHAR(30) PRIMARY KEY REFERENCES neiist.departments(name)
);

-- VALID (DEPARTMENT | ROLE) COMBINATIONS TABLE
CREATE TABLE neiist.valid_department_roles (
  department_name VARCHAR(30) REFERENCES neiist.departments(name),
  role_name VARCHAR(40) NOT NULL,
  PRIMARY KEY (department_name, role_name),
  access neiist.user_access_enum NOT NULL DEFAULT 'member',
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- MEMBERSHIP TABLE
CREATE TABLE neiist.membership (
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  department_name VARCHAR(30) NOT NULL,
  role_name VARCHAR(40) NOT NULL,
  from_date DATE NOT NULL DEFAULT CURRENT_DATE,
  to_date DATE DEFAULT NULL,
  FOREIGN KEY (department_name, role_name)
    REFERENCES neiist.valid_department_roles(department_name, role_name),
  CONSTRAINT valid_member_dates CHECK (to_date IS NULL OR to_date > from_date),
  PRIMARY KEY (user_istid, department_name, role_name)
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

-- Ensure perfomance to calculate the access level of a user
CREATE INDEX idx_membership_active ON neiist.membership (user_istid, to_date)
WHERE to_date IS NULL;
CREATE INDEX idx_membership_to_date ON neiist.membership (to_date)
WHERE to_date IS NOT NULL;

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EVENT SUBSCRIPTIONS
CREATE TABLE neiist.activities_sign_up (
  event_id TEXT NOT NULL REFERENCES neiist.activities(id),
  user_istid VARCHAR(10) NOT NULL REFERENCES neiist.users(istid),
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_istid)
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VOTING NOMINEES
CREATE TABLE neiist.voting_nominees (
  session_id INTEGER NOT NULL REFERENCES neiist.voting_sessions(id) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL,
  PRIMARY KEY (session_id, nominee_id)
);

-- CAST VOTES
CREATE TABLE neiist.votes (
  session_id INTEGER NOT NULL REFERENCES neiist.voting_sessions(id) ON DELETE CASCADE,
  voter_istid VARCHAR(10) NOT NULL REFERENCES neiist.users(istid) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, voter_istid)
);

-- VOTE RESULTS (Frozen tally)
CREATE TABLE neiist.voting_results (
  session_id INTEGER NOT NULL REFERENCES neiist.voting_sessions(id) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL,
  vote_count BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, nominee_id),
  FOREIGN KEY (session_id, nominee_id) REFERENCES neiist.voting_nominees(session_id, nominee_id) ON DELETE CASCADE
);

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
AFTER INSERT OR UPDATE OF status, start_at, end_at, name, description, updated_at ON neiist.voting_sessions
FOR EACH ROW
EXECUTE FUNCTION neiist.notify_voting_session_change();

-- SHOP CATEGORIES
CREATE TABLE neiist.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE neiist.discount_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
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
  stock_type neiist.shop_stock_type_enum NOT NULL,
  stock_quantity INTEGER,
  order_deadline TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_products_stock
    CHECK (
      (stock_type = 'limited' AND (stock_quantity IS NULL OR stock_quantity >= 0))
      OR (stock_type = 'on_demand')
    )
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
CREATE INDEX idx_variant_options_name ON neiist.product_variant_options(option_name);

-- ORDER NUMBER GENERATOR
CREATE SEQUENCE neiist.order_sequence;

CREATE OR REPLACE FUNCTION neiist.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN to_char(clock_timestamp(), 'YYYYMMDD') || to_char(nextval('neiist.order_sequence'), 'FM999999');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ORDERS
CREATE TABLE neiist.orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT neiist.generate_order_number(),
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
  payment_method TEXT,
  payment_reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pickup_deadline TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_checked_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  status neiist.shop_order_status_enum NOT NULL DEFAULT 'pending',
  CONSTRAINT orders_identity_mode_chk CHECK (
    user_istid IS NULL
    OR (customer_name IS NULL AND customer_email IS NULL AND customer_phone IS NULL)
  )
);

CREATE TABLE neiist.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES neiist.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES neiist.products(id) ON DELETE SET NULL,
  variant_id INTEGER REFERENCES neiist.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT,
  variant_options JSONB,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

-- Index for better search performance of products on orders
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON neiist.order_items(product_id);

-- Index to speed up lookups by user on orders
CREATE INDEX IF NOT EXISTS idx_orders_user_istid ON neiist.orders(user_istid);

--Triggers

--Resotck Limited stock items on order cancellation
CREATE OR REPLACE FUNCTION neiist.restock_limited_items_on_order_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Defensive guard (trigger WHEN already enforces this transition)
  IF OLD.status = NEW.status OR NEW.status <> 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Restock product variants (limited stock only, items with variant_id)
  UPDATE neiist.product_variants AS product_variant
  SET stock_quantity = COALESCE(product_variant.stock_quantity, 0) + variant_restock.quantity_to_restock,
      updated_at = NOW()
  FROM (
    SELECT
      order_item.product_id AS product_id,
      order_item.variant_id AS variant_id,
      SUM(order_item.quantity)::INTEGER AS quantity_to_restock
    FROM neiist.order_items AS order_item
    JOIN neiist.products AS product
      ON product.id = order_item.product_id
    WHERE order_item.order_id = NEW.id
      AND order_item.variant_id IS NOT NULL
      AND product.stock_type = 'limited'
    GROUP BY order_item.product_id, order_item.variant_id
  ) AS variant_restock
  WHERE product_variant.id = variant_restock.variant_id
    AND product_variant.product_id = variant_restock.product_id;

  -- Restock base products (limited stock only, items without variant_id)
  UPDATE neiist.products AS product
  SET stock_quantity = COALESCE(product.stock_quantity, 0) + product_restock.quantity_to_restock
  FROM (
    SELECT
      order_item.product_id AS product_id,
      SUM(order_item.quantity)::INTEGER AS quantity_to_restock
    FROM neiist.order_items AS order_item
    JOIN neiist.products AS product_for_filter
      ON product_for_filter.id = order_item.product_id
    WHERE order_item.order_id = NEW.id
      AND order_item.variant_id IS NULL
      AND product_for_filter.stock_type = 'limited'
    GROUP BY order_item.product_id
  ) AS product_restock
  WHERE product.id = product_restock.product_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restock_limited_on_cancel
AFTER UPDATE OF status ON neiist.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled')
EXECUTE FUNCTION neiist.restock_limited_items_on_order_cancel();

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
  photo_path TEXT,
  courses TEXT[],
  roles TEXT[],
  teams VARCHAR(30)[],
  github TEXT,
  linkedin TEXT
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
    u.photo_path,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    COALESCE(derived_access.access_array, ARRAY[]::TEXT[]) AS roles,
    COALESCE(team_list.team_array, ARRAY[]::VARCHAR(30)[]) AS teams,
    u.github,
    u.linkedin
  FROM neiist.users u
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT vdr.access::TEXT) AS access_array
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date > CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_access ON u.istid = derived_access.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT m.department_name) AS team_array
    FROM neiist.membership m
    WHERE m.user_istid = u_istid
      AND (m.to_date IS NULL OR m.to_date > CURRENT_DATE)
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
  p_photo_path TEXT,
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
  photo_path TEXT,
  courses TEXT[],
  roles TEXT[],
  teams VARCHAR(30)[],
  github TEXT,
  linkedin TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO neiist.users (istid, name, email, photo_path, github, linkedin)
  VALUES (p_istid, p_name, p_email, p_photo_path, p_github, p_linkedin);

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
    SELECT p_istid, unnest(p_courses);
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Add department
CREATE OR REPLACE FUNCTION neiist.add_department(
  u_name VARCHAR(30),
  u_department_type VARCHAR(20)
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" já existe.', u_name;
  END IF;

  IF u_department_type NOT IN ('team', 'admin_body') THEN
    RAISE EXCEPTION 'Tipo de departamento inválido. Deve ser "team" ou "admin_body".';
  END IF;
  INSERT INTO neiist.departments (name, department_type) VALUES (u_name, u_department_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove department
CREATE OR REPLACE FUNCTION neiist.remove_department(
  u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_name;
  END IF;

  UPDATE neiist.departments SET active = FALSE WHERE name = u_name;
  UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
  UPDATE neiist.membership SET to_date = CURRENT_DATE WHERE department_name = u_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add team
CREATE OR REPLACE FUNCTION neiist.add_team(
  u_name VARCHAR(30),
  u_description TEXT
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM neiist.teams WHERE name = u_name) THEN
    RAISE EXCEPTION 'A equipa "%" já existe.', u_name;
  END IF;

  INSERT INTO neiist.departments (name, department_type) VALUES (u_name, 'team');
  INSERT INTO neiist.teams (name, description) VALUES (u_name, u_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove team
CREATE OR REPLACE FUNCTION neiist.remove_team(
  u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.teams WHERE name = u_name) THEN
    RAISE EXCEPTION 'A equipa "%" não existe.', u_name;
  END IF;

  UPDATE neiist.departments SET active = FALSE WHERE name = u_name;
  UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
  UPDATE neiist.membership SET to_date = CURRENT_DATE WHERE department_name = u_name
    AND (to_date IS NULL OR to_date > CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add administration body
CREATE OR REPLACE FUNCTION neiist.add_admin_body(
  u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM neiist.admin_bodies WHERE name = u_name) THEN
    RAISE EXCEPTION 'O órgão de administração "%" já existe.', u_name;
  END IF;

  INSERT INTO neiist.departments (name, department_type) VALUES (u_name, 'admin_body');
  INSERT INTO neiist.admin_bodies (name) VALUES (u_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove administration body
CREATE OR REPLACE FUNCTION neiist.remove_admin_body(
  u_name VARCHAR(30)
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.admin_bodies WHERE name = u_name) THEN
    RAISE EXCEPTION 'O órgão de administração "%" não existe.', u_name;
  END IF;

  UPDATE neiist.departments SET active = FALSE WHERE name = u_name;
  UPDATE neiist.valid_department_roles SET active = FALSE WHERE department_name = u_name;
  UPDATE neiist.membership SET to_date = CURRENT_DATE WHERE department_name = u_name
    AND (to_date IS NULL OR to_date > CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add valid department role
CREATE OR REPLACE FUNCTION neiist.add_valid_department_role(
  u_department_name VARCHAR(30),
  u_role_name VARCHAR(40),
  u_access neiist.user_access_enum DEFAULT 'member'
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_department_name AND active = TRUE) THEN
    RAISE EXCEPTION 'O departamento "%" não existe ou não está ativo.', u_department_name;
  END IF;

  INSERT INTO neiist.valid_department_roles (department_name, role_name, access)
  VALUES (u_department_name, u_role_name, u_access);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove valid department role
CREATE OR REPLACE FUNCTION neiist.remove_valid_department_role(
  u_department_name VARCHAR(30),
  u_role_name VARCHAR(40)
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
      AND (to_date IS NULL OR to_date > CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add team member
CREATE OR REPLACE FUNCTION neiist.add_team_member(
  u_user_istid VARCHAR(10),
  u_department_name VARCHAR(30),
  u_role_name VARCHAR(40)
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = u_user_istid) THEN
    RAISE EXCEPTION 'O utilizador "%" não existe.', u_user_istid;
  END IF;

  INSERT INTO neiist.membership (user_istid, department_name, role_name)
  VALUES (u_user_istid, u_department_name, u_role_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove team member
CREATE OR REPLACE FUNCTION neiist.remove_team_member(
  u_user_istid VARCHAR(10),
  u_department_name VARCHAR(30),
  u_role_name VARCHAR(40)
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.membership WHERE user_istid = u_user_istid
    AND department_name = u_department_name AND role_name = u_role_name AND (to_date IS NULL OR to_date > CURRENT_DATE)) THEN
    RAISE EXCEPTION 'O utilizador "%" não tem uma participação ativa como "%" no departamento "%".', u_user_istid, u_role_name, u_department_name;
  END IF;

  UPDATE neiist.membership SET to_date = CURRENT_DATE WHERE user_istid = u_user_istid
    AND department_name = u_department_name AND role_name = u_role_name AND (to_date IS NULL OR to_date > CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available roles for a department
CREATE OR REPLACE FUNCTION neiist.get_department_roles(u_department_name VARCHAR(30))
RETURNS TABLE (
  role_name VARCHAR(40),
  access neiist.user_access_enum,
  active BOOLEAN
) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.departments WHERE name = u_department_name) THEN
    RAISE EXCEPTION 'O departamento "%" não existe.', u_department_name;
  END IF;

  RETURN QUERY
  SELECT vdr.role_name, vdr.access, vdr.active
  FROM neiist.valid_department_roles vdr
  WHERE vdr.department_name = u_department_name
  ORDER BY vdr.access DESC, vdr.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get users with a specific access level
CREATE OR REPLACE FUNCTION neiist.get_users_by_access(u_access neiist.user_access_enum)
RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  phone VARCHAR(15),
  courses TEXT[],
  photo_path TEXT,
  github TEXT,
  linkedin TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.istid,
    u.name,
    u.email,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'phone' LIMIT 1) AS phone,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    u.photo_path,
    u.github,
    u.linkedin
  FROM neiist.users u
  JOIN neiist.membership m ON u.istid = m.user_istid
  JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
  WHERE vdr.access = u_access
    AND (m.to_date IS NULL OR m.to_date > CURRENT_DATE)
    AND vdr.active = TRUE
  ORDER BY u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gett all users TODO: send alt_email if is prefered contact as the email?
CREATE OR REPLACE FUNCTION neiist.get_all_users()
RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  phone TEXT,
  courses TEXT[],
  photo_path TEXT,
  roles TEXT[],
  teams VARCHAR(30)[],
  github TEXT,
  linkedin TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.istid,
    u.name,
    u.email,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'phone' LIMIT 1) AS phone,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    u.photo_path,
    COALESCE(derived_access.access_array, ARRAY[]::TEXT[]) AS roles,
    COALESCE(user_teams.teams_array, ARRAY[]::VARCHAR(30)[]) as teams,
    u.github,
    u.linkedin
  FROM neiist.users u
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT vdr.access::TEXT) as access_array
    FROM neiist.membership m
    JOIN neiist.valid_department_roles vdr ON m.department_name = vdr.department_name AND m.role_name = vdr.role_name
    WHERE (m.to_date IS NULL OR m.to_date > CURRENT_DATE)
      AND vdr.active = TRUE
    GROUP BY m.user_istid
  ) derived_access ON u.istid = derived_access.user_istid
  LEFT JOIN (
    SELECT
      m.user_istid,
      array_agg(DISTINCT m.department_name) as teams_array
    FROM neiist.membership m
    WHERE m.to_date IS NULL OR m.to_date > CURRENT_DATE
    GROUP BY m.user_istid
  ) user_teams ON u.istid = user_teams.user_istid
  ORDER BY
    CASE
      WHEN 'admin' = ANY(COALESCE(derived_access.access_array, ARRAY[]::TEXT[])) THEN 1
      WHEN 'coordinator' = ANY(COALESCE(derived_access.access_array, ARRAY[]::TEXT[])) THEN 2
      WHEN 'member' = ANY(COALESCE(derived_access.access_array, ARRAY[]::TEXT[])) THEN 3
      ELSE 4
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
  photo_path TEXT,
  courses TEXT[],
  roles TEXT[],
  teams VARCHAR(30)[],
  github TEXT,
  linkedin TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update users table fields
  IF p_updates ? 'name' THEN
    UPDATE neiist.users SET name = p_updates->>'name' WHERE istid = p_istid;
  END IF;
  IF p_updates ? 'email' THEN
    UPDATE neiist.users SET email = p_updates->>'email' WHERE istid = p_istid;
  END IF;
  IF p_updates ? 'photo' THEN
    UPDATE neiist.users SET photo_path = p_updates->>'photo' WHERE istid = p_istid;
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
      SELECT p_istid, value::TEXT
      FROM jsonb_array_elements_text(p_updates->'courses') AS value;
    END IF;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_user(p_istid);
END;
$$;

-- Update user photo path
CREATE OR REPLACE FUNCTION neiist.update_user_photo(
  p_istid VARCHAR(10),
  p_photo_data TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE neiist.users
  SET photo_path = p_photo_data
  WHERE istid = p_istid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with istid % not found', p_istid;
  END IF;
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
  name VARCHAR(30),
  department_type VARCHAR(20),
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.name, d.department_type, d.active
  FROM neiist.departments d
  ORDER BY d.department_type, d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all teams
CREATE OR REPLACE FUNCTION neiist.get_all_teams()
RETURNS TABLE (
  name VARCHAR(30),
  description TEXT,
  active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.name, t.description, d.active
    FROM neiist.teams t
    JOIN neiist.departments d ON t.name = d.name
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all admin bodies
CREATE OR REPLACE FUNCTION neiist.get_all_admin_bodies()
RETURNS TABLE (
  name VARCHAR(30),
  active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT ab.name, d.active
    FROM neiist.admin_bodies ab
    JOIN neiist.departments d ON ab.name = d.name
    ORDER BY ab.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all valid department roles (useful for admin interface)
CREATE OR REPLACE FUNCTION neiist.get_all_valid_department_roles()
RETURNS TABLE (
  department_name VARCHAR(30),
  department_type VARCHAR(20),
  role_name VARCHAR(40),
  access neiist.user_access_enum,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT vdr.department_name, d.department_type, vdr.role_name, vdr.access, vdr.active
  FROM neiist.valid_department_roles vdr
  JOIN neiist.departments d ON vdr.department_name = d.name
  ORDER BY d.department_type, vdr.department_name, vdr.access DESC, vdr.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all memberships (useful for admin interface)
CREATE OR REPLACE FUNCTION neiist.get_all_memberships()
RETURNS TABLE (
  user_istid VARCHAR(10),
  user_name TEXT,
  department_name VARCHAR(30),
  department_type VARCHAR(20),
  role_name VARCHAR(40),
  from_date DATE,
  to_date DATE,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.user_istid,
    u.name as user_name,
    m.department_name,
    d.department_type,
    m.role_name,
    m.from_date,
    m.to_date,
    CASE
      WHEN m.to_date IS NULL OR m.to_date > CURRENT_DATE THEN TRUE
      ELSE FALSE
    END as active
  FROM neiist.membership m
  JOIN neiist.users u ON m.user_istid = u.istid
  JOIN neiist.departments d ON m.department_name = d.name
  ORDER BY u.name, d.department_type, m.department_name, m.role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get hierarchy for a department
CREATE OR REPLACE FUNCTION neiist.get_department_role_order(
    p_department TEXT
) RETURNS TABLE(role_name TEXT, "position" INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT department_role_order.role_name, department_role_order."position"
    FROM neiist.department_role_order
    WHERE department_role_order.department_name = p_department;
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

-- Update Activities/Events
CREATE OR REPLACE FUNCTION neiist.update_activities(
  p_id TEXT,
  p_title TEXT,
  p_description TEXT,
  p_url TEXT,
  p_location TEXT[],
  p_type TEXT,
  p_teams TEXT[],
  p_attendees TEXT[],
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_all_day BOOLEAN,
  p_last_edited_time TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  INSERT INTO neiist.activities (
    id, title, description, url, location, type, teams, attendees,
    start, "end", all_day, last_edited_time, updated_at
  )
  VALUES (
    p_id, p_title, p_description, p_url, p_location, p_type, p_teams, p_attendees,
    p_start, p_end, p_all_day, p_last_edited_time, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = COALESCE(neiist.activities.description, EXCLUDED.description),
    url = EXCLUDED.url,
    location = EXCLUDED.location,
    type = EXCLUDED.type,
    teams = EXCLUDED.teams,
    attendees = EXCLUDED.attendees,
    start = EXCLUDED.start,
    "end" = EXCLUDED."end",
    all_day = EXCLUDED.all_day,
    last_edited_time = EXCLUDED.last_edited_time,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Subscribe user to event
CREATE OR REPLACE FUNCTION neiist.sign_up_to_event(
  p_event_id TEXT,
  p_user_istid VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM neiist.activities WHERE id = p_event_id) THEN
    RAISE EXCEPTION 'Event % does not exist', p_event_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM neiist.users WHERE istid = p_user_istid) THEN
    RAISE EXCEPTION 'User % does not exist', p_user_istid;
  END IF;

  INSERT INTO neiist.activities_sign_up (event_id, user_istid)
  VALUES (p_event_id, p_user_istid)
  ON CONFLICT (event_id, user_istid) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unsubscribe user from event
CREATE OR REPLACE FUNCTION neiist.remove_sign_up_from_event(
  p_event_id TEXT,
  p_user_istid VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.activities_sign_up
  WHERE event_id = p_event_id AND user_istid = p_user_istid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all activities/events
CREATE OR REPLACE FUNCTION neiist.get_all_activities()
RETURNS TABLE (
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
  subscribers VARCHAR(10)[],
  subscriber_count BIGINT
) AS $$
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
    COALESCE(
      ARRAY_AGG(es.user_istid ORDER BY es.signed_up_at) FILTER (WHERE es.user_istid IS NOT NULL),
      ARRAY[]::VARCHAR(10)[]
    ) AS subscribers,
    COUNT(es.user_istid) AS subscriber_count
  FROM neiist.activities e
  LEFT JOIN neiist.activities_sign_up es ON e.id = es.event_id
  WHERE e.start IS NOT NULL
  GROUP BY e.id, e.title, e.description, e.url, e.location, e.type,
           e.teams, e.attendees, e.start, e."end", e.all_day, e.last_edited_time,
           e.signup_enabled, e.signup_deadline, e.max_attendees, e.custom_icon
  ORDER BY e.start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update event properties (admin only)
CREATE OR REPLACE FUNCTION neiist.update_activity_properties(
  p_id TEXT,
  p_signup_enabled BOOLEAN,
  p_signup_deadline TIMESTAMPTZ,
  p_max_attendees INTEGER,
  p_custom_icon TEXT,
  p_description TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE neiist.activities
  SET
    signup_enabled = p_signup_enabled,
    signup_deadline = p_signup_deadline,
    max_attendees = p_max_attendees,
    custom_icon = p_custom_icon,
    description = COALESCE(p_description, description),
    updated_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get subscribers for an event with user details
CREATE OR REPLACE FUNCTION neiist.get_event_subscribers(p_event_id TEXT)
RETURNS TABLE (
  istid VARCHAR(10),
  name TEXT,
  email TEXT,
  signed_up_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.istid,
    u.name,
    COALESCE(
      CASE
        WHEN uc.is_preferred = TRUE AND uc.contact_type = 'alt_email'
        THEN uc.contact_value
        ELSE u.email
      END,
      u.email
    ) AS email,
    es.signed_up_at as signed_up_at
  FROM neiist.activities_sign_up es
  JOIN neiist.users u ON es.user_istid = u.istid
  LEFT JOIN neiist.user_contacts uc ON u.istid = uc.user_istid
    AND uc.contact_type = 'alt_email'
    AND uc.is_preferred = TRUE
  WHERE es.event_id = p_event_id
  ORDER BY es.signed_up_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete activity/event by ID
CREATE OR REPLACE FUNCTION neiist.delete_activities(p_id TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.activities WHERE id = p_id;
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

-- Create a new product and varients if existent
CREATE OR REPLACE FUNCTION neiist.add_product(
  p_name TEXT,
  p_description TEXT,
  p_price NUMERIC(10,2),
  p_images TEXT[],
  p_category TEXT,
  p_stock_type neiist.shop_stock_type_enum,
  p_stock_quantity INTEGER,
  p_order_deadline TIMESTAMPTZ,
  p_active BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline TIMESTAMPTZ,
  variants JSONB
) AS $$
DECLARE
  v_cat_id INTEGER;
  v_id INTEGER;
BEGIN
  IF p_category IS NOT NULL AND length(trim(p_category)) > 0 THEN
   SELECT category_id INTO v_cat_id FROM neiist.get_or_create_category(p_category);
  END IF;

  INSERT INTO neiist.products(
    name, description, price, images, category_id, stock_type, stock_quantity,
    order_deadline, active
  ) VALUES (
    p_name, p_description, p_price, COALESCE(p_images,'{}'),
    v_cat_id, p_stock_type, p_stock_quantity, p_order_deadline, COALESCE(p_active, TRUE)
  )
  RETURNING products.id INTO v_id;

  RETURN QUERY
  SELECT
    pr.id,
    pr.name,
    pr.description,
    pr.price,
    pr.images,
    c.name AS category,
    pr.stock_type::TEXT,
    pr.stock_quantity,
    pr.order_deadline,
    '[]'::JSONB AS variants
  FROM neiist.products pr
  LEFT JOIN neiist.categories c ON c.id = pr.category_id
  WHERE pr.id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a new product varient
CREATE OR REPLACE FUNCTION neiist.add_product_variant(
  p_product_id INTEGER,
  p_sku TEXT,
  p_images TEXT[],
  p_price_modifier NUMERIC(10,2),
  p_stock_quantity INTEGER,
  p_active BOOLEAN DEFAULT TRUE,
  p_options JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline TIMESTAMPTZ,
  variants JSONB
) AS $$
DECLARE
  v_product neiist.products%ROWTYPE;
  v_category TEXT;
  v_variant_id INTEGER;
  kv RECORD;
BEGIN
  SELECT * INTO v_product
  FROM neiist.products p
  WHERE p.id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  INSERT INTO neiist.product_variants(
    product_id, sku, images, price_modifier, stock_quantity, active
  ) VALUES (
    p_product_id, NULLIF(p_sku,''), COALESCE(p_images, '{}'),
    COALESCE(p_price_modifier, 0), p_stock_quantity, COALESCE(p_active, TRUE)
  )
  RETURNING neiist.product_variants.id INTO v_variant_id;

  IF p_options IS NOT NULL AND jsonb_typeof(p_options) = 'object' THEN
    FOR kv IN SELECT key, value FROM jsonb_each(p_options)
    LOOP
      INSERT INTO neiist.product_variant_options(variant_id, option_name, option_value)
      VALUES (v_variant_id, kv.key, kv.value #>> '{}')
      ON CONFLICT (variant_id, option_name) DO UPDATE
      SET option_value = EXCLUDED.option_value;
    END LOOP;
  END IF;

  SELECT c.name INTO v_category
  FROM neiist.categories c
  WHERE c.id = v_product.category_id;

  RETURN QUERY
  SELECT
    v_product.id,
    v_product.name,
    v_product.description,
    v_product.price,
    v_product.images,
    v_category,
    v_product.stock_type::TEXT,
    v_product.stock_quantity,
    v_product.order_deadline,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', pv.id,
          'sku', pv.sku,
          'images', pv.images,
          'price_modifier', pv.price_modifier,
          'stock_quantity', pv.stock_quantity,
          'active', pv.active,
          'options', COALESCE((
              SELECT jsonb_object_agg(pvo.option_name, pvo.option_value)
              FROM neiist.product_variant_options pvo
              WHERE pvo.variant_id = pv.id
            ), '{}'::jsonb),
          'label', NULLIF((
              SELECT string_agg(pvo.option_name || ': ' || pvo.option_value, ' | ' ORDER BY pvo.option_name)
              FROM neiist.product_variant_options pvo
              WHERE pvo.variant_id = pv.id
            ), '')
        )
      ORDER BY pv.id), '[]'::JSONB)
      FROM neiist.product_variants pv
      WHERE pv.product_id = v_product.id
    ) AS variants;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all available products
CREATE OR REPLACE FUNCTION neiist.get_all_products()
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline TIMESTAMPTZ,
  variants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.description, p.price, p.images,
    c.name AS category,
    p.stock_type::TEXT, p.stock_quantity, p.order_deadline,
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
  WHERE p.active = TRUE
  ORDER BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get a product
CREATE OR REPLACE FUNCTION neiist.get_product(p_product_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline TIMESTAMPTZ,
  variants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.description, p.price, p.images,
    c.name AS category,
    p.stock_type::TEXT, p.stock_quantity, p.order_deadline,
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
  WHERE p.id = p_product_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update a product data
CREATE OR REPLACE FUNCTION neiist.update_product(
  p_product_id INTEGER,
  p_updates JSONB
) RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline TIMESTAMPTZ,
  variants JSONB
) AS $$
DECLARE
  v_cat_id INTEGER;
BEGIN
  IF p_updates ? 'category' AND p_updates->>'category' IS NOT NULL AND TRIM(p_updates->>'category') != '' THEN
    SELECT category_id INTO v_cat_id FROM neiist.get_or_create_category(p_updates->>'category');
    UPDATE neiist.products SET category_id = v_cat_id WHERE products.id = p_product_id;
  END IF;

  IF p_updates ? 'name' THEN
    UPDATE neiist.products SET name = p_updates->>'name' WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'description' THEN
    UPDATE neiist.products SET description = NULLIF(p_updates->>'description','') WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'price' THEN
    UPDATE neiist.products SET price = (p_updates->>'price')::NUMERIC WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'images' THEN
    UPDATE neiist.products SET images = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'images')), '{}') WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'stock_type' THEN
    UPDATE neiist.products SET stock_type = (p_updates->>'stock_type')::neiist.shop_stock_type_enum WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'stock_quantity' THEN
    UPDATE neiist.products SET stock_quantity = NULLIF(p_updates->>'stock_quantity','')::INTEGER WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'order_deadline' THEN
    UPDATE neiist.products SET order_deadline = NULLIF(p_updates->>'order_deadline','')::TIMESTAMPTZ WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'active' THEN
    UPDATE neiist.products SET active = (p_updates->>'active')::BOOLEAN WHERE products.id = p_product_id;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_product(p_product_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update a product varient data
CREATE OR REPLACE FUNCTION neiist.update_product_variant(
  p_variant_id INTEGER,
  p_updates JSONB
) RETURNS TABLE (
  id INTEGER,
  product_id INTEGER,
  sku TEXT,
  images TEXT[],
  price_modifier NUMERIC(10,2),
  stock_quantity INTEGER,
  active BOOLEAN,
  options JSONB,
  label TEXT
) AS $$
DECLARE
  kv RECORD;
BEGIN
  IF p_updates ? 'sku' THEN
    UPDATE neiist.product_variants SET sku = NULLIF(p_updates->>'sku','') WHERE product_variants.id = p_variant_id;
  END IF;
  IF p_updates ? 'images' THEN
    UPDATE neiist.product_variants SET images = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'images')), '{}') WHERE product_variants.id = p_variant_id;
  END IF;
  IF p_updates ? 'price_modifier' THEN
    UPDATE neiist.product_variants SET price_modifier = (p_updates->>'price_modifier')::NUMERIC WHERE product_variants.id = p_variant_id;
  END IF;
  IF p_updates ? 'stock_quantity' THEN
    UPDATE neiist.product_variants SET stock_quantity = NULLIF(p_updates->>'stock_quantity','')::INTEGER WHERE product_variants.id = p_variant_id;
  END IF;
  IF p_updates ? 'active' THEN
    UPDATE neiist.product_variants SET active = (p_updates->>'active')::BOOLEAN WHERE product_variants.id = p_variant_id;
  END IF;

  IF p_updates ? 'options' THEN
    DELETE FROM neiist.product_variant_options WHERE variant_id = p_variant_id;
    IF p_updates->'options' IS NOT NULL AND jsonb_typeof(p_updates->'options') = 'object' THEN
      FOR kv IN SELECT key, value FROM jsonb_each(p_updates->'options')
      LOOP
      INSERT INTO neiist.product_variant_options(variant_id, option_name, option_value)
      VALUES (p_variant_id, kv.key, kv.value #>> '{}');
      END LOOP;
    END IF;
  END IF;

  UPDATE neiist.product_variants SET updated_at = NOW() WHERE product_variants.id = p_variant_id;

  RETURN QUERY
  SELECT
    v.id,
    v.product_id,
    v.sku,
    v.images,
    v.price_modifier,
    v.stock_quantity,
    v.active,
    COALESCE((
      SELECT jsonb_object_agg(vo.option_name, vo.option_value)
      FROM neiist.product_variant_options vo
      WHERE vo.variant_id = v.id
    ), '{}'::jsonb) AS options,
    NULLIF((
      SELECT string_agg(vo.option_name || ': ' || vo.option_value, ' | ' ORDER BY vo.option_name)
      FROM neiist.product_variant_options vo
      WHERE vo.variant_id = v.id
    ), '') AS label
  FROM neiist.product_variants v
  WHERE v.id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all products including archived ones (admin view)
CREATE OR REPLACE FUNCTION neiist.get_all_products_including_archived()
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline TIMESTAMPTZ,
  active BOOLEAN,
  variants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.description, p.price, p.images,
    c.name AS category,
    p.stock_type::TEXT, p.stock_quantity, p.order_deadline,
    p.active,
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
  ORDER BY p.active DESC, p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permanently delete a product and all its variants (hard delete)
CREATE OR REPLACE FUNCTION neiist.delete_product(p_product_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.products WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permanently delete a single product variant (hard delete)
CREATE OR REPLACE FUNCTION neiist.delete_product_variant(p_variant_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM neiist.product_variants WHERE id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add discount code
CREATE OR REPLACE FUNCTION neiist.add_discount_code(
  p_code TEXT,
  p_discount_type TEXT,
  p_discount_value NUMERIC,
  p_valid_product_ids INTEGER[] DEFAULT NULL,
  p_valid_istids TEXT[] DEFAULT NULL,
  p_max_uses INTEGER DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_active BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
  id INTEGER,
  code TEXT,
  discount_type TEXT,
  discount_value NUMERIC(10,2),
  valid_product_ids INTEGER[],
  valid_istids TEXT[],
  max_uses INTEGER,
  current_uses INTEGER,
  expires_at TIMESTAMPTZ,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := UPPER(BTRIM(p_code));

  IF v_code IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'Discount code is required';
  END IF;

  IF p_discount_type NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'Invalid discount type';
  END IF;

  INSERT INTO neiist.discount_codes (
    code,
    discount_type,
    discount_value,
    valid_product_ids,
    valid_istids,
    max_uses,
    expires_at,
    active
  )
  VALUES (
    v_code,
    p_discount_type,
    ROUND(COALESCE(p_discount_value, 0), 2),
    NULLIF(p_valid_product_ids, '{}'),
    NULLIF(p_valid_istids, '{}'),
    p_max_uses,
    p_expires_at,
    COALESCE(p_active, TRUE)
  )
  RETURNING
    discount_codes.id,
    discount_codes.code,
    discount_codes.discount_type,
    discount_codes.discount_value,
    discount_codes.valid_product_ids,
    discount_codes.valid_istids,
    discount_codes.max_uses,
    discount_codes.current_uses,
    discount_codes.expires_at,
    discount_codes.active,
    discount_codes.created_at,
    discount_codes.updated_at
  INTO
    id,
    code,
    discount_type,
    discount_value,
    valid_product_ids,
    valid_istids,
    max_uses,
    current_uses,
    expires_at,
    active,
    created_at,
    updated_at;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update discount code
CREATE OR REPLACE FUNCTION neiist.update_discount_code(
  p_discount_code_id INTEGER,
  p_updates JSONB
) RETURNS TABLE (
  id INTEGER,
  code TEXT,
  discount_type TEXT,
  discount_value NUMERIC(10,2),
  valid_product_ids INTEGER[],
  valid_istids TEXT[],
  max_uses INTEGER,
  current_uses INTEGER,
  expires_at TIMESTAMPTZ,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  UPDATE neiist.discount_codes
  SET
    code = COALESCE(UPPER(BTRIM(NULLIF(p_updates->>'code', ''))), code),
    discount_type = COALESCE(NULLIF(p_updates->>'discount_type', ''), discount_type),
    discount_value = COALESCE(ROUND(NULLIF(p_updates->>'discount_value', '')::NUMERIC, 2), discount_value),
    valid_product_ids = CASE
      WHEN p_updates ? 'valid_product_ids' THEN (
        SELECT COALESCE(array_agg(value::INTEGER), '{}'::INTEGER[])
        FROM jsonb_array_elements_text(COALESCE(p_updates->'valid_product_ids', '[]'::jsonb)) AS value
      )
      ELSE valid_product_ids
    END,
    valid_istids = CASE
      WHEN p_updates ? 'valid_istids' THEN (
        SELECT COALESCE(array_agg(value::TEXT), '{}'::TEXT[])
        FROM jsonb_array_elements_text(COALESCE(p_updates->'valid_istids', '[]'::jsonb)) AS value
      )
      ELSE valid_istids
    END,
    max_uses = COALESCE(NULLIF(p_updates->>'max_uses', '')::INTEGER, max_uses),
    expires_at = CASE
      WHEN p_updates ? 'expires_at' THEN NULLIF(p_updates->>'expires_at', '')::TIMESTAMPTZ
      ELSE expires_at
    END,
    active = COALESCE(NULLIF(p_updates->>'active', '')::BOOLEAN, active),
    updated_at = NOW()
  WHERE id = p_discount_code_id
  RETURNING
    discount_codes.id,
    discount_codes.code,
    discount_codes.discount_type,
    discount_codes.discount_value,
    discount_codes.valid_product_ids,
    discount_codes.valid_istids,
    discount_codes.max_uses,
    discount_codes.current_uses,
    discount_codes.expires_at,
    discount_codes.active,
    discount_codes.created_at,
    discount_codes.updated_at
  INTO
    id,
    code,
    discount_type,
    discount_value,
    valid_product_ids,
    valid_istids,
    max_uses,
    current_uses,
    expires_at,
    active,
    created_at,
    updated_at;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discount code % not found', p_discount_code_id;
  END IF;

  RETURN NEXT;
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
RETURNS TABLE (
  id INTEGER,
  code TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  valid_product_ids INTEGER[],
  valid_istids TEXT[],
  max_uses INTEGER,
  current_uses INTEGER,
  expires_at TIMESTAMPTZ,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    discount_codes.id,
    discount_codes.code,
    discount_codes.discount_type,
    discount_codes.discount_value,
    discount_codes.valid_product_ids,
    discount_codes.valid_istids,
    discount_codes.max_uses,
    discount_codes.current_uses,
    discount_codes.expires_at,
    discount_codes.active,
    discount_codes.created_at,
    discount_codes.updated_at
  FROM neiist.discount_codes
  ORDER BY id DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not found or inactive';
    RETURN;
  END IF;

  IF v_discount.expires_at IS NOT NULL AND NOW() > v_discount.expires_at THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code expired';
    RETURN;
  END IF;

  IF v_discount.max_uses IS NOT NULL AND v_discount.current_uses >= v_discount.max_uses THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code max uses reached';
    RETURN;
  END IF;

  IF v_discount.valid_istids IS NOT NULL AND COALESCE(array_length(v_discount.valid_istids, 1), 0) > 0 THEN
    IF p_user_istid IS NULL OR NOT EXISTS (
      SELECT 1
      FROM unnest(v_discount.valid_istids) AS allowed_istid
      WHERE LOWER(BTRIM(allowed_istid)) = LOWER(BTRIM(p_user_istid))
    ) THEN
      RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not valid for user';
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
      RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Invalid quantity in cart';
      RETURN;
    END IF;

    SELECT p.price
      INTO v_price
    FROM neiist.products p
    WHERE p.id = v_pid AND p.active = TRUE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Product not found or inactive';
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
        RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Variant not found or inactive';
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
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Cart is empty';
    RETURN;
  END IF;

  IF v_discount.valid_product_ids IS NOT NULL AND COALESCE(array_length(v_discount.valid_product_ids, 1), 0) > 0 AND NOT v_matching_items THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not applicable to these products';
    RETURN;
  END IF;

  IF v_discount.discount_type = 'percentage' THEN
    v_eligible_total := ROUND(v_eligible_total * (v_discount.discount_value / 100.0), 2);
  ELSE
    v_eligible_total := ROUND(LEAST(v_eligible_total, v_discount.discount_value), 2);
  END IF;

  IF v_eligible_total <= 0 THEN
    RETURN QUERY SELECT FALSE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, 0::NUMERIC(10,2), 'Discount code not applicable to these products';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_discount.id, v_discount.code, v_discount.discount_type, v_discount.discount_value, v_eligible_total, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New order created
CREATE OR REPLACE FUNCTION neiist.new_order(
  p_user_istid VARCHAR(10),
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_nif TEXT,
  p_campus TEXT,
  p_notes TEXT,
  p_payment_method TEXT,
  p_payment_reference TEXT,
  p_created_by TEXT,
  p_items JSONB,
  p_discount_code TEXT DEFAULT NULL,
  p_stock_override BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
  id INTEGER,
  order_number TEXT,
  customer_name TEXT,
  user_istid VARCHAR(10),
  customer_email TEXT,
  customer_phone TEXT,
  customer_nif TEXT,
  campus TEXT,
  pickup_deadline TIMESTAMPTZ,
  items JSONB,
  notes TEXT,
  discount_code TEXT,
  discount_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_checked_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  updated_by TEXT,
  status TEXT
) AS $$
DECLARE
  v_order_id INTEGER;
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_customer_phone TEXT;
  it JSONB;
  v_pid INTEGER;
  v_vid INTEGER;
  v_qty INTEGER;
  v_base NUMERIC(10,2);
  v_unit NUMERIC(10,2);
  v_total NUMERIC(10,2) := 0;
  v_stock_type neiist.shop_stock_type_enum;
  v_order_deadline TIMESTAMPTZ;
  v_variant_stock INTEGER;
  v_product_stock INTEGER;
  v_pname TEXT;
  v_v_label TEXT;
  v_v_opts JSONB;
  v_discount_code TEXT := NULL;
  v_discount_amount NUMERIC(10,2) := 0;
  v_discount_result RECORD;
BEGIN
  v_customer_name := CASE
    WHEN p_user_istid IS NOT NULL THEN NULL
    ELSE NULLIF(BTRIM(p_customer_name), '')
  END;

  v_customer_email := CASE
    WHEN p_user_istid IS NOT NULL THEN NULL
    ELSE NULLIF(BTRIM(p_customer_email), '')
  END;

  v_customer_phone := CASE
    WHEN p_user_istid IS NOT NULL THEN NULL
    ELSE NULLIF(BTRIM(p_customer_phone), '')
  END;

  INSERT INTO neiist.orders(
    user_istid,
    customer_name,
    customer_email,
    customer_phone,
    nif,
    campus,
    notes,
    discount_code,
    discount_amount,
    payment_method,
    payment_reference,
    created_by
  )
  VALUES (
    p_user_istid,
    v_customer_name,
    v_customer_email,
    v_customer_phone,
    p_nif,
    p_campus,
    p_notes,
    NULL,
    NULL,
    p_payment_method,
    p_payment_reference,
    p_created_by
  )
  RETURNING orders.id INTO v_order_id;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (it->>'product_id')::INTEGER;
    v_vid := NULLIF(it->>'variant_id','')::INTEGER;
    v_qty := (it->>'quantity')::INTEGER;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product_id %', v_pid;
    END IF;

    SELECT p.name, p.price, p.stock_type, p.stock_quantity, p.order_deadline
      INTO v_pname, v_base, v_stock_type, v_product_stock, v_order_deadline
    FROM neiist.products p
    WHERE p.id = v_pid AND p.active = TRUE;

    IF v_pname IS NULL THEN
      RAISE EXCEPTION 'Product % not found or inactive', v_pid;
    END IF;

    IF NOT p_stock_override THEN
      IF v_stock_type = 'on_demand' AND v_order_deadline IS NOT NULL AND NOW() > v_order_deadline THEN
        RAISE EXCEPTION 'Order deadline has passed for product % (%)', v_pid, v_pname;
      END IF;
    END IF;

    IF v_vid IS NOT NULL THEN
      -- Lock variant row for stock check
      PERFORM 1 FROM neiist.product_variants WHERE product_variants.id = v_vid AND product_variants.product_id = v_pid AND product_variants.active = TRUE FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant % for product % not found or inactive', v_vid, v_pid;
      END IF;

      SELECT
        NULLIF((
          SELECT string_agg(pvo.option_name || ': ' || pvo.option_value, ' | ' ORDER BY pvo.option_name)
          FROM neiist.product_variant_options pvo
          WHERE pvo.variant_id = pv.id
        ), '') AS label,
        COALESCE((
          SELECT jsonb_object_agg(pvo.option_name, pvo.option_value)
          FROM neiist.product_variant_options pvo
          WHERE pvo.variant_id = pv.id
        ), '{}'::jsonb) AS options,
        pv.price_modifier,
        pv.stock_quantity
      INTO v_v_label, v_v_opts, v_unit, v_variant_stock
      FROM neiist.product_variants pv
      WHERE pv.id = v_vid AND pv.product_id = v_pid;

      v_unit := ROUND(v_base + COALESCE(v_unit,0), 2);

      IF v_stock_type = 'limited' AND NOT p_stock_override THEN
        IF v_variant_stock IS NULL OR v_variant_stock < v_qty THEN
          RAISE EXCEPTION 'Insufficient variant stock (product %, variant %, have %, need %)',
            v_pid, v_vid, COALESCE(v_variant_stock, -1), v_qty;
        END IF;

        UPDATE neiist.product_variants
          SET stock_quantity = stock_quantity - v_qty,
              updated_at = NOW()
          WHERE product_variants.id = v_vid;
      ELSIF v_stock_type = 'limited' AND p_stock_override THEN
        NULL;
      END IF;
    ELSE
      v_v_label := NULL;
      v_v_opts := NULL;
      v_unit := ROUND(v_base, 2);

      IF v_stock_type = 'limited' AND NOT p_stock_override THEN
        SELECT p.stock_quantity INTO v_product_stock
        FROM neiist.products p
        WHERE p.id = v_pid FOR UPDATE;

        IF v_product_stock IS NULL OR v_product_stock < v_qty THEN
          RAISE EXCEPTION 'Insufficient product stock (product %, have %, need %)',
            v_pid, COALESCE(v_product_stock, -1), v_qty;
        END IF;

        UPDATE neiist.products p
        SET stock_quantity = stock_quantity - v_qty
        WHERE p.id = v_pid;
      ELSIF v_stock_type = 'limited' AND p_stock_override THEN
        NULL;
      END IF;
    END IF;

    v_total := v_total + v_unit * v_qty;

    INSERT INTO neiist.order_items(
      order_id, product_id, variant_id, product_name, variant_label, variant_options,
      quantity, unit_price, total_price
    ) VALUES (
      v_order_id, v_pid, v_vid, v_pname, v_v_label, v_v_opts,
      v_qty, v_unit, v_unit * v_qty
    );
  END LOOP;

  IF NULLIF(BTRIM(COALESCE(p_discount_code, '')), '') IS NOT NULL THEN
    SELECT * INTO v_discount_result
    FROM neiist.validate_discount_code(p_discount_code, p_user_istid, p_items);

    IF NOT COALESCE(v_discount_result.is_valid, FALSE) THEN
      RAISE EXCEPTION '%', COALESCE(v_discount_result.error, 'Invalid discount code');
    END IF;

    UPDATE neiist.discount_codes
    SET current_uses = neiist.discount_codes.current_uses + 1,
        updated_at = NOW()
    WHERE neiist.discount_codes.id = v_discount_result.discount_code_id
      AND neiist.discount_codes.active = TRUE
      AND (neiist.discount_codes.expires_at IS NULL OR neiist.discount_codes.expires_at > NOW())
      AND (neiist.discount_codes.max_uses IS NULL OR neiist.discount_codes.current_uses < neiist.discount_codes.max_uses)
    RETURNING neiist.discount_codes.code INTO v_discount_code;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Discount code max uses reached';
    END IF;

    v_discount_amount := LEAST(v_total, COALESCE(v_discount_result.discount_amount, 0));
  END IF;

  UPDATE neiist.orders
  SET
    discount_code = v_discount_code,
    discount_amount = CASE WHEN v_discount_code IS NULL THEN NULL ELSE ROUND(v_discount_amount, 2) END,
    total_amount = ROUND(v_total - COALESCE(v_discount_amount, 0), 2),
    updated_at = NOW(),
    updated_by = p_created_by
  WHERE orders.id = v_order_id;

  RETURN QUERY
  SELECT
    o.id, o.order_number,
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
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'variant_id', oi.variant_id,
        'variant_label', oi.variant_label,
        'variant_options', oi.variant_options,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      ) ORDER BY oi.id)
      FROM neiist.order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::JSONB) AS items,
    o.notes, o.discount_code, o.discount_amount, o.total_amount, o.payment_method, o.payment_reference,
    o.created_by,
    o.created_at, o.paid_at, o.payment_checked_by, o.delivered_at, o.delivered_by, o.updated_at, o.updated_by,
    o.status::TEXT
  FROM neiist.orders o
  LEFT JOIN neiist.users u ON u.istid = o.user_istid
  WHERE o.id = v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get an order by ID or order_number
CREATE OR REPLACE FUNCTION neiist.get_order(
  p_order_id INT DEFAULT NULL,
  p_order_number TEXT DEFAULT NULL
)
RETURNS TABLE (
  id INT,
  order_number TEXT,
  customer_name TEXT,
  user_istid VARCHAR(10),
  customer_email TEXT,
  customer_phone TEXT,
  customer_nif TEXT,
  campus TEXT,
  pickup_deadline TIMESTAMPTZ,
  items JSONB,
  notes TEXT,
  discount_code TEXT,
  discount_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_checked_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  updated_by TEXT,
  status neiist.shop_order_status_enum
) AS $$
BEGIN
  IF (p_order_id IS NULL AND p_order_number IS NULL) THEN
    RAISE EXCEPTION 'Provide order_id or order_number';
  END IF;

  IF (p_order_id IS NOT NULL AND p_order_number IS NOT NULL) THEN
    RAISE EXCEPTION 'Provide only one of order_id or order_number';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
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
        WHERE c.user_istid = o.user_istid
          AND c.contact_type = 'phone'
        LIMIT 1
      )
    END AS customer_phone,
    o.nif AS customer_nif,
    o.campus,
    o.pickup_deadline,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'variant_id', oi.variant_id,
          'variant_label', oi.variant_label,
          'variant_options', oi.variant_options,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )
        ORDER BY oi.id
      ), '[]'::jsonb)
      FROM neiist.order_items oi
      WHERE oi.order_id = o.id
    ) AS items,
    o.notes,
    o.discount_code,
    o.discount_amount,
    o.total_amount,
    o.payment_method,
    o.payment_reference,
    o.created_by,
    o.created_at,
    o.paid_at,
    o.payment_checked_by,
    o.delivered_at,
    o.delivered_by,
    o.updated_at,
    o.updated_by,
    o.status
  FROM neiist.orders o
  LEFT JOIN neiist.users u ON u.istid = o.user_istid
  WHERE
    (p_order_id IS NOT NULL AND o.id = p_order_id)
    OR
    (p_order_number IS NOT NULL AND o.order_number = p_order_number)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all orders data
CREATE OR REPLACE FUNCTION neiist.get_all_orders()
RETURNS TABLE (
  id INT,
  order_number TEXT,
  customer_name TEXT,
  user_istid VARCHAR(10),
  customer_email TEXT,
  customer_phone TEXT,
  customer_nif TEXT,
  campus TEXT,
  pickup_deadline TIMESTAMPTZ,
  items JSONB,
  notes TEXT,
  discount_code TEXT,
  discount_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_checked_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  updated_by TEXT,
  status neiist.shop_order_status_enum
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
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
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'variant_id', oi.variant_id,
          'variant_label', oi.variant_label,
          'variant_options', oi.variant_options,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )
        ORDER BY oi.id
      ), '[]'::jsonb)
      FROM neiist.order_items oi
      WHERE oi.order_id = o.id
    ) AS items,
    o.notes,
    o.discount_code,
    o.discount_amount,
    o.total_amount,
    o.payment_method,
    o.payment_reference,
    o.created_by,
    o.created_at,
    o.paid_at,
    o.payment_checked_by,
    o.delivered_at,
    o.delivered_by,
    o.updated_at,
    o.updated_by,
    o.status
  FROM neiist.orders o
  LEFT JOIN neiist.users u ON u.istid = o.user_istid
  ORDER BY o.created_at DESC, o.id DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update order details
CREATE OR REPLACE FUNCTION neiist.update_order(
  p_order_id INTEGER,
  p_updates JSONB,
  p_stock_override BOOLEAN DEFAULT FALSE,
  p_user_istid TEXT DEFAULT NULL
) RETURNS TABLE (
  id INTEGER,
  order_number TEXT,
  customer_name TEXT,
  user_istid VARCHAR(10),
  customer_email TEXT,
  customer_phone TEXT,
  customer_nif TEXT,
  campus TEXT,
  items JSONB,
  notes TEXT,
  discount_code TEXT,
  discount_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_checked_by TEXT,
  pickup_deadline TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  updated_by TEXT,
  status TEXT
) AS $$
DECLARE
  it JSONB;
  v_pid INTEGER;
  v_vid INTEGER;
  v_qty INTEGER;
  v_base NUMERIC(10,2);
  v_unit NUMERIC(10,2);
  v_total NUMERIC(10,2) := 0;
  v_stock_type neiist.shop_stock_type_enum;
  v_order_deadline TIMESTAMPTZ;
  v_variant_stock INTEGER;
  v_product_stock INTEGER;
  v_pname TEXT;
  v_v_label TEXT;
  v_v_opts JSONB;
  v_existing_discount_amount NUMERIC(10,2) := 0;
BEGIN
  SELECT COALESCE(o.discount_amount, 0)
    INTO v_existing_discount_amount
  FROM neiist.orders o
  WHERE o.id = p_order_id;

  IF p_updates ? 'user_istid' THEN
    UPDATE neiist.orders SET user_istid = NULLIF(p_updates->>'user_istid','') WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'nif' THEN
    UPDATE neiist.orders SET nif = p_updates->>'nif' WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'campus' THEN
    UPDATE neiist.orders SET campus = p_updates->>'campus' WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'notes' THEN
    UPDATE neiist.orders SET notes = p_updates->>'notes' WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'payment_method' THEN
    UPDATE neiist.orders SET payment_method = p_updates->>'payment_method' WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'payment_reference' THEN
    UPDATE neiist.orders SET payment_reference = p_updates->>'payment_reference' WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'created_by' THEN
    UPDATE neiist.orders SET created_by = NULLIF(p_updates->>'created_by','') WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'payment_checked_by' THEN
    UPDATE neiist.orders SET payment_checked_by = NULLIF(p_updates->>'payment_checked_by','') WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'pickup_deadline' THEN
    UPDATE neiist.orders SET pickup_deadline = NULLIF(p_updates->>'pickup_deadline','')::timestamptz WHERE neiist.orders.id = p_order_id;
  END IF;
  IF p_updates ? 'delivered_by' THEN
    UPDATE neiist.orders SET delivered_by = NULLIF(p_updates->>'delivered_by','') WHERE neiist.orders.id = p_order_id;
  END IF;

  IF p_updates ? 'items' THEN
    -- Restock previous limited-stock items before replacing the order lines.
    FOR v_pid, v_vid, v_qty IN
      SELECT oi.product_id, oi.variant_id, oi.quantity
      FROM neiist.order_items oi
      WHERE oi.order_id = p_order_id
    LOOP
      SELECT p.stock_type
        INTO v_stock_type
      FROM neiist.products p
      WHERE p.id = v_pid FOR UPDATE;

      IF v_stock_type = 'limited' AND NOT p_stock_override THEN
        IF v_vid IS NOT NULL THEN
          UPDATE neiist.product_variants
            SET stock_quantity = COALESCE(stock_quantity, 0) + v_qty,
                updated_at = NOW()
          WHERE product_variants.id = v_vid AND product_variants.product_id = v_pid;
        ELSE
          UPDATE neiist.products
          SET stock_quantity = COALESCE(stock_quantity, 0) + v_qty
          WHERE products.id = v_pid;
        END IF;
      END IF;
    END LOOP;

    DELETE FROM neiist.order_items WHERE order_id = p_order_id;

    FOR it IN SELECT * FROM jsonb_array_elements(p_updates->'items')
    LOOP
      v_pid := (it->>'product_id')::INTEGER;
      v_vid := NULLIF(it->>'variant_id','')::INTEGER;
      v_qty := (it->>'quantity')::INTEGER;

      IF v_qty IS NULL OR v_qty <= 0 THEN
        RAISE EXCEPTION 'Invalid quantity for product_id %', v_pid;
      END IF;

      SELECT p.name, p.price, p.stock_type, p.order_deadline
        INTO v_pname, v_base, v_stock_type, v_order_deadline
      FROM neiist.products p
      WHERE p.id = v_pid AND p.active = TRUE;

      IF v_pname IS NULL THEN
        RAISE EXCEPTION 'Product % not found or inactive', v_pid;
      END IF;

      IF NOT p_stock_override THEN
        IF v_stock_type = 'on_demand' AND v_order_deadline IS NOT NULL AND NOW() > v_order_deadline THEN
          RAISE EXCEPTION 'Order deadline has passed for product % (%)', v_pid, v_pname;
        END IF;
      END IF;

      IF v_vid IS NOT NULL THEN
        -- Lock variant row for stock check
        PERFORM 1 FROM neiist.product_variants WHERE product_variants.id = v_vid AND product_variants.product_id = v_pid AND product_variants.active = TRUE FOR UPDATE;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Variant % for product % not found or inactive', v_vid, v_pid;
        END IF;

        SELECT
          NULLIF((
            SELECT string_agg(pvo.option_name || ': ' || pvo.option_value, ' | ' ORDER BY pvo.option_name)
            FROM neiist.product_variant_options pvo
            WHERE pvo.variant_id = pv.id
          ), '') AS label,
          COALESCE((
            SELECT jsonb_object_agg(pvo.option_name, pvo.option_value)
            FROM neiist.product_variant_options pvo
            WHERE pvo.variant_id = pv.id
          ), '{}'::jsonb) AS options,
          pv.price_modifier,
          pv.stock_quantity
        INTO v_v_label, v_v_opts, v_unit, v_variant_stock
        FROM neiist.product_variants pv
        WHERE pv.id = v_vid AND pv.product_id = v_pid;

        v_unit := ROUND(v_base + COALESCE(v_unit, 0), 2);

        IF v_stock_type = 'limited' AND NOT p_stock_override THEN
          IF v_variant_stock IS NULL OR v_variant_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient variant stock (product %, variant %, have %, need %)',
              v_pid, v_vid, COALESCE(v_variant_stock, -1), v_qty;
          END IF;

          UPDATE neiist.product_variants
            SET stock_quantity = stock_quantity - v_qty,
                updated_at = NOW()
            WHERE product_variants.id = v_vid;
        ELSIF v_stock_type = 'limited' AND p_stock_override THEN
          NULL;
        END IF;
      ELSE
        v_v_label := NULL;
        v_v_opts := NULL;
        v_unit := ROUND(v_base, 2);

        IF v_stock_type = 'limited' AND NOT p_stock_override THEN
          SELECT p.stock_quantity INTO v_product_stock
          FROM neiist.products p
          WHERE p.id = v_pid FOR UPDATE;

          IF v_product_stock IS NULL OR v_product_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient product stock (product %, have %, need %)',
              v_pid, COALESCE(v_product_stock, -1), v_qty;
          END IF;

          UPDATE neiist.products p
          SET stock_quantity = stock_quantity - v_qty
          WHERE p.id = v_pid;
        ELSIF v_stock_type = 'limited' AND p_stock_override THEN
          NULL;
        END IF;
      END IF;

      v_total := v_total + v_unit * v_qty;

      INSERT INTO neiist.order_items(
        order_id, product_id, variant_id, product_name, variant_label, variant_options,
        quantity, unit_price, total_price
      ) VALUES (
        p_order_id, v_pid, v_vid, v_pname, v_v_label, v_v_opts,
        v_qty, v_unit, v_unit * v_qty
      );
    END LOOP;

    UPDATE neiist.orders SET total_amount = ROUND(v_total - COALESCE(v_existing_discount_amount, 0), 2), updated_by = p_user_istid WHERE neiist.orders.id = p_order_id;
  END IF;

  UPDATE neiist.orders SET updated_at = NOW(), updated_by = p_user_istid WHERE neiist.orders.id = p_order_id;

  RETURN QUERY
  SELECT
    g.id,
    g.order_number,
    g.customer_name,
    g.user_istid,
    g.customer_email,
    g.customer_phone,
    g.customer_nif,
    g.campus,
    g.items,
    g.notes,
    g.discount_code,
    g.discount_amount,
    g.total_amount,
    g.payment_method,
    g.payment_reference,
    g.created_by,
    g.created_at,
    g.paid_at,
    g.payment_checked_by,
    g.pickup_deadline,
    g.delivered_at,
    g.delivered_by,
    g.updated_at,
    g.updated_by,
    g.status::TEXT
  FROM neiist.get_all_orders() g
  WHERE g.id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the status of an order
CREATE OR REPLACE FUNCTION neiist.set_order_state(
  p_order_id INTEGER,
  p_status neiist.shop_order_status_enum,
  p_user_istid TEXT DEFAULT NULL
) RETURNS TABLE (
  id INTEGER,
  order_number TEXT,
  customer_name TEXT,
  user_istid VARCHAR(10),
  customer_email TEXT,
  customer_phone TEXT,
  customer_nif TEXT,
  campus TEXT,
  pickup_deadline TIMESTAMPTZ,
  items JSONB,
  notes TEXT,
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_checked_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  updated_by TEXT,
  status TEXT
) AS $$
BEGIN
  UPDATE neiist.orders o
  SET status = p_status,
      paid_at = CASE WHEN p_status = 'paid' THEN NOW() ELSE o.paid_at END,
        payment_checked_by = CASE WHEN p_status = 'paid' THEN COALESCE(p_user_istid, o.payment_checked_by) ELSE o.payment_checked_by END,
        delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE o.delivered_at END,
        delivered_by = CASE WHEN p_status = 'delivered' THEN COALESCE(p_user_istid, o.delivered_by) ELSE o.delivered_by END,
        updated_at = NOW(),
        updated_by = COALESCE(p_user_istid, o.updated_by)
  WHERE o.id = p_order_id;

  RETURN QUERY
  SELECT
    g.id,
    g.order_number,
    g.customer_name,
    g.user_istid,
    g.customer_email,
    g.customer_phone,
    g.customer_nif,
    g.campus,
    g.pickup_deadline,
    g.items,
    g.notes,
    g.total_amount,
    g.payment_method,
    g.payment_reference,
    g.created_by,
    g.created_at,
    g.paid_at,
    g.payment_checked_by,
    g.delivered_at,
    g.delivered_by,
    g.updated_at,
    g.updated_by,
    g.status::TEXT
  FROM neiist.get_all_orders() g
  WHERE g.id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all non-cancelled ordered quantities by product for a user within a category
CREATE OR REPLACE FUNCTION neiist.get_user_ordered_products_in_category(
  p_user_istid VARCHAR(10),
  p_category_name TEXT
) RETURNS TABLE(product_id INTEGER, total INTEGER) AS $$
  SELECT oi.product_id, SUM(oi.quantity)::INT AS total
  FROM neiist.order_items oi
  JOIN neiist.orders o ON oi.order_id = o.id
  JOIN neiist.products p ON oi.product_id = p.id
  JOIN neiist.categories c ON p.category_id = c.id
  WHERE o.user_istid = p_user_istid
    AND o.status <> 'cancelled'
    AND lower(c.name) = lower(p_category_name)
  GROUP BY oi.product_id;
$$ LANGUAGE sql SECURITY DEFINER;

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
    s.*,
    (SELECT COUNT(*) FROM neiist.votes WHERE session_id = s.id) as total_votes
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
  total_votes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.*
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
  total_votes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.*
  FROM neiist.voting_sessions_with_total_votes v
  WHERE v.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ADD VOTING SESSION
CREATE OR REPLACE FUNCTION neiist.create_voting_session(
  p_name TEXT,
  p_description TEXT,
  p_type VARCHAR(20),
  p_nominee_ids TEXT[],
  p_activity_id TEXT DEFAULT NULL,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL
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
  total_votes BIGINT
) AS $$
DECLARE
  v_session_id INTEGER;
BEGIN
  INSERT INTO neiist.voting_sessions (name, description, type, activity_id, start_at, end_at)
  VALUES (p_name, p_description, p_type, p_activity_id, p_start_at, p_end_at)
  RETURNING neiist.voting_sessions.id INTO v_session_id;

  IF p_nominee_ids IS NOT NULL AND array_length(p_nominee_ids, 1) > 0 THEN
    INSERT INTO neiist.voting_nominees (session_id, nominee_id)
    SELECT v_session_id, unnest(p_nominee_ids);
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_voting_session_by_id(v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- UPDATE VOTING SESSION
CREATE OR REPLACE FUNCTION neiist.update_voting_session(
  p_session_id INTEGER,
  p_name TEXT,
  p_description TEXT,
  p_type VARCHAR(20),
  p_nominee_ids TEXT[],
  p_activity_id TEXT DEFAULT NULL,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL
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
  total_votes BIGINT
) AS $$
BEGIN
  UPDATE neiist.voting_sessions
  SET name = p_name,
      description = p_description,
      type = p_type,
      activity_id = p_activity_id,
      start_at = p_start_at,
      end_at = p_end_at,
      updated_at = NOW()
  WHERE neiist.voting_sessions.id = p_session_id;

  -- Replace nominees
  DELETE FROM neiist.voting_nominees WHERE session_id = p_session_id;
  IF p_nominee_ids IS NOT NULL AND array_length(p_nominee_ids, 1) > 0 THEN
    INSERT INTO neiist.voting_nominees (session_id, nominee_id)
    SELECT p_session_id, unnest(p_nominee_ids);
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_voting_session_by_id(p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET SESSION NOMINEES
CREATE OR REPLACE FUNCTION neiist.get_session_nominees(p_session_id INTEGER)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  photo_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vn.nominee_id as id,
    COALESCE(u.name, vn.nominee_id) as name,
    u.photo_path
  FROM neiist.voting_nominees vn
  LEFT JOIN neiist.users u ON u.istid = vn.nominee_id
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

-- SUBMIT VOTE
CREATE OR REPLACE FUNCTION neiist.submit_vote(
  p_session_id INTEGER,
  p_voter_istid VARCHAR(10),
  p_nominee_id TEXT
) RETURNS VOID AS $$
BEGIN
  -- Check session status
  IF NOT EXISTS (SELECT 1 FROM neiist.voting_sessions WHERE id = p_session_id AND status = 'voting') THEN
    RAISE EXCEPTION 'Voting is not active for this session';
  END IF;

  -- Check if nominee is valid for this session
  IF NOT EXISTS (SELECT 1 FROM neiist.voting_nominees WHERE session_id = p_session_id AND nominee_id = p_nominee_id) THEN
    RAISE EXCEPTION 'Invalid nominee for this session';
  END IF;

  -- Insert or update vote
  INSERT INTO neiist.votes (session_id, voter_istid, nominee_id)
  VALUES (p_session_id, p_voter_istid, p_nominee_id)
  ON CONFLICT (session_id, voter_istid) DO UPDATE
  SET nominee_id = EXCLUDED.nominee_id,
      voted_at = NOW();
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
  vote_count BIGINT
) AS $$
BEGIN
  -- If session is finished, return frozen tally
  IF EXISTS (SELECT 1 FROM neiist.voting_sessions WHERE id = p_session_id AND status = 'finished') THEN
    RETURN QUERY
    SELECT 
      vr.nominee_id,
      COALESCE(u.name, vr.nominee_id) as nominee_name,
      u.photo_path as nominee_photo_path,
      vr.vote_count
    FROM neiist.voting_results vr
    LEFT JOIN neiist.users u ON u.istid = vr.nominee_id
    WHERE vr.session_id = p_session_id
    ORDER BY vr.vote_count DESC;
  ELSE
    -- Live tally
    RETURN QUERY
    SELECT 
      vn.nominee_id,
      COALESCE(u.name, vn.nominee_id) as nominee_name,
      u.photo_path as nominee_photo_path,
      COUNT(v.voter_istid)::BIGINT as vote_count
    FROM neiist.voting_nominees vn
    LEFT JOIN neiist.users u ON u.istid = vn.nominee_id
    LEFT JOIN neiist.votes v ON v.session_id = vn.session_id AND v.nominee_id = vn.nominee_id
    WHERE vn.session_id = p_session_id
    GROUP BY vn.nominee_id, u.name, u.photo_path
    ORDER BY vote_count DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET USER VOTE
CREATE OR REPLACE FUNCTION neiist.get_user_vote(p_session_id INTEGER, p_voter_istid VARCHAR(10))
RETURNS TABLE (nominee_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT v.nominee_id
  FROM neiist.votes v
  WHERE v.session_id = p_session_id AND v.voter_istid = p_voter_istid;
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