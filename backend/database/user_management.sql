-- ============================================================
-- TENZAL Luxury Resort - Database Schema & Seed Data
-- User Management + About Us Module | Student ID: 22CIS0274
-- ============================================================

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed initial roles
INSERT INTO roles (id, name, description)
VALUES 
    (1, 'admin', 'Full administrative access to resort operations, user management, and settings'),
    (2, 'staff', 'Authorized resort staff with access to bookings, rooms, and daily operations'),
    (3, 'guest', 'Resort customer/guest with access to personal bookings, inquiries, and profile')
ON CONFLICT (name) DO NOTHING;

SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(MAX(id), 1)) FROM roles;

-- 3. Create users table
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

-- 4. Create user_profiles table
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

-- 5. Create about_content table for Resort Story / About Us editorial content
CREATE TABLE IF NOT EXISTS about_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL DEFAULT 'About Us',
    intro TEXT NOT NULL DEFAULT 'A quiet boutique retreat in the hills of Haputale.',
    content TEXT NOT NULL DEFAULT 'Nestled amidst the emerald slopes of Haputale, TENZAL Luxury Boutique Resort is a tranquil sanctuary of serenity and elegance. Perched high above the clouds with panoramic vistas of the rolling Uva valley, we combine authentic Sri Lankan hospitality with refined contemporary luxury. Every suite is thoughtfully curated with local timber furnishings, deep-soaking bathtubs, private misty balconies, and warm personalized service.',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Indexes for security, lookup speed, and integrity
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_about_content_status ON about_content(status);

-- 7. Seed Initial Users and Profiles
-- All default seed accounts use the password: Password123!
-- Bcrypt hash generated with 10 salt rounds: $2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC
-- Evaluators can test login immediately with:
-- 1. Administrator: nadeesha@tenzal.com (or admin@tenzal.com) / Password123!
-- 2. Staff: kasun@tenzal.com / Password123!
-- 3. Staff: mfernando@tenzal.com / Password123!
-- 4. Customer: amelia@example.com / Password123!
-- 5. Customer: nimal@email.com / Password123!
-- 6. Customer: sofia@email.com / Password123!

INSERT INTO users (id, name, email, password_hash, role_id, is_active, last_login_at, created_at, updated_at)
VALUES
    (1, 'Nadeesha Perera', 'admin@tenzal.com', '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC', 1, TRUE, CURRENT_TIMESTAMP, '2024-01-10 09:00:00+00', CURRENT_TIMESTAMP),
    (2, 'Kasun Silva', 'kasun@tenzal.com', '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC', 2, TRUE, '2026-06-24 08:14:00+00', '2024-03-15 10:30:00+00', CURRENT_TIMESTAMP),
    (3, 'M. Fernando', 'mfernando@tenzal.com', '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC', 2, FALSE, '2026-06-21 16:45:00+00', '2024-04-01 11:00:00+00', CURRENT_TIMESTAMP),
    (4, 'Amelia Hart', 'amelia@example.com', '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC', 3, TRUE, '2026-06-24 07:30:00+00', '2024-05-12 14:20:00+00', CURRENT_TIMESTAMP),
    (5, 'Nimal Perera', 'nimal@email.com', '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC', 3, TRUE, '2026-06-23 18:00:00+00', '2024-06-02 08:15:00+00', CURRENT_TIMESTAMP),
    (6, 'Sofia Chen', 'sofia@email.com', '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC', 3, TRUE, '2026-06-24 09:10:00+00', '2024-06-18 12:45:00+00', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;

-- 8. Seed user profiles
INSERT INTO user_profiles (user_id, phone, country, address, created_at, updated_at)
VALUES
    (1, '+94 77 123 4567', 'Sri Lanka', 'Haputale Viewpoint Road, Haputale', '2024-01-10 09:00:00+00', CURRENT_TIMESTAMP),
    (2, '+94 71 889 2234', 'Sri Lanka', 'Temple Road, Bandarawela', '2024-03-15 10:30:00+00', CURRENT_TIMESTAMP),
    (3, '+94 72 334 5567', 'Sri Lanka', 'Main Street, Haputale', '2024-04-01 11:00:00+00', CURRENT_TIMESTAMP),
    (4, '+44 7911 123456', 'United Kingdom', '14 Kensington Crescent, London', '2024-05-12 14:20:00+00', CURRENT_TIMESTAMP),
    (5, '+94 77 555 9812', 'Sri Lanka', 'Flower Road, Colombo 07', '2024-06-02 08:15:00+00', CURRENT_TIMESTAMP),
    (6, '+82 10 2456 7890', 'South Korea', 'Gangnam-gu, Seoul', '2024-06-18 12:45:00+00', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;

-- 9. Seed default About Us content matching prototype
INSERT INTO about_content (id, title, intro, content, status, updated_by)
VALUES
    (1, 'About Us', 'A quiet boutique retreat in the hills of Haputale.', 'Draft content — pending review and resort approval before publication.', 'draft', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('about_content', 'id'), COALESCE(MAX(id), 1)) FROM about_content;
