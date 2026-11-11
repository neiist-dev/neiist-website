-- Shop domain
-- Depends on: 10_users (users), 20_activities (activities)

-- ===== TYPES =====

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
  'other'
);

CREATE TYPE neiist.discount_type_enum AS ENUM (
  'percentage',
  'fixed'
);

CREATE TYPE neiist.locale_enum AS ENUM (
  'pt',
  'en'
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
  payments JSONB,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  locale neiist.locale_enum
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

-- ===== SEQUENCES =====

-- ORDER NUMBER GENERATOR
CREATE SEQUENCE neiist.order_sequence;

CREATE OR REPLACE FUNCTION neiist.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN to_char(clock_timestamp(), 'YYYYMMDD') || to_char(nextval('neiist.order_sequence'), 'FM999999');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TABLES =====

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
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  locale neiist.locale_enum NOT NULL DEFAULT 'pt'::neiist.locale_enum,
  CONSTRAINT orders_identity_mode_chk CHECK (
    user_istid IS NULL
    OR (customer_name IS NULL AND customer_email IS NULL AND customer_phone IS NULL)
  )
);

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

-- PAYMENTS
CREATE TABLE neiist.payments (
  id SERIAL PRIMARY KEY,
  method neiist.payment_method_enum NOT NULL,
  status neiist.payment_status_enum NOT NULL DEFAULT 'pending',
  reference TEXT DEFAULT NULL,
  paid_at TIMESTAMPTZ DEFAULT NULL,
  received_by VARCHAR(10) REFERENCES neiist.users(istid),
  verified_by TEXT DEFAULT NULL,
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

-- ===== INDEXES =====

-- Index for better search performance on products variants
CREATE INDEX idx_product_variants_product ON neiist.product_variants(product_id);

CREATE UNIQUE INDEX idx_pos_shifts_user_single_open 
ON neiist.pos_shifts(opened_by) 
WHERE status = 'open';

CREATE INDEX idx_orders_user_istid ON neiist.orders(user_istid) WHERE user_istid IS NOT NULL;

CREATE INDEX idx_order_items_order_number ON neiist.order_items(order_number);

CREATE INDEX idx_order_payments_order ON neiist.order_payments(order_number);

-- ===== TRIGGERS =====

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

-- ===== FUNCTIONS =====

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
    order_deadline = CASE
      WHEN (CASE
        WHEN (CASE WHEN p_data ? 'product_type' THEN (p_data->>'product_type')::neiist.product_type_enum ELSE product_type END) = 'food_drink' THEN 'untracked'::neiist.shop_stock_type_enum
        WHEN p_data ? 'stock_type' THEN (p_data->>'stock_type')::neiist.shop_stock_type_enum
        ELSE stock_type
      END) = 'limited' THEN NULL
      WHEN p_data ? 'order_deadline' THEN NULLIF(p_data->>'order_deadline', '')::TIMESTAMPTZ
      ELSE order_deadline
    END,
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

-- Atomically adjust stock on products
CREATE OR REPLACE FUNCTION neiist.change_product_stock(
  p_product_id INTEGER,
  p_variant_id INTEGER DEFAULT NULL,
  p_delta INTEGER DEFAULT NULL,
  p_set INTEGER DEFAULT NULL
) RETURNS SETOF neiist.product_record AS $$
DECLARE
  v_stock_type neiist.shop_stock_type_enum;
BEGIN
  IF p_delta IS NULL AND p_set IS NULL THEN
    RAISE EXCEPTION 'Either p_delta or p_set must be provided';
  END IF;

  SELECT stock_type INTO v_stock_type
  FROM neiist.products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  IF v_stock_type <> 'limited' THEN
    RAISE EXCEPTION 'Stock adjustment is only allowed for limited stock products (product %)', p_product_id;
  END IF;

  IF p_variant_id IS NULL THEN
    UPDATE neiist.products
    SET stock_quantity = GREATEST(0, COALESCE(p_set, COALESCE(stock_quantity, 0) + p_delta))
    WHERE id = p_product_id;
  ELSE
    UPDATE neiist.product_variants
    SET
      stock_quantity = GREATEST(0, COALESCE(p_set, COALESCE(stock_quantity, 0) + p_delta)),
      updated_at = NOW()
    WHERE id = p_variant_id AND product_id = p_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % not found for product %', p_variant_id, p_product_id;
    END IF;
  END IF;

  RETURN QUERY SELECT * FROM neiist.get_products(p_product_id, NULL, TRUE);
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
          'verified_by', p.verified_by,
          'shift_id', p.shift_id,
          'created_at', p.created_at
        )
        ORDER BY p.id
      ), '[]'::jsonb)
      FROM neiist.payments p
      JOIN neiist.order_payments op ON op.payment_id = p.id
      WHERE op.order_number = o.order_number
    ) AS payments,
    o.terms_accepted_at,
    o.terms_version,
    o.locale
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
  v_terms_accepted_at TIMESTAMPTZ;
  v_terms_version TEXT;
  v_locale neiist.locale_enum;
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
  v_pay_verified_by TEXT;
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
  v_terms_accepted_at := NULLIF(BTRIM(p_order->>'terms_accepted_at'), '')::TIMESTAMPTZ;
  v_terms_version := NULLIF(BTRIM(p_order->>'terms_version'), '');
  v_locale := CASE WHEN LOWER(BTRIM(COALESCE(p_order->>'locale', ''))) = 'en' THEN 'en'::neiist.locale_enum ELSE 'pt'::neiist.locale_enum END;

  v_pay := p_order->'payment';
  IF v_pay IS NOT NULL AND v_pay->>'method' IS NULL THEN
    v_pay := NULL;
  END IF;

  IF v_pay IS NOT NULL THEN
    v_pay_method := (v_pay->>'method')::neiist.payment_method_enum;
    v_pay_shift_id := NULLIF(v_pay->>'shift_id', '')::UUID;
    v_pay_amount := COALESCE((v_pay->>'amount')::NUMERIC, 0.00);
    v_pay_status := COALESCE((v_pay->>'status')::neiist.payment_status_enum, 'pending');
    v_pay_received_by := NULLIF(v_pay->>'received_by', '');
    v_pay_verified_by := NULLIF(v_pay->>'verified_by', '');
    v_pay_ref := CASE
      WHEN v_pay_method = 'cash'::neiist.payment_method_enum THEN NULL
      ELSE NULLIF(v_pay->>'reference', '')
    END;

    IF v_pay_method IN ('cash'::neiist.payment_method_enum, 'tpa'::neiist.payment_method_enum) AND v_pay_status = 'successful' THEN
      IF v_pay_shift_id IS NULL THEN
        RAISE EXCEPTION 'shift_id is required for POS payment method %', v_pay_method;
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
    order_source, created_by, terms_accepted_at, terms_version, locale
  ) VALUES (
    v_order_number, v_user_istid, v_cust_name, v_cust_email, v_cust_phone,
    v_nif, v_campus, v_notes, v_discount_code, v_discount_amount, 0.00,
    v_source, v_created_by, v_terms_accepted_at, v_terms_version, v_locale
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
      IF v_stock_type <> 'limited' AND v_order_deadline IS NOT NULL AND NOW() > v_order_deadline THEN
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
      method, status, reference, paid_at, received_by, verified_by, shift_id
    ) VALUES (
      v_pay_method, v_pay_status, v_pay_ref,
      CASE WHEN v_pay_status = 'successful' THEN NOW() END,
      v_pay_received_by, v_pay_verified_by, v_pay_shift_id
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
  p_reference TEXT DEFAULT NULL,
  p_verified_by TEXT DEFAULT NULL
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
          verified_by = COALESCE(p_verified_by, verified_by),
          shift_id = p_shift_id
        WHERE id = v_single_pending_payment_id;
        v_payment_id := v_single_pending_payment_id;
      ELSE
        INSERT INTO neiist.payments (
          method, status, reference, paid_at, received_by, verified_by, shift_id
        ) VALUES (
          p_method, 'successful', v_effective_ref, NOW(), p_by, p_verified_by, p_shift_id
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
    ROUND(s.initial_float + COALESCE(cash.total, 0.00), 2)::NUMERIC(10,2) AS expected_cash,
    (CASE
      WHEN s.final_cash_counted IS NOT NULL
      THEN ROUND(s.final_cash_counted - (s.initial_float + COALESCE(cash.total, 0.00)), 2)
    END)::NUMERIC(10,2) AS cash_variance,
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
DECLARE
  v_status neiist.shop_order_status_enum;
BEGIN
  PERFORM 1 FROM neiist.orders WHERE order_number = p_order_number FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_number;
  END IF;

  v_status := neiist.compute_order_status(p_order_number);
  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled order % cannot be updated', p_order_number;
  END IF;

  UPDATE neiist.orders
  SET customer_name = CASE WHEN user_istid IS NULL AND p_updates ? 'customer_name' THEN NULLIF(BTRIM(p_updates->>'customer_name'), '') ELSE customer_name END,
    customer_email = CASE WHEN user_istid IS NULL AND p_updates ? 'customer_email' THEN NULLIF(BTRIM(p_updates->>'customer_email'), '') ELSE customer_email END,
    customer_phone = CASE WHEN user_istid IS NULL AND p_updates ? 'customer_phone' THEN NULLIF(BTRIM(p_updates->>'customer_phone'), '') ELSE customer_phone END,
    nif = CASE WHEN p_updates ? 'customer_nif' THEN NULLIF(BTRIM(p_updates->>'customer_nif'), '')
      WHEN p_updates ? 'nif' THEN NULLIF(BTRIM(p_updates->>'nif'), '')
      ELSE nif END,
    campus = CASE WHEN p_updates ? 'campus' THEN NULLIF(BTRIM(p_updates->>'campus'), '') ELSE campus END,
    notes = CASE WHEN p_updates ? 'notes' THEN NULLIF(BTRIM(p_updates->>'notes'), '') ELSE notes END,
    pickup_deadline = CASE WHEN p_updates ? 'pickup_deadline' THEN NULLIF(BTRIM(p_updates->>'pickup_deadline'), '')::TIMESTAMPTZ ELSE pickup_deadline END,
    updated_at = NOW(),
    updated_by = p_user_istid
  WHERE order_number = p_order_number;

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

-- Set Campus Schedule Slots
CREATE OR REPLACE FUNCTION neiist.set_campus_schedule_slots(
  p_campus TEXT,
  p_slots JSONB
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
  DELETE FROM neiist.campus_schedule_slots WHERE campus = p_campus;

  IF p_slots IS NOT NULL AND jsonb_array_length(p_slots) > 0 THEN
    INSERT INTO neiist.campus_schedule_slots (campus, day_of_week, start_time, end_time)
    SELECT
      p_campus,
      (elem->>'day_of_week')::INT,
      (elem->>'start_time')::TIME,
      (elem->>'end_time')::TIME
    FROM jsonb_array_elements(p_slots) AS elem;
  END IF;

  RETURN QUERY
  SELECT * FROM neiist.get_campus_schedule_slots(p_campus);
END;
$$;
