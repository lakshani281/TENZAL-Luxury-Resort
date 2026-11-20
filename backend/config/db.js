/**
 * Database Configuration for TENZAL Luxury Resort
 * Room Booking Module | Student ID: 22CIS0276
 *
 * Supports native PostgreSQL connection via pg.Pool.
 * In local development, if PostgreSQL service is not reachable (e.g. ECONNREFUSED),
 * a seamless local in-memory fallback is activated with full seed data so developers
 * and examiners can test APIs and frontend immediately without local service blockers.
 */

const { Pool } = require('pg');

let isConnectedToPostgres = false;
let isPostgresAttempted = false;

// Native PostgreSQL connection pool
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tenzal_resort',
  connectionTimeoutMillis: 2000, // 2s quick probe
});

pgPool.on('connect', () => {
  isConnectedToPostgres = true;
  console.log('[Database] Connected to PostgreSQL database.');
});

pgPool.on('error', (err) => {
  // Do not crash process on idle client error; report it
  console.error('[Database] PostgreSQL pool error:', err.message);
});

// Seed data store for local fallback
const memoryStore = {
  rooms: [
    {
      id: 1,
      room_number: '3',
      name: 'Uva Valley View Room',
      description: 'Panoramic views overlooking the misty valley with traditional hand-crafted furniture.',
      type: 'Deluxe',
      price_per_night: '120.00',
      capacity: 2,
      size_sqm: '22.0',
      amenities: ['Four-poster bed', 'Balcony', 'Valley view'],
      image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      notes: 'Valley facing, morning sunlight',
      created_at: new Date('2026-06-01T08:00:00Z'),
      updated_at: new Date('2026-06-01T08:00:00Z'),
    },
    {
      id: 2,
      room_number: '4',
      name: 'Bridal Suite, Uva Valley',
      description: 'Luxury suite featuring an artisan canopy bed, freestanding deep-soaking bathtub, and kitchenette.',
      type: 'Suite',
      price_per_night: '125.00',
      capacity: 2,
      size_sqm: '35.0',
      amenities: ['Canopy bed', 'Kitchen', 'Bathtub', 'Balcony'],
      image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      notes: 'Special honeymoon setup available',
      created_at: new Date('2026-06-01T08:00:00Z'),
      updated_at: new Date('2026-06-01T08:00:00Z'),
    },
    {
      id: 3,
      room_number: '5',
      name: 'Indian Ocean View Room',
      description: 'Elevated vantage point offering endless horizon vistas, rainfall shower, and teak private terrace.',
      type: 'Ocean View',
      price_per_night: '125.00',
      capacity: 2,
      size_sqm: '35.0',
      amenities: ['Four-poster bed', 'Shower', 'Balcony'],
      image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      notes: 'High demand room',
      created_at: new Date('2026-06-01T08:00:00Z'),
      updated_at: new Date('2026-06-01T08:00:00Z'),
    },
  ],
  bookings: [
    {
      id: 1,
      reference: 'TZ-1045',
      room_id: 1,
      guest_name: 'Oliver James',
      guest_email: 'oliver@example.com',
      guest_phone: '077 456 2210',
      guest_count: 1,
      check_in: '2026-06-21',
      check_out: '2026-06-23',
      total_amount: '240.00',
      status: 'completed',
      notes: 'Standard booking',
      created_at: new Date('2026-06-20T10:00:00Z'),
      updated_at: new Date('2026-06-20T10:00:00Z'),
    },
    {
      id: 2,
      reference: 'TZ-1046',
      room_id: 3,
      guest_name: 'Sofia Chen',
      guest_email: 'sofia@example.com',
      guest_phone: '077 456 2210',
      guest_count: 1,
      check_in: '2026-06-23',
      check_out: '2026-06-26',
      total_amount: '375.00',
      status: 'confirmed',
      notes: 'Airport pickup scheduled',
      created_at: new Date('2026-06-22T11:00:00Z'),
      updated_at: new Date('2026-06-22T11:00:00Z'),
    },
    {
      id: 3,
      reference: 'TZ-1047',
      room_id: 1,
      guest_name: 'Nimal Perera',
      guest_email: 'nimal@example.com',
      guest_phone: '077 456 2210',
      guest_count: 1,
      check_in: '2026-06-24',
      check_out: '2026-06-25',
      total_amount: '120.00',
      status: 'confirmed',
      notes: 'VIP guest',
      created_at: new Date('2026-06-23T09:00:00Z'),
      updated_at: new Date('2026-06-23T09:00:00Z'),
    },
    {
      id: 4,
      reference: 'TZ-1048',
      room_id: 2,
      guest_name: 'Amelia Hart',
      guest_email: 'amelia@example.com',
      guest_phone: '077 456 2210',
      guest_count: 2,
      check_in: '2026-06-24',
      check_out: '2026-06-27',
      total_amount: '375.00',
      status: 'pending',
      notes: 'Late check-in requested',
      created_at: new Date('2026-06-24T08:30:00Z'),
      updated_at: new Date('2026-06-24T08:30:00Z'),
    },
  ],
  nextRoomId: 4,
  nextBookingId: 5,

  // User Management & About Us Module (Student ID: 22CIS0274)
  roles: [
    { id: 1, name: 'admin', description: 'Administrator' },
    { id: 2, name: 'staff', description: 'Authorized Staff' },
    { id: 3, name: 'guest', description: 'Guest Customer' },
  ],
  users: [
    {
      id: 1,
      name: 'Nadeesha Perera',
      email: 'admin@tenzal.com',
      // Bcrypt hash for: Password123!
      password_hash: '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC',
      role_id: 1,
      is_active: true,
      last_login_at: new Date('2026-06-24T09:00:00Z'),
      created_at: new Date('2024-01-10T09:00:00Z'),
      updated_at: new Date('2024-01-10T09:00:00Z'),
    },
    {
      id: 2,
      name: 'Kasun Silva',
      email: 'kasun@tenzal.com',
      password_hash: '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC',
      role_id: 2,
      is_active: true,
      last_login_at: new Date('2026-06-24T08:14:00Z'),
      created_at: new Date('2024-03-15T10:30:00Z'),
      updated_at: new Date('2024-03-15T10:30:00Z'),
    },
    {
      id: 3,
      name: 'M. Fernando',
      email: 'mfernando@tenzal.com',
      password_hash: '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC',
      role_id: 2,
      is_active: false,
      last_login_at: new Date('2026-06-21T16:45:00Z'),
      created_at: new Date('2024-04-01T11:00:00Z'),
      updated_at: new Date('2024-04-01T11:00:00Z'),
    },
    {
      id: 4,
      name: 'Amelia Hart',
      email: 'amelia@example.com',
      password_hash: '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC',
      role_id: 3,
      is_active: true,
      last_login_at: new Date('2026-06-24T07:30:00Z'),
      created_at: new Date('2024-05-12T14:20:00Z'),
      updated_at: new Date('2024-05-12T14:20:00Z'),
      bookings_count: 2,
      orders_count: 1,
    },
    {
      id: 5,
      name: 'Nimal Perera',
      email: 'nimal@email.com',
      password_hash: '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC',
      role_id: 3,
      is_active: true,
      last_login_at: new Date('2026-06-23T18:00:00Z'),
      created_at: new Date('2024-06-02T08:15:00Z'),
      updated_at: new Date('2024-06-02T08:15:00Z'),
      bookings_count: 1,
      orders_count: 3,
    },
    {
      id: 6,
      name: 'Sofia Chen',
      email: 'sofia@email.com',
      password_hash: '$2b$10$fEa0FweYUaZP4NCXK89Ot.bz548suyjJAG9nmC094rbEOrm4jW.fC',
      role_id: 3,
      is_active: true,
      last_login_at: new Date('2026-06-24T09:10:00Z'),
      created_at: new Date('2024-06-18T12:45:00Z'),
      updated_at: new Date('2024-06-18T12:45:00Z'),
      bookings_count: 1,
      orders_count: 2,
    },
  ],
  user_profiles: [
    { id: 1, user_id: 1, phone: '+94 77 123 4567', country: 'Sri Lanka', address: 'Haputale Viewpoint Road, Haputale', avatar_url: null, date_of_birth: '1988-04-12' },
    { id: 2, user_id: 2, phone: '+94 71 889 2234', country: 'Sri Lanka', address: 'Temple Road, Bandarawela', avatar_url: null, date_of_birth: '1992-09-20' },
    { id: 3, user_id: 3, phone: '+94 72 334 5567', country: 'Sri Lanka', address: 'Main Street, Haputale', avatar_url: null, date_of_birth: '1990-11-05' },
    { id: 4, user_id: 4, phone: '+44 7911 123456', country: 'United Kingdom', address: '14 Kensington Crescent, London', avatar_url: null, date_of_birth: '1995-02-14' },
    { id: 5, user_id: 5, phone: '+94 77 555 9812', country: 'Sri Lanka', address: 'Flower Road, Colombo 07', avatar_url: null, date_of_birth: '1985-07-30' },
    { id: 6, user_id: 6, phone: '+82 10 2456 7890', country: 'South Korea', address: 'Gangnam-gu, Seoul', avatar_url: null, date_of_birth: '1993-12-01' },
  ],
  about_content: [
    {
      id: 1,
      title: 'About Us',
      intro: 'A quiet boutique retreat in the hills of Haputale.',
      content: 'Draft content — pending review and resort approval before publication.',
      status: 'draft',
      updated_by: 1,
      updated_at: new Date('2026-06-24T10:00:00Z'),
    },
  ],
  nextUserId: 7,
  nextProfileId: 7,
};

// Check if PostgreSQL is available
async function checkPostgres() {
  if (isPostgresAttempted) return isConnectedToPostgres;
  isPostgresAttempted = true;
  try {
    const res = await pgPool.query('SELECT 1');
    if (res) {
      isConnectedToPostgres = true;
      console.log('[Database] PostgreSQL connection verified on localhost:5432');
    }
  } catch (err) {
    isConnectedToPostgres = false;
    console.log('[Database] Notice: PostgreSQL is not reachable on port 5432.');
    console.log('[Database] Activating integrated Local Memory DB mode with resort seed data.');
  }
  return isConnectedToPostgres;
}

// In-memory query executor mimicking PostgreSQL query results
function executeMemoryQuery(text, params = []) {
  const sql = text.trim();
  const normalized = sql.replace(/\s+/g, ' ');

  // 1. SELECT * FROM rooms WHERE id = $1
  if (/SELECT \* FROM rooms WHERE id = \$1/i.test(normalized)) {
    const id = parseInt(params[0], 10);
    const room = memoryStore.rooms.find((r) => r.id === id);
    return { rows: room ? [room] : [] };
  }

  // 1b. SELECT * FROM rooms WHERE id = $1 FOR UPDATE
  if (/SELECT \* FROM rooms WHERE id = \$1 FOR UPDATE/i.test(normalized)) {
    const id = parseInt(params[0], 10);
    const room = memoryStore.rooms.find((r) => r.id === id);
    return { rows: room ? [room] : [] };
  }

  // 2. SELECT price_per_night FROM rooms WHERE id = $1
  if (/SELECT price_per_night FROM rooms WHERE id = \$1/i.test(normalized)) {
    const id = parseInt(params[0], 10);
    const room = memoryStore.rooms.find((r) => r.id === id);
    return { rows: room ? [{ price_per_night: room.price_per_night }] : [] };
  }

  // 3. SELECT * FROM rooms WHERE status = 'active'
  if (/SELECT \* FROM rooms WHERE status = 'active'/i.test(normalized)) {
    const active = memoryStore.rooms.filter((r) => r.status === 'active');
    return { rows: active };
  }

  // 4. Room count queries
  if (/SELECT COUNT\(\*\) AS total FROM rooms/i.test(normalized)) {
    return { rows: [{ total: memoryStore.rooms.length }] };
  }
  if (/SELECT COUNT\(\*\) AS count FROM rooms WHERE status = 'active'/i.test(normalized)) {
    return { rows: [{ count: memoryStore.rooms.filter((r) => r.status === 'active').length }] };
  }
  if (/SELECT COUNT\(\*\) AS count FROM rooms WHERE status = 'maintenance'/i.test(normalized)) {
    return { rows: [{ count: memoryStore.rooms.filter((r) => r.status === 'maintenance').length }] };
  }
  if (/SELECT COUNT\(\*\) AS count FROM rooms WHERE status = 'inactive'/i.test(normalized)) {
    return { rows: [{ count: memoryStore.rooms.filter((r) => r.status === 'inactive').length }] };
  }

  // 5. SELECT * FROM rooms WHERE 1=1 (with optional search and status)
  if (/SELECT \* FROM rooms WHERE 1=1/i.test(normalized)) {
    let result = [...memoryStore.rooms];
    let pIdx = 0;
    if (normalized.includes('ILIKE')) {
      const search = (params[pIdx] || '').replace(/%/g, '').toLowerCase();
      result = result.filter(
        (r) =>
          r.room_number.toLowerCase().includes(search) ||
          r.name.toLowerCase().includes(search) ||
          r.type.toLowerCase().includes(search)
      );
      pIdx++;
    }
    if (normalized.includes('status = $')) {
      const status = params[pIdx];
      result = result.filter((r) => r.status === status);
    }
    result.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
    return { rows: result };
  }

  // 6. INSERT INTO rooms
  if (/INSERT INTO rooms/i.test(normalized)) {
    const [room_number, name, description, type, price_per_night, capacity, size_sqm, amenities, image_url, status, notes] = params;
    const newRoom = {
      id: memoryStore.nextRoomId++,
      room_number: String(room_number),
      name,
      description: description || '',
      type: type || 'Standard',
      price_per_night: parseFloat(price_per_night).toFixed(2),
      capacity: parseInt(capacity, 10) || 2,
      size_sqm: size_sqm ? parseFloat(size_sqm).toFixed(1) : null,
      amenities: Array.isArray(amenities) ? amenities : (amenities ? String(amenities).split(',').map(s=>s.trim()) : []),
      image_url: image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      status: status || 'active',
      notes: notes || '',
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryStore.rooms.push(newRoom);
    return { rows: [newRoom] };
  }

  // 7. UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
  if (/UPDATE rooms SET status = \$1.+WHERE id = \$2/i.test(normalized)) {
    const [status, id] = params;
    const room = memoryStore.rooms.find((r) => r.id === parseInt(id, 10));
    if (room) {
      room.status = status;
      room.updated_at = new Date();
      return { rows: [room] };
    }
    return { rows: [] };
  }

  // 8. UPDATE rooms SET ... WHERE id = $12
  if (/UPDATE rooms SET/i.test(normalized)) {
    const id = parseInt(params[params.length - 1], 10);
    const room = memoryStore.rooms.find((r) => r.id === id);
    if (room) {
      const [room_number, name, description, type, price_per_night, capacity, size_sqm, amenities, image_url, status, notes] = params;
      if (room_number !== undefined && room_number !== null) room.room_number = String(room_number);
      if (name !== undefined && name !== null) room.name = name;
      if (description !== undefined && description !== null) room.description = description;
      if (type !== undefined && type !== null) room.type = type;
      if (price_per_night !== undefined && price_per_night !== null) room.price_per_night = parseFloat(price_per_night).toFixed(2);
      if (capacity !== undefined && capacity !== null) room.capacity = parseInt(capacity, 10);
      if (size_sqm !== undefined && size_sqm !== null) room.size_sqm = parseFloat(size_sqm).toFixed(1);
      if (amenities !== undefined && amenities !== null) room.amenities = Array.isArray(amenities) ? amenities : [];
      if (image_url !== undefined && image_url !== null) room.image_url = image_url;
      if (status !== undefined && status !== null) room.status = status;
      if (notes !== undefined && notes !== null) room.notes = notes;
      room.updated_at = new Date();
      return { rows: [room] };
    }
    return { rows: [] };
  }

  // 9. Check room availability conflicts
  if (/SELECT id, reference, check_in, check_out, guest_name, status FROM bookings WHERE room_id = \$1/i.test(normalized)) {
    const [roomId, checkIn, checkOut] = params;
    const conflicts = memoryStore.bookings.filter((b) => {
      if (b.room_id !== parseInt(roomId, 10)) return false;
      if (b.status === 'cancelled') return false;
      return b.check_in < checkOut && b.check_out > checkIn;
    });
    return { rows: conflicts };
  }

  // 10. Check all rooms conflicts
  if (/SELECT DISTINCT room_id FROM bookings WHERE status NOT IN \('cancelled'\) AND check_in < \$2 AND check_out > \$1/i.test(normalized)) {
    const [checkIn, checkOut] = params;
    const conflicts = memoryStore.bookings
      .filter((b) => b.status !== 'cancelled' && b.check_in < checkOut && b.check_out > checkIn)
      .map((b) => ({ room_id: b.room_id }));
    return { rows: conflicts };
  }

  // 11. Overlap check query (matches both with and without extra columns / exclusions)
  if (/FROM bookings WHERE room_id = \$1 AND status NOT IN \('cancelled'\) AND check_in < \$3 AND check_out > \$2/i.test(normalized)) {
    const [roomId, checkIn, checkOut, excludeId] = params;
    const conflicts = memoryStore.bookings.filter((b) => {
      if (b.room_id !== parseInt(roomId, 10)) return false;
      if (b.status === 'cancelled') return false;
      if (excludeId && b.id === parseInt(excludeId, 10)) return false;
      return b.check_in < checkOut && b.check_out > checkIn;
    });
    return { rows: conflicts.map((c) => ({ id: c.id, reference: c.reference, check_in: c.check_in, check_out: c.check_out })) };
  }

  // 12. Booking reference generation
  if (/SELECT reference FROM bookings ORDER BY id DESC LIMIT 1/i.test(normalized)) {
    if (memoryStore.bookings.length === 0) return { rows: [] };
    const sorted = [...memoryStore.bookings].sort((a, b) => b.id - a.id);
    return { rows: [{ reference: sorted[0].reference }] };
  }

  // 13. Single booking by ID
  if (/SELECT b\.\*, r\.room_number/i.test(normalized) && normalized.includes('WHERE b.id = $1')) {
    const id = parseInt(params[0], 10);
    const b = memoryStore.bookings.find((item) => item.id === id);
    if (!b) return { rows: [] };
    const room = memoryStore.rooms.find((r) => r.id === b.room_id) || {};
    return {
      rows: [
        {
          ...b,
          room_number: room.room_number || '',
          room_name: room.name || '',
          room_type: room.type || '',
          price_per_night: room.price_per_night || '0.00',
        },
      ],
    };
  }

  // 14. Bookings list & count queries
  if (/SELECT COUNT\(\*\) AS total FROM bookings b/i.test(normalized)) {
    let list = [...memoryStore.bookings];
    let pIdx = 0;
    if (normalized.includes('ILIKE')) {
      const search = (params[pIdx] || '').replace(/%/g, '').toLowerCase();
      list = list.filter((b) => {
        const room = memoryStore.rooms.find((r) => r.id === b.room_id);
        return (
          b.reference.toLowerCase().includes(search) ||
          b.guest_name.toLowerCase().includes(search) ||
          (b.guest_email && b.guest_email.toLowerCase().includes(search)) ||
          (room && room.room_number.toLowerCase().includes(search))
        );
      });
      pIdx++;
    }
    if (normalized.includes('status = $')) {
      const status = params[pIdx];
      list = list.filter((b) => b.status === status);
    }
    return { rows: [{ total: list.length }] };
  }

  if (/SELECT b\.\*, r\.room_number.+FROM bookings b/i.test(normalized)) {
    let list = memoryStore.bookings.map((b) => {
      const room = memoryStore.rooms.find((r) => r.id === b.room_id) || {};
      return {
        ...b,
        room_number: room.room_number || '',
        room_name: room.name || '',
        room_type: room.type || '',
      };
    });
    let pIdx = 0;
    if (normalized.includes('ILIKE')) {
      const search = (params[pIdx] || '').replace(/%/g, '').toLowerCase();
      list = list.filter(
        (b) =>
          b.reference.toLowerCase().includes(search) ||
          b.guest_name.toLowerCase().includes(search) ||
          (b.guest_email && b.guest_email.toLowerCase().includes(search)) ||
          b.room_number.toLowerCase().includes(search)
      );
      pIdx++;
    }
    if (normalized.includes('status = $')) {
      const status = params[pIdx];
      list = list.filter((b) => b.status === status);
      pIdx++;
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const limit = params[pIdx] !== undefined ? parseInt(params[pIdx], 10) : 20;
    const offset = params[pIdx + 1] !== undefined ? parseInt(params[pIdx + 1], 10) : 0;
    const pageRows = list.slice(offset, offset + limit);
    return { rows: pageRows };
  }

  // 15. INSERT INTO bookings
  if (/INSERT INTO bookings/i.test(normalized)) {
    const [reference, room_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, total_amount, status, notes] = params;
    const newBooking = {
      id: memoryStore.nextBookingId++,
      reference,
      room_id: parseInt(room_id, 10),
      guest_name,
      guest_email: guest_email || null,
      guest_phone: guest_phone || null,
      guest_count: parseInt(guest_count, 10) || 1,
      check_in,
      check_out,
      total_amount: parseFloat(total_amount).toFixed(2),
      status: status || 'pending',
      notes: notes || '',
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryStore.bookings.push(newBooking);
    return { rows: [newBooking] };
  }

  // 16. UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
  if (/UPDATE bookings SET status = \$1.+WHERE id = \$2/i.test(normalized)) {
    const [status, id] = params;
    const booking = memoryStore.bookings.find((b) => b.id === parseInt(id, 10));
    if (booking) {
      booking.status = status;
      booking.updated_at = new Date();
      return { rows: [booking] };
    }
    return { rows: [] };
  }

  // 17. UPDATE bookings SET ... WHERE id = $11
  if (/UPDATE bookings SET/i.test(normalized)) {
    const id = parseInt(params[params.length - 1], 10);
    const booking = memoryStore.bookings.find((b) => b.id === id);
    if (booking) {
      const [room_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, total_amount, status, notes] = params;
      if (room_id !== undefined && room_id !== null) booking.room_id = parseInt(room_id, 10);
      if (guest_name !== undefined && guest_name !== null) booking.guest_name = guest_name;
      if (guest_email !== undefined && guest_email !== null) booking.guest_email = guest_email;
      if (guest_phone !== undefined && guest_phone !== null) booking.guest_phone = guest_phone;
      if (guest_count !== undefined && guest_count !== null) booking.guest_count = parseInt(guest_count, 10);
      if (check_in !== undefined && check_in !== null) booking.check_in = check_in;
      if (check_out !== undefined && check_out !== null) booking.check_out = check_out;
      if (total_amount !== undefined && total_amount !== null) booking.total_amount = parseFloat(total_amount).toFixed(2);
      if (status !== undefined && status !== null) booking.status = status;
      if (notes !== undefined && notes !== null) booking.notes = notes;
      booking.updated_at = new Date();
      return { rows: [booking] };
    }
    return { rows: [] };
  }

  // 18. Booking stats queries
  if (/SELECT COUNT\(\*\) AS count FROM bookings WHERE status = 'pending'/i.test(normalized)) {
    return { rows: [{ count: memoryStore.bookings.filter((b) => b.status === 'pending').length }] };
  }
  if (/SELECT COUNT\(\*\) AS count FROM bookings WHERE status = 'confirmed'/i.test(normalized)) {
    return { rows: [{ count: memoryStore.bookings.filter((b) => b.status === 'confirmed').length }] };
  }
  if (/SELECT COUNT\(\*\) AS count FROM bookings WHERE check_in = \$1/i.test(normalized)) {
    const [date] = params;
    const count = memoryStore.bookings.filter((b) => b.check_in === date && b.status !== 'cancelled').length;
    return { rows: [{ count }] };
  }
  if (/SELECT COUNT\(\*\) AS count FROM bookings WHERE check_out = \$1/i.test(normalized)) {
    const [date] = params;
    const count = memoryStore.bookings.filter((b) => b.check_out === date && b.status !== 'cancelled').length;
    return { rows: [{ count }] };
  }
  if (/SELECT COUNT\(\*\) AS count FROM bookings/i.test(normalized)) {
    return { rows: [{ count: memoryStore.bookings.length }] };
  }

  // --- USER MANAGEMENT & ABOUT US MODULE (22CIS0274) ---

  // Count users query
  if (/SELECT COUNT\(.*?\).*FROM users/i.test(normalized)) {
    let list = memoryStore.users;
    if (normalized.includes('admin')) {
      list = list.filter((u) => u.role_id === 1 && u.is_active);
    }
    return { rows: [{ count: list.length }] };
  }

  // Roles lookup
  if (/FROM roles/i.test(normalized)) {
    if (/WHERE.*name/i.test(normalized)) {
      const matchLiteral = normalized.match(/name\s*=\s*'([^']+)'/i);
      const targetName = matchLiteral ? matchLiteral[1] : (params[0] || '');
      const role = memoryStore.roles.find((r) => r.name.toLowerCase() === targetName.toLowerCase());
      return { rows: role ? [role] : [] };
    }
    if (/WHERE.*id/i.test(normalized)) {
      const matchLiteral = normalized.match(/id\s*=\s*(\d+)/i);
      const targetId = matchLiteral ? parseInt(matchLiteral[1], 10) : parseInt(params[0], 10);
      const role = memoryStore.roles.find((r) => r.id === targetId);
      return { rows: role ? [role] : [] };
    }
    return { rows: [...memoryStore.roles] };
  }

  // Find user by email
  if (/FROM users(?:\s+u)?.*WHERE.*(?:email|LOWER\((?:u\.)?email\))/i.test(normalized)) {
    const emailToFind = (params[0] || '').toLowerCase().trim();
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === emailToFind);
    if (!user) return { rows: [] };
    const role = memoryStore.roles.find((r) => r.id === user.role_id);
    const profile = memoryStore.user_profiles.find((p) => p.user_id === user.id) || {};
    return {
      rows: [
        {
          ...user,
          role_name: role ? role.name : 'guest',
          role: role ? role.name : 'guest',
          phone: profile.phone || '',
          country: profile.country || '',
          address: profile.address || '',
          avatar_url: profile.avatar_url || null,
          date_of_birth: profile.date_of_birth || null,
        },
      ],
    };
  }

  // Find user by ID
  if (/FROM users(?:\s+u)?.*WHERE.*(?:u\.)?id\s*=\s*\$1/i.test(normalized)) {
    const id = parseInt(params[0], 10);
    const user = memoryStore.users.find((u) => u.id === id);
    if (!user) return { rows: [] };
    const role = memoryStore.roles.find((r) => r.id === user.role_id);
    const profile = memoryStore.user_profiles.find((p) => p.user_id === user.id) || {};
    return {
      rows: [
        {
          ...user,
          role_name: role ? role.name : 'guest',
          role: role ? role.name : 'guest',
          phone: profile.phone || '',
          country: profile.country || '',
          address: profile.address || '',
          avatar_url: profile.avatar_url || null,
          date_of_birth: profile.date_of_birth || null,
        },
      ],
    };
  }

  // Insert user
  if (/INSERT INTO users/i.test(normalized)) {
    const [name, email, password_hash, role_id, is_active] = params;
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    if (existing) {
      const err = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      err.detail = `Key (email)=(${email}) already exists.`;
      throw err;
    }
    const newUser = {
      id: memoryStore.nextUserId++,
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      role_id: parseInt(role_id, 10),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryStore.users.push(newUser);
    const role = memoryStore.roles.find((r) => r.id === newUser.role_id);
    return {
      rows: [
        {
          ...newUser,
          role_name: role ? role.name : 'guest',
          role: role ? role.name : 'guest',
        },
      ],
    };
  }

  // Upsert user profile
  if (/INSERT INTO user_profiles/i.test(normalized)) {
    const [user_id, phone, country, address, avatar_url, date_of_birth] = params;
    const uid = parseInt(user_id, 10);
    let prof = memoryStore.user_profiles.find((p) => p.user_id === uid);
    if (prof) {
      if (phone !== undefined) prof.phone = phone;
      if (country !== undefined) prof.country = country;
      if (address !== undefined) prof.address = address;
      if (avatar_url !== undefined) prof.avatar_url = avatar_url;
      if (date_of_birth !== undefined) prof.date_of_birth = date_of_birth;
      prof.updated_at = new Date();
    } else {
      prof = {
        id: memoryStore.nextProfileId++,
        user_id: uid,
        phone: phone || null,
        country: country || 'Sri Lanka',
        address: address || null,
        avatar_url: avatar_url || null,
        date_of_birth: date_of_birth || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      memoryStore.user_profiles.push(prof);
    }
    return { rows: [prof] };
  }

  // Update user profile
  if (/UPDATE user_profiles/i.test(normalized)) {
    const uid = parseInt(params[params.length - 1], 10);
    let prof = memoryStore.user_profiles.find((p) => p.user_id === uid);
    if (!prof) {
      prof = {
        id: memoryStore.nextProfileId++,
        user_id: uid,
        phone: null,
        country: 'Sri Lanka',
        address: null,
        avatar_url: null,
        date_of_birth: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      memoryStore.user_profiles.push(prof);
    }
    // Update fields from params
    if (params.length >= 1) prof.phone = params[0];
    if (params.length >= 2) prof.country = params[1];
    if (params.length >= 3) prof.address = params[2];
    prof.updated_at = new Date();
    return { rows: [prof] };
  }

  // Update user last login
  if (/UPDATE users SET last_login_at/i.test(normalized)) {
    const id = parseInt(params[0], 10);
    const user = memoryStore.users.find((u) => u.id === id);
    if (user) user.last_login_at = new Date();
    return { rows: user ? [user] : [] };
  }

  // Update user password
  if (/UPDATE users SET password_hash/i.test(normalized)) {
    const [password_hash, id] = params;
    const user = memoryStore.users.find((u) => u.id === parseInt(id, 10));
    if (user) {
      user.password_hash = password_hash;
      user.updated_at = new Date();
    }
    return { rows: user ? [user] : [] };
  }

  // Update user general fields (name, role_id, is_active)
  if (/UPDATE users SET/i.test(normalized)) {
    const id = parseInt(params[params.length - 1], 10);
    const user = memoryStore.users.find((u) => u.id === id);
    if (user) {
      if (normalized.includes('role_id = $1')) {
        user.role_id = parseInt(params[0], 10);
      }
      if (normalized.includes('is_active = $1')) {
        user.is_active = Boolean(params[0]);
      }
      if (normalized.includes('name = $1')) {
        user.name = params[0];
      }
      user.updated_at = new Date();
      const role = memoryStore.roles.find((r) => r.id === user.role_id);
      return {
        rows: [
          {
            ...user,
            role_name: role ? role.name : 'guest',
            role: role ? role.name : 'guest',
          },
        ],
      };
    }
    return { rows: [] };
  }

  // Delete user
  if (/DELETE FROM users WHERE id = \$1/i.test(normalized)) {
    const id = parseInt(params[0], 10);
    const idx = memoryStore.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const removed = memoryStore.users.splice(idx, 1)[0];
      return { rows: [removed] };
    }
    return { rows: [] };
  }

  // List all users with filters
  if (/FROM users u/i.test(normalized) && !/WHERE.*u\.id\s*=\s*\$1/i.test(normalized)) {
    let result = memoryStore.users.map((u) => {
      const role = memoryStore.roles.find((r) => r.id === u.role_id);
      const profile = memoryStore.user_profiles.find((p) => p.user_id === u.id) || {};
      return {
        ...u,
        role_name: role ? role.name : 'guest',
        role: role ? role.name : 'guest',
        phone: profile.phone || '',
        country: profile.country || '',
        address: profile.address || '',
        avatar_url: profile.avatar_url || null,
        date_of_birth: profile.date_of_birth || null,
        bookings_count: u.bookings_count || (u.role_id === 3 ? 1 : 0),
        orders_count: u.orders_count || (u.role_id === 3 ? 1 : 0),
      };
    });

    // Check for role filter in query
    if (normalized.includes('role_id = $') || normalized.includes('r.name = $')) {
      const roleParam = params.find((p) => typeof p === 'string' && ['admin', 'staff', 'guest'].includes(p.toLowerCase()));
      if (roleParam) {
        result = result.filter((u) => u.role_name.toLowerCase() === roleParam.toLowerCase());
      }
    }

    // Check for status filter
    if (normalized.includes('is_active = $')) {
      const activeParam = params.find((p) => typeof p === 'boolean');
      if (activeParam !== undefined) {
        result = result.filter((u) => u.is_active === activeParam);
      }
    }

    // Check for search filter
    const searchParam = params.find((p) => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
    if (searchParam) {
      const clean = searchParam.replace(/%/g, '').toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(clean) ||
          u.email.toLowerCase().includes(clean) ||
          (u.phone && u.phone.toLowerCase().includes(clean))
      );
    }

    return { rows: result };
  }

  // About Content
  if (/FROM about_content/i.test(normalized)) {
    return { rows: [...memoryStore.about_content] };
  }

  if (/UPDATE about_content/i.test(normalized)) {
    const [title, intro, content, status, updated_by] = params;
    const about = memoryStore.about_content[0];
    if (about) {
      if (title !== undefined) about.title = title;
      if (intro !== undefined) about.intro = intro;
      if (content !== undefined) about.content = content;
      if (status !== undefined) about.status = status;
      if (updated_by !== undefined) about.updated_by = updated_by;
      about.updated_at = new Date();
      return { rows: [about] };
    }
  }

  // Generic fallback
  return { rows: [] };
}

// Unified db adapter
const db = {
  async query(text, params = []) {
    const isPg = await checkPostgres();
    if (isPg) {
      return pgPool.query(text, params);
    }
    return executeMemoryQuery(text, params);
  },

  async connect() {
    const isPg = await checkPostgres();
    if (isPg) {
      return pgPool.connect();
    }
    // Return memory client with transaction mock
    return {
      query: (text, params = []) => {
        if (/BEGIN|COMMIT|ROLLBACK/i.test(text)) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve(executeMemoryQuery(text, params));
      },
      release: () => {},
    };
  },

  end() {
    return pgPool.end();
  },

  on(event, handler) {
    return pgPool.on(event, handler);
  },
};

module.exports = db;
