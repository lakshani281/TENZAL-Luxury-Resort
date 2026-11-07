-- =============================================================================
-- Migration: 001_create_food_ordering_tables.sql
-- Module: Food Ordering (Student ID: 22CIS0328)
-- Project: TENZAL Luxury Resort
-- Target Database: PostgreSQL 17 (Supabase)
-- Description: Creates the 5 core tables, constraints, triggers and indexes
--              for the Food Ordering module.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Reusable Trigger Function for updated_at timestamps
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. Table: food_categories
-- Categorizes culinary offerings (e.g., Breakfast, Lunch, Dinner, Drinks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_food_categories_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_food_categories_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_food_categories_display_order CHECK (display_order >= 0)
);

-- Trigger for food_categories updated_at
DROP TRIGGER IF EXISTS trg_food_categories_updated_at ON food_categories;
CREATE TRIGGER trg_food_categories_updated_at
BEFORE UPDATE ON food_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. Table: food_items
-- Stores culinary dishes, pricing in LKR, daily specials windowing & availability
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_items (
    item_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    prep_time_minutes INT NOT NULL DEFAULT 20,
    image_url VARCHAR(500) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_special BOOLEAN NOT NULL DEFAULT FALSE,
    special_badge VARCHAR(50),
    special_start_at TIMESTAMPTZ,
    special_end_at TIMESTAMPTZ,
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_food_items_category FOREIGN KEY (category_id)
        REFERENCES food_categories (category_id) ON DELETE RESTRICT,
    CONSTRAINT chk_food_items_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_food_items_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT chk_food_items_price_non_negative CHECK (price >= 0),
    CONSTRAINT chk_food_items_prep_time_positive CHECK (prep_time_minutes > 0),
    CONSTRAINT chk_food_items_image_url_not_empty CHECK (LENGTH(TRIM(image_url)) > 0),
    CONSTRAINT chk_food_items_special_window CHECK (
        special_end_at IS NULL OR special_start_at IS NULL OR special_end_at >= special_start_at
    )
);

-- Trigger for food_items updated_at
DROP TRIGGER IF EXISTS trg_food_items_updated_at ON food_items;
CREATE TRIGGER trg_food_items_updated_at
BEFORE UPDATE ON food_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. Table: orders
-- Stores customer in-room dining orders, room destinations, financial totals & status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    room_number VARCHAR(50) NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    customer_id VARCHAR(64), -- Nullable placeholder for shared User Management module integration (INT or UUID)
    special_note TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    service_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    estimated_delivery_minutes INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_orders_code_not_empty CHECK (LENGTH(TRIM(order_code)) > 0),
    CONSTRAINT chk_orders_room_number_not_empty CHECK (LENGTH(TRIM(room_number)) > 0),
    CONSTRAINT chk_orders_room_name_not_empty CHECK (LENGTH(TRIM(room_name)) > 0),
    CONSTRAINT chk_orders_subtotal_non_negative CHECK (subtotal >= 0),
    CONSTRAINT chk_orders_service_charge_non_negative CHECK (service_charge >= 0),
    CONSTRAINT chk_orders_total_amount_non_negative CHECK (total_amount >= 0),
    CONSTRAINT chk_orders_status_valid CHECK (
        status IN ('Pending', 'In Kitchen', 'Out for Delivery', 'Delivered', 'Cancelled')
    ),
    CONSTRAINT chk_orders_estimated_delivery_positive CHECK (estimated_delivery_minutes > 0)
);

-- Trigger for orders updated_at
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. Table: order_details
-- Stores line items for orders with immutable historical name and price snapshots
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_details (
    order_detail_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_details_order FOREIGN KEY (order_id)
        REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_details_item FOREIGN KEY (item_id)
        REFERENCES food_items (item_id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_details_item_name_not_empty CHECK (LENGTH(TRIM(item_name)) > 0),
    CONSTRAINT chk_order_details_unit_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT chk_order_details_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_order_details_line_total_non_negative CHECK (line_total >= 0)
);

-- -----------------------------------------------------------------------------
-- 5. Table: order_status_history
-- Immutable audit log for order lifecycle tracking and turnaround SLA monitoring
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
    history_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_user_id VARCHAR(64), -- Nullable placeholder for shared User Management module integration (INT or UUID)
    change_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id)
        REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT chk_order_status_history_previous_valid CHECK (
        previous_status IS NULL OR previous_status IN ('Pending', 'In Kitchen', 'Out for Delivery', 'Delivered', 'Cancelled')
    ),
    CONSTRAINT chk_order_status_history_new_valid CHECK (
        new_status IN ('Pending', 'In Kitchen', 'Out for Delivery', 'Delivered', 'Cancelled')
    )
);

-- -----------------------------------------------------------------------------
-- 6. Indexes for Performance & Query Optimization
-- -----------------------------------------------------------------------------

-- food_items indexes
CREATE INDEX IF NOT EXISTS idx_food_items_category_id
    ON food_items (category_id);

CREATE INDEX IF NOT EXISTS idx_food_items_specials_window
    ON food_items (is_special, is_available, special_start_at, special_end_at);

-- orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_room_status
    ON orders (room_number, status);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
    ON orders (status, created_at DESC);

-- order_details indexes
CREATE INDEX IF NOT EXISTS idx_order_details_order_id
    ON order_details (order_id);

CREATE INDEX IF NOT EXISTS idx_order_details_item_id
    ON order_details (item_id);

-- order_status_history indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_timeline
    ON order_status_history (order_id, created_at ASC);
