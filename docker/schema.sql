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
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);

-- ORDER NUMBER GENERATOR
CREATE SEQUENCE neiist.order_sequence;

CREATE OR REPLACE FUNCTION neiist.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || to_char(NOW(), 'YYYY') || LPAD(nextval('neiist.order_sequence')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE
CREATE TABLE neiist.users (
  istid VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
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

-- NEIIST EVENTS
CREATE TABLE neiist.activities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image TEXT NOT NULL
);

-- SHOP CATEGORIES
CREATE TABLE neiist.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
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
  order_deadline DATE,
  estimated_delivery DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_products_stock
    CHECK (
      (stock_type = 'limited' AND (stock_quantity IS NULL OR stock_quantity >= 0))
      OR (stock_type = 'on_demand')
    )
);

-- PRODUCTS VARIENTS
CREATE TABLE neiist.product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES neiist.products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_value TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  price_multiplier NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER,
  size TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (product_id, variant_name, variant_value)
);

-- ORDERS
CREATE TABLE neiist.orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT neiist.generate_order_number(),
  user_istid VARCHAR(10) REFERENCES neiist.users(istid),
  nif TEXT,
  campus TEXT,
  notes TEXT,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status neiist.shop_order_status_enum NOT NULL DEFAULT 'pending'
);

CREATE TABLE neiist.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES neiist.orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES neiist.products(id),
  variant_id INTEGER REFERENCES neiist.product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  variant_value TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

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
  teams VARCHAR(30)[]
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
    COALESCE(team_list.team_array, ARRAY[]::VARCHAR(30)[]) AS teams
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
  p_courses TEXT[]
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
  teams VARCHAR(30)[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO neiist.users (istid, name, email, photo_path)
  VALUES (p_istid, p_name, p_email, p_photo_path);

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
  photo_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.istid,
    u.name,
    u.email,
    (SELECT contact_value FROM neiist.user_contacts WHERE user_istid = u.istid AND contact_type = 'phone' LIMIT 1) AS phone,
    ARRAY(SELECT course_name FROM neiist.user_courses WHERE user_istid = u.istid) AS courses,
    u.photo_path
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
  teams VARCHAR(30)[]
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
    COALESCE(user_teams.teams_array, ARRAY[]::VARCHAR(30)[]) as teams
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
  teams VARCHAR(30)[]
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
    -- Reset all preferred flags for this user
    UPDATE neiist.user_contacts SET is_preferred = FALSE WHERE user_istid = p_istid;
    -- Set preferred flag for the specified contact type if it exists
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
      FROM jsonb_array_elements_text(p_updates->'courses');
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

-- Create a new event
CREATE OR REPLACE FUNCTION neiist.add_event(
  p_title TEXT,
  p_description TEXT,
  p_image TEXT
) RETURNS INTEGER AS $$
DECLARE
  new_id INTEGER;
BEGIN
  INSERT INTO neiist.activities (title, description, image)
  VALUES (p_title, p_description, p_image)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all events
CREATE OR REPLACE FUNCTION neiist.get_all_events()
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  description TEXT,
  image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT activities.id, activities.title, activities.description, activities.image
  FROM neiist.activities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check Product Category
CREATE OR REPLACE FUNCTION neiist.verify_category(p_name TEXT)
RETURNS INTEGER AS $$
DECLARE v_id INTEGER;
BEGIN
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO neiist.categories(name) VALUES (p_name)
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate varient price from base and multiplier
CREATE OR REPLACE FUNCTION neiist.get_variant_price(p_base NUMERIC, p_multiplier NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(p_base * (1 + COALESCE(p_multiplier, 0)) - p_base, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a new product and varients if existent
CREATE OR REPLACE FUNCTION neiist.add_product(
  p_name TEXT,
  p_description TEXT,
  p_price NUMERIC(10,2),
  p_images TEXT[],
  p_category TEXT,
  p_stock_type neiist.shop_stock_type_enum,
  p_stock_quantity INTEGER,
  p_order_deadline DATE,
  p_estimated_delivery DATE,
  p_active BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  size TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline DATE,
  estimated_delivery DATE,
  variants JSONB
) AS $$
DECLARE
  v_cat_id INTEGER;
  v_id INTEGER;
BEGIN
  -- Avoid ambiguous "name" by using existing helper instead of explicit INSERT with (name)
  IF p_category IS NOT NULL AND length(trim(p_category)) > 0 THEN
    v_cat_id := neiist.verify_category(p_category);
  END IF;

  INSERT INTO neiist.products(
    name, description, price, images, category_id, stock_type, stock_quantity,
    order_deadline, estimated_delivery, active
  ) VALUES (
    p_name, p_description, p_price, COALESCE(p_images,'{}'),
    v_cat_id, p_stock_type, p_stock_quantity, p_order_deadline, p_estimated_delivery, COALESCE(p_active, TRUE)
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
    NULL::TEXT AS size,
    pr.stock_type::TEXT,
    pr.stock_quantity,
    pr.order_deadline,
    pr.estimated_delivery,
    '[]'::JSONB AS variants
  FROM neiist.products pr
  LEFT JOIN neiist.categories c ON c.id = pr.category_id
  WHERE pr.id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a new product varient
CREATE OR REPLACE FUNCTION neiist.add_product_variant(
  p_product_id INTEGER,
  p_variant_name TEXT,
  p_variant_value TEXT,
  p_images TEXT[],
  p_price_multiplier NUMERIC(10,2),
  p_stock_quantity INTEGER,
  p_size TEXT,
  p_active BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  images TEXT[],
  category TEXT,
  size TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline DATE,
  estimated_delivery DATE,
  variants JSONB
) AS $$
DECLARE
  v_product neiist.products%ROWTYPE;
  v_category TEXT;
BEGIN
  INSERT INTO neiist.product_variants(
    product_id, variant_name, variant_value, images, price_multiplier,
    stock_quantity, size, active
  ) VALUES (
    p_product_id, p_variant_name, p_variant_value, COALESCE(p_images, '{}'),
    COALESCE(p_price_multiplier, 0), p_stock_quantity, p_size, COALESCE(p_active, TRUE)
  )
  ON CONFLICT (product_id, variant_name, variant_value) DO UPDATE
    SET images = EXCLUDED.images,
        price_multiplier = EXCLUDED.price_multiplier,
        stock_quantity = EXCLUDED.stock_quantity,
        size = EXCLUDED.size,
        active = EXCLUDED.active;

  -- Qualify id to avoid ambiguity with OUT param
  SELECT * INTO v_product
  FROM neiist.products p
  WHERE p.id = p_product_id;

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
    NULL::TEXT AS size,
    v_product.stock_type::TEXT,
    v_product.stock_quantity,
    v_product.order_deadline,
    v_product.estimated_delivery,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', pv.id,
        'variant_name', pv.variant_name,
        'variant_value', pv.variant_value,
        'images', pv.images,
        'price_modifier', neiist.get_variant_price(v_product.price, pv.price_multiplier),
        'stock_quantity', pv.stock_quantity,
        'size', pv.size,
        'active', pv.active
      ) ORDER BY pv.id)
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
  size TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline DATE,
  estimated_delivery DATE,
  variants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.description, p.price, p.images,
    c.name AS category,
    NULL::TEXT AS size,
    p.stock_type::TEXT, p.stock_quantity, p.order_deadline, p.estimated_delivery,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id,
        'variant_name', v.variant_name,
        'variant_value', v.variant_value,
        'images', v.images,
        'price_modifier', neiist.get_variant_price(p.price, v.price_multiplier),
        'stock_quantity', v.stock_quantity,
        'size', v.size,
        'active', v.active
      ) ORDER BY v.id)
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
  size TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline DATE,
  estimated_delivery DATE,
  variants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.description, p.price, p.images,
    c.name AS category,
    NULL::TEXT AS size,
    p.stock_type::TEXT, p.stock_quantity, p.order_deadline, p.estimated_delivery,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id,
        'variant_name', v.variant_name,
        'variant_value', v.variant_value,
        'images', v.images,
        'price_modifier', neiist.get_variant_price(p.price, v.price_multiplier),
        'stock_quantity', v.stock_quantity,
        'size', v.size,
        'active', v.active
      ) ORDER BY v.id)
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
  size TEXT,
  stock_type TEXT,
  stock_quantity INTEGER,
  order_deadline DATE,
  estimated_delivery DATE,
  variants JSONB
) AS $$
DECLARE
  v_cat_id INTEGER;
BEGIN
  IF p_updates ? 'category' THEN
    v_cat_id := neiist.verify_category(p_updates->>'category');
    UPDATE neiist.products SET category_id = v_cat_id WHERE products.id = p_product_id;
  END IF;

  IF p_updates ? 'name' THEN
    UPDATE neiist.products SET name = p_updates->>'name' WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'description' THEN
    UPDATE neiist.products SET description = p_updates->>'description' WHERE products.id = p_product_id;
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
    UPDATE neiist.products SET order_deadline = NULLIF(p_updates->>'order_deadline','')::DATE WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'estimated_delivery' THEN
    UPDATE neiist.products SET estimated_delivery = NULLIF(p_updates->>'estimated_delivery','')::DATE WHERE products.id = p_product_id;
  END IF;
  IF p_updates ? 'active' THEN
    UPDATE neiist.products SET active = (p_updates->>'active')::BOOLEAN WHERE products.id = p_product_id;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_product(p_product_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update a product varient data
CREATE OR REPLACE FUNCTION neiist.update_product_variant(
  p_product_id INTEGER,
  p_variant_id INTEGER,
  p_updates JSONB
) RETURNS TABLE (
  id INTEGER,
  product_id INTEGER,
  variant_name TEXT,
  variant_value TEXT,
  images TEXT[],
  price_modifier NUMERIC(10,2),
  stock_quantity INTEGER,
  size TEXT,
  active BOOLEAN
) AS $$
BEGIN
  IF p_updates ? 'variant_name' THEN
    UPDATE neiist.product_variants SET variant_name = p_updates->>'variant_name' WHERE product_variants.id = p_variant_id AND product_variants.product_id = p_product_id;
  END IF;
  IF p_updates ? 'variant_value' THEN
    UPDATE neiist.product_variants SET variant_value = p_updates->>'variant_value' WHERE product_variants.id = p_variant_id AND product_variants.product_id = p_product_id;
  END IF;
  IF p_updates ? 'images' THEN
    UPDATE neiist.product_variants SET images = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'images')), '{}') WHERE product_variants.id = p_variant_id AND product_variants.product_id = p_product_id;
  END IF;
  IF p_updates ? 'price_multiplier' THEN
    UPDATE neiist.product_variants SET price_multiplier = (p_updates->>'price_multiplier')::NUMERIC WHERE product_variants.id = p_variant_id AND product_variants.product_id = p_product_id;
  ELSIF p_updates ? 'price_modifier' THEN
    UPDATE neiist.product_variants v
    SET price_multiplier = GREATEST(ROUND((( (p_updates->>'price_modifier')::NUMERIC + p.price ) / NULLIF(p.price,0)) - 1, 4), 0)
    FROM neiist.products p
    WHERE v.id = p_variant_id AND v.product_id = p_product_id AND p.id = v.product_id;
  END IF;
  IF p_updates ? 'stock_quantity' THEN
    UPDATE neiist.product_variants SET stock_quantity = NULLIF(p_updates->>'stock_quantity','')::INTEGER WHERE product_variants.id = p_variant_id AND product_variants.product_id = p_product_id;
  END IF;
  IF p_updates ? 'size' THEN
    UPDATE neiist.product_variants SET size = p_updates->>'size' WHERE product_variants.id = p_variant_id AND product_variants.product_id = p_product_id;
  END IF;
  IF p_updates ? 'active' THEN
    UPDATE neiist.product_variants SET active = (p_updates->>'active')::BOOLEAN WHERE product_variants.id = p_variant_id AND product_variants.product_id = p_product_id;
  END IF;

  RETURN QUERY
  SELECT
    v.id, v.product_id, v.variant_name, v.variant_value, v.images,
    neiist.get_variant_price(p.price, v.price_multiplier) AS price_modifier,
    v.stock_quantity, v.size, v.active
  FROM neiist.product_variants v
  JOIN neiist.products p ON p.id = v.product_id
  WHERE v.id = p_variant_id AND v.product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New order created
CREATE OR REPLACE FUNCTION neiist.new_order(
  p_user_istid VARCHAR(10),
  p_nif TEXT,
  p_campus TEXT,
  p_notes TEXT,
  p_payment_method TEXT,
  p_payment_reference TEXT,
  p_items JSONB
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
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  status TEXT
) AS $$
DECLARE
  v_order_id INTEGER;
  it JSONB;
  v_pid INTEGER;
  v_vid INTEGER;
  v_qty INTEGER;
  v_base NUMERIC(10,2);
  v_mult NUMERIC(10,2);
  v_unit NUMERIC(10,2);
  v_total NUMERIC(10,2) := 0;
  v_stock_type neiist.shop_stock_type_enum;
  v_variant_stock INTEGER;
  v_product_stock INTEGER;
  v_pname TEXT;
  v_vname TEXT;
  v_vvalue TEXT;
BEGIN
  INSERT INTO neiist.orders(user_istid, nif, campus, notes, payment_method, payment_reference)
  VALUES (p_user_istid, p_nif, p_campus, p_notes, p_payment_method, p_payment_reference)
  RETURNING orders.id INTO v_order_id;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (it->>'product_id')::INTEGER;
    v_vid := NULLIF(it->>'variant_id','')::INTEGER;
    v_qty := (it->>'quantity')::INTEGER;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product_id %', v_pid;
    END IF;

    SELECT p.name, p.price, p.stock_type, p.stock_quantity
      INTO v_pname, v_base, v_stock_type, v_product_stock
    FROM neiist.products p
    WHERE p.id = v_pid AND p.active = TRUE;

    IF v_pname IS NULL THEN
      RAISE EXCEPTION 'Product % not found or inactive', v_pid;
    END IF;

    IF v_vid IS NOT NULL THEN
      SELECT pv.variant_name, pv.variant_value, pv.price_multiplier, pv.stock_quantity
        INTO v_vname, v_vvalue, v_mult, v_variant_stock
      FROM neiist.product_variants pv
      WHERE pv.id = v_vid AND pv.product_id = v_pid AND pv.active = TRUE;

      IF v_vname IS NULL THEN
        RAISE EXCEPTION 'Variant % for product % not found or inactive', v_vid, v_pid;
      END IF;
    ELSE
      v_vname := NULL;
      v_vvalue := NULL;
      v_mult := 0;
    END IF;

    v_unit := ROUND(v_base * (1 + COALESCE(v_mult, 0)), 2);
    v_total := v_total + v_unit * v_qty;

    IF v_stock_type = 'limited' THEN
      IF v_vid IS NOT NULL THEN
        SELECT pv.stock_quantity INTO v_variant_stock
        FROM neiist.product_variants pv
        WHERE pv.id = v_vid FOR UPDATE;

        IF v_variant_stock IS NULL OR v_variant_stock < v_qty THEN
          RAISE EXCEPTION 'Insufficient variant stock (product %, variant %, have %, need %)',
            v_pid, v_vid, COALESCE(v_variant_stock, -1), v_qty;
        END IF;

        UPDATE neiist.product_variants
        SET stock_quantity = stock_quantity - v_qty
        WHERE product_variants.id = v_vid;
      ELSE
        SELECT p.stock_quantity INTO v_product_stock
        FROM neiist.products p
        WHERE p.id = v_pid FOR UPDATE;

        IF v_product_stock IS NULL OR v_product_stock < v_qty THEN
          RAISE EXCEPTION 'Insufficient product stock (product %, have %, need %)',
            v_pid, COALESCE(v_product_stock, -1), v_qty;
        END IF;

        UPDATE neiist.products
        SET stock_quantity = stock_quantity - v_qty
        WHERE products.id = v_pid;
      END IF;
    END IF;

    INSERT INTO neiist.order_items(
      order_id, product_id, variant_id, product_name, variant_name, variant_value,
      quantity, unit_price, total_price
    ) VALUES (
      v_order_id, v_pid, v_vid, v_pname, v_vname, v_vvalue, v_qty, v_unit, v_unit * v_qty
    );
  END LOOP;

  UPDATE neiist.orders SET total_amount = ROUND(v_total, 2) WHERE orders.id = v_order_id;

  RETURN QUERY
  SELECT
    o.id, o.order_number,
    COALESCE(u.name, '') AS customer_name,
    o.user_istid,
    u.email AS customer_email,
    (SELECT c.contact_value FROM neiist.user_contacts c WHERE c.user_istid = o.user_istid AND c.contact_type = 'phone' LIMIT 1) AS customer_phone,
    o.nif AS customer_nif,
    o.campus,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'variant_id', oi.variant_id,
        'variant_info', CASE
          WHEN oi.variant_name IS NOT NULL AND oi.variant_value IS NOT NULL
          THEN oi.variant_name || ': ' || oi.variant_value
          ELSE NULL
        END,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      ) ORDER BY oi.id)
      FROM neiist.order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::JSONB) AS items,
    o.notes, o.total_amount, o.payment_method, o.payment_reference,
    o.created_at, o.paid_at, o.paid_by, o.delivered_at, o.delivered_by, o.updated_at,
    o.status::TEXT
  FROM neiist.orders o
  LEFT JOIN neiist.users u ON u.istid = o.user_istid
  WHERE o.id = v_order_id;
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
  items JSONB,
  notes TEXT,
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  status neiist.shop_order_status_enum
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    COALESCE(u.name, '') AS customer_name,
    o.user_istid,
    u.email AS customer_email,
    (
      SELECT c.contact_value
      FROM neiist.user_contacts c
      WHERE c.user_istid = o.user_istid AND c.contact_type = 'phone'
      LIMIT 1
    ) AS customer_phone,
    o.nif AS customer_nif,
    o.campus,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'variant_id', oi.variant_id,
          'variant_info',
             CASE
               WHEN oi.variant_name IS NOT NULL
                 THEN oi.variant_name || ': ' || oi.variant_value
               ELSE NULL
             END,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        ) ORDER BY oi.id
      )
      FROM neiist.order_items oi
      WHERE oi.order_id = o.id
    ) AS items,
    o.notes,
    o.total_amount,
    o.payment_method,
    o.payment_reference,
    o.created_at,
    o.paid_at,
    o.paid_by,
    o.delivered_at,
    o.delivered_by,
    o.updated_at,
    o.status
  FROM neiist.orders o
  LEFT JOIN neiist.users u ON u.istid = o.user_istid
  ORDER BY o.created_at DESC, o.id DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update order details
CREATE OR REPLACE FUNCTION neiist.update_order(
  p_order_id INTEGER,
  p_updates JSONB
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
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  IF p_updates ? 'user_istid' THEN
    UPDATE neiist.orders SET user_istid = NULLIF(p_updates->>'user_istid','') WHERE id = p_order_id;
  END IF;
  IF p_updates ? 'nif' THEN
    UPDATE neiist.orders SET nif = p_updates->>'nif' WHERE id = p_order_id;
  END IF;
  IF p_updates ? 'campus' THEN
    UPDATE neiist.orders SET campus = p_updates->>'campus' WHERE id = p_order_id;
  END IF;
  IF p_updates ? 'notes' THEN
    UPDATE neiist.orders SET notes = p_updates->>'notes' WHERE id = p_order_id;
  END IF;
  IF p_updates ? 'payment_method' THEN
    UPDATE neiist.orders SET payment_method = p_updates->>'payment_method' WHERE id = p_order_id;
  END IF;
  IF p_updates ? 'payment_reference' THEN
    UPDATE neiist.orders SET payment_reference = p_updates->>'payment_reference' WHERE id = p_order_id;
  END IF;
  IF p_updates ? 'paid_by' THEN
    UPDATE neiist.orders SET paid_by = NULLIF(p_updates->>'paid_by','') WHERE id = p_order_id;
  END IF;
  IF p_updates ? 'delivered_by' THEN
    UPDATE neiist.orders SET delivered_by = NULLIF(p_updates->>'delivered_by','') WHERE id = p_order_id;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_all_orders() WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the status of an order
CREATE OR REPLACE FUNCTION neiist.set_order_state(
  p_order_id INTEGER,
  p_status neiist.shop_order_status_enum,
  p_actor TEXT DEFAULT NULL
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
  total_amount NUMERIC(10,2),
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  updated_at TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  UPDATE neiist.orders o
  SET status = p_status,
      paid_at = CASE WHEN p_status = 'paid' THEN NOW() ELSE o.paid_at END,
      paid_by = CASE WHEN p_status = 'paid' THEN COALESCE(p_actor, o.paid_by) ELSE o.paid_by END,
      delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE o.delivered_at END,
      delivered_by = CASE WHEN p_status = 'delivered' THEN COALESCE(p_actor, o.delivered_by) ELSE o.delivered_by END,
      updated_at = NOW()
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
    g.items,
    g.notes,
    g.total_amount,
    g.payment_method,
    g.payment_reference,
    g.created_at,
    g.paid_at,
    g.paid_by,
    g.delivered_at,
    g.delivered_by,
    g.updated_at,
    g.status::TEXT
  FROM neiist.get_all_orders() g
  WHERE g.id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all available product categories
CREATE OR REPLACE FUNCTION neiist.get_all_categories()
RETURNS TABLE (
  id INTEGER,
  name TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT categories.id, categories.name FROM neiist.categories ORDER BY categories.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;