-- TENZAL Luxury Resort - Database Schema & Seed Data
-- Room Booking Module | Student ID: 22CIS0276

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'Standard',
    price_per_night DECIMAL(10,2) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    size_sqm DECIMAL(6,1),
    amenities TEXT[],
    image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(20) NOT NULL UNIQUE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(100),
    guest_phone VARCHAR(20),
    guest_count INTEGER NOT NULL DEFAULT 1,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (check_out > check_in)
);

-- 3. Indexes for performance and availability lookups
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates 
    ON bookings(room_id, check_in, check_out) 
    WHERE status NOT IN ('cancelled');

CREATE INDEX IF NOT EXISTS idx_bookings_reference 
    ON bookings(reference);

CREATE INDEX IF NOT EXISTS idx_rooms_status 
    ON rooms(status);

-- 4. Initial Seed Data (matching TENZAL Resort dashboard prototype)
INSERT INTO rooms (id, room_number, name, description, type, price_per_night, capacity, size_sqm, amenities, image_url, status, notes)
VALUES
(1, '3', 'Uva Valley View Room', 'Panoramic views overlooking the misty valley with traditional hand-crafted furniture.', 'Deluxe', 120.00, 2, 22.0, ARRAY['Four-poster bed', 'Balcony', 'Valley view'], 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', 'active', 'Valley facing, morning sunlight'),
(2, '4', 'Bridal Suite, Uva Valley', 'Luxury suite featuring an artisan canopy bed, freestanding deep-soaking bathtub, and kitchenette.', 'Suite', 125.00, 2, 35.0, ARRAY['Canopy bed', 'Kitchen', 'Bathtub', 'Balcony'], 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', 'active', 'Special honeymoon setup available'),
(3, '5', 'Indian Ocean View Room', 'Elevated vantage point offering endless horizon vistas, rainfall shower, and teak private terrace.', 'Ocean View', 125.00, 2, 35.0, ARRAY['Four-poster bed', 'Shower', 'Balcony'], 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', 'active', 'High demand room')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to continue after seed IDs
SELECT setval(pg_get_serial_sequence('rooms', 'id'), COALESCE(MAX(id), 1)) FROM rooms;

INSERT INTO bookings (id, reference, room_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, total_amount, status, notes)
VALUES
(1, 'TZ-1045', 1, 'Oliver James', 'oliver@example.com', '077 456 2210', 1, '2026-06-21', '2026-06-23', 240.00, 'completed', 'Standard booking'),
(2, 'TZ-1046', 3, 'Sofia Chen', 'sofia@example.com', '077 456 2210', 1, '2026-06-23', '2026-06-26', 375.00, 'confirmed', 'Airport pickup scheduled'),
(3, 'TZ-1047', 1, 'Nimal Perera', 'nimal@example.com', '077 456 2210', 1, '2026-06-24', '2026-06-25', 120.00, 'confirmed', 'VIP guest'),
(4, 'TZ-1048', 2, 'Amelia Hart', 'amelia@example.com', '077 456 2210', 2, '2026-06-24', '2026-06-27', 375.00, 'pending', 'Late check-in requested')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('bookings', 'id'), COALESCE(MAX(id), 1)) FROM bookings;

-- ============================================================
-- User Management + About Us Module | Student ID: 22CIS0274
-- ============================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description)
VALUES 
    (1, 'admin', 'Full administrative access to resort operations, user management, and settings'),
    (2, 'staff', 'Authorized resort staff with access to bookings, rooms, and daily operations'),
    (3, 'guest', 'Resort customer/guest with access to personal bookings, inquiries, and profile')
ON CONFLICT (name) DO NOTHING;

SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(MAX(id), 1)) FROM roles;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Sri Lanka',
    address TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- About Content table
CREATE TABLE IF NOT EXISTS about_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL DEFAULT 'About Us',
    intro TEXT NOT NULL DEFAULT 'A quiet boutique retreat in the hills of Haputale.',
    content TEXT NOT NULL DEFAULT 'Nestled amidst the emerald slopes of Haputale, TENZAL Luxury Boutique Resort is a tranquil sanctuary of serenity and elegance. Perched high above the clouds with panoramic vistas of the rolling Uva valley, we combine authentic Sri Lankan hospitality with refined contemporary luxury.',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & security
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_about_content_status ON about_content(status);

-- Seed Initial Users (Default Password: Password123!)
INSERT INTO users (id, name, email, password_hash, role_id, is_active, last_login_at, created_at, updated_at)
VALUES
    (1, 'Nadeesha Perera', 'admin@tenzal.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 1, TRUE, CURRENT_TIMESTAMP, '2024-01-10 09:00:00+00', CURRENT_TIMESTAMP),
    (2, 'Kasun Silva', 'kasun@tenzal.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 2, TRUE, '2026-06-24 08:14:00+00', '2024-03-15 10:30:00+00', CURRENT_TIMESTAMP),
    (3, 'M. Fernando', 'mfernando@tenzal.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 2, FALSE, '2026-06-21 16:45:00+00', '2024-04-01 11:00:00+00', CURRENT_TIMESTAMP),
    (4, 'Amelia Hart', 'amelia@example.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 3, TRUE, '2026-06-24 07:30:00+00', '2024-05-12 14:20:00+00', CURRENT_TIMESTAMP),
    (5, 'Nimal Perera', 'nimal@email.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 3, TRUE, '2026-06-23 18:00:00+00', '2024-06-02 08:15:00+00', CURRENT_TIMESTAMP),
    (6, 'Sofia Chen', 'sofia@email.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 3, TRUE, '2026-06-24 09:10:00+00', '2024-06-18 12:45:00+00', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;

-- Seed user profiles
INSERT INTO user_profiles (user_id, phone, country, address, created_at, updated_at)
VALUES
    (1, '+94 77 123 4567', 'Sri Lanka', 'Haputale Viewpoint Road, Haputale', '2024-01-10 09:00:00+00', CURRENT_TIMESTAMP),
    (2, '+94 71 889 2234', 'Sri Lanka', 'Temple Road, Bandarawela', '2024-03-15 10:30:00+00', CURRENT_TIMESTAMP),
    (3, '+94 72 334 5567', 'Sri Lanka', 'Main Street, Haputale', '2024-04-01 11:00:00+00', CURRENT_TIMESTAMP),
    (4, '+44 7911 123456', 'United Kingdom', '14 Kensington Crescent, London', '2024-05-12 14:20:00+00', CURRENT_TIMESTAMP),
    (5, '+94 77 555 9812', 'Sri Lanka', 'Flower Road, Colombo 07', '2024-06-02 08:15:00+00', CURRENT_TIMESTAMP),
    (6, '+82 10 2456 7890', 'South Korea', 'Gangnam-gu, Seoul', '2024-06-18 12:45:00+00', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;

-- Seed default About Us
INSERT INTO about_content (id, title, intro, content, status, updated_by)
VALUES
    (1, 'About Us', 'A quiet boutique retreat in the hills of Haputale.', 'Draft content — pending review and resort approval before publication.', 'draft', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('about_content', 'id'), COALESCE(MAX(id), 1)) FROM about_content;
