/**
 * Comprehensive Automated Test Suite for User Management & Security Module
 * Student ID: 22CIS0274
 */

const http = require('http');
const app = require('../server');

let server;
const PORT = 5555;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' TENZAL Luxury Resort - Module Test Suite (22CIS0274)');
  console.log('====================================================\n');

  let adminToken = '';
  let staffToken = '';
  let guestToken = '';
  let registeredUserId = null;

  // 1. Health check
  console.log('--- 1. Health Check ---');
  const health = await request('GET', '/api/health');
  assert(health.status === 200 && health.body.success === true, 'GET /api/health returns 200 OK');

  // 2. Authentication: Login
  console.log('\n--- 2. Authentication: Login & Credential Verification ---');

  // Admin login
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@tenzal.com',
    password: 'Password123!',
  });
  assert(adminLogin.status === 200, 'Admin login with valid credentials returns 200');
  assert(adminLogin.body.data && adminLogin.body.data.token, 'Admin login returns signed JWT');
  assert(adminLogin.body.data.user.role === 'admin', 'Admin login attaches role="admin"');
  assert(!adminLogin.body.data.user.password_hash, 'Password hash is strictly NEVER exposed in response');
  adminToken = adminLogin.body.data.token;

  // Staff login
  const staffLogin = await request('POST', '/api/auth/login', {
    email: 'kasun@tenzal.com',
    password: 'Password123!',
  });
  assert(staffLogin.status === 200, 'Staff login with valid credentials returns 200');
  assert(staffLogin.body.data.user.role === 'staff', 'Staff user receives role="staff"');
  staffToken = staffLogin.body.data.token;

  // Inactive account login
  const inactiveLogin = await request('POST', '/api/auth/login', {
    email: 'mfernando@tenzal.com',
    password: 'Password123!',
  });
  assert(inactiveLogin.status === 403, 'Inactive account login is blocked with 403 Forbidden');
  assert(inactiveLogin.body.code === 'ACCOUNT_DEACTIVATED', 'Deactivated account error returns specific code');

  // Invalid password
  const badPass = await request('POST', '/api/auth/login', {
    email: 'admin@tenzal.com',
    password: 'WrongPassword!',
  });
  assert(badPass.status === 401, 'Invalid password returns 401 Unauthorized');
  assert(badPass.body.message === 'Invalid email or password.', 'Generic error message protects against enumeration');

  // Non-existent email
  const badEmail = await request('POST', '/api/auth/login', {
    email: 'nonexistent@tenzal.com',
    password: 'Password123!',
  });
  assert(badEmail.status === 401, 'Non-existent email returns 401 Unauthorized');
  assert(badEmail.body.message === 'Invalid email or password.', 'Consistent error message for missing account');

  // 3. User Registration
  console.log('\n--- 3. Registration: Validation & Conflict Prevention ---');

  // Weak password registration
  const weakReg = await request('POST', '/api/auth/register', {
    name: 'New Guest',
    email: 'guest@example.com',
    password: 'weak',
  });
  assert(weakReg.status === 400, 'Weak password (<8 chars / missing criteria) is rejected with 400');

  // Valid registration
  const uniqueEmail = `guest_${Date.now()}@test.com`;
  const validReg = await request('POST', '/api/auth/register', {
    name: 'Dilshan Silva',
    email: uniqueEmail,
    password: 'Password123!',
    phone: '+94 77 999 8888',
    country: 'Sri Lanka',
    address: 'Kandy Road, Nuwara Eliya',
  });
  assert(validReg.status === 201, 'Valid registration creates user with 201 Created');
  assert(validReg.body.data && validReg.body.data.token, 'Registration auto-generates JWT session token');
  assert(validReg.body.data.user.role === 'guest', 'New registration automatically defaults to role="guest"');
  assert(!validReg.body.data.user.password_hash, 'Password hash is excluded from registration response');
  guestToken = validReg.body.data.token;
  registeredUserId = validReg.body.data.user.id;

  // Duplicate email registration
  const dupReg = await request('POST', '/api/auth/register', {
    name: 'Duplicate Person',
    email: uniqueEmail,
    password: 'Password123!',
  });
  assert(dupReg.status === 409, 'Duplicate email registration is rejected with 409 Conflict');

  // 4. Token & Session Verification (/api/auth/me)
  console.log('\n--- 4. Session & Identity Verification (/api/auth/me) ---');
  const meAdmin = await request('GET', '/api/auth/me', null, adminToken);
  assert(meAdmin.status === 200 && meAdmin.body.data.email === 'admin@tenzal.com', 'Admin can retrieve their profile with JWT');

  const meNoToken = await request('GET', '/api/auth/me');
  assert(meNoToken.status === 401, 'Missing Authorization header returns 401');

  const meBadToken = await request('GET', '/api/auth/me', null, 'invalid_token_xyz');
  assert(meBadToken.status === 401, 'Malformed token returns 401 with code TOKEN_INVALID');

  // 5. User Profile Management
  console.log('\n--- 5. User Profile Management ---');
  const profileGet = await request('GET', '/api/users/profile', null, guestToken);
  assert(profileGet.status === 200, 'Guest can read their own profile');

  const profileUpdate = await request('PUT', '/api/users/profile', {
    name: 'Dilshan S. Silva',
    phone: '+94 77 111 2222',
    address: 'Updated Luxury Villa, Kandy',
  }, guestToken);
  assert(profileUpdate.status === 200, 'Guest can update their profile details');
  assert(profileUpdate.body.data.name === 'Dilshan S. Silva', 'Name update is reflected');
  assert(profileUpdate.body.data.phone === '+94 77 111 2222', 'Phone update is reflected');

  // 6. Change Password
  console.log('\n--- 6. Change Password ---');
  const badOldPass = await request('PUT', '/api/users/change-password', {
    currentPassword: 'WrongOldPassword!',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  }, guestToken);
  assert(badOldPass.status === 400, 'Wrong current password returns 400');

  const goodPass = await request('PUT', '/api/users/change-password', {
    currentPassword: 'Password123!',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  }, guestToken);
  assert(goodPass.status === 200, 'Valid password change succeeds with 200 OK');

  // Verify new password can be used to log in
  const newLogin = await request('POST', '/api/auth/login', {
    email: uniqueEmail,
    password: 'NewPassword123!',
  });
  assert(newLogin.status === 200, 'Can log in immediately with the new password');

  // 7. Security & Role-Based Access Control (RBAC)
  console.log('\n--- 7. Role-Based Access Control & Privilege Escalation Prevention ---');

  // Guest trying to list all users -> Forbidden
  const guestListUsers = await request('GET', '/api/users', null, guestToken);
  assert(guestListUsers.status === 403, 'Guest cannot access admin user list (403 Forbidden)');

  // Staff trying to list all users -> Forbidden
  const staffListUsers = await request('GET', '/api/users', null, staffToken);
  assert(staffListUsers.status === 403, 'Staff cannot access admin user list (403 Forbidden)');

  // Admin listing all users -> Success
  const adminListUsers = await request('GET', '/api/users', null, adminToken);
  assert(adminListUsers.status === 200, 'Admin can list all registered users');
  assert(Array.isArray(adminListUsers.body.data), 'Admin user list is an array');

  // Admin filter by role
  const guestsOnly = await request('GET', '/api/users?role=guest', null, adminToken);
  assert(guestsOnly.status === 200, 'Admin can filter users by role=guest');

  // Admin filter by search
  const searchResult = await request('GET', '/api/users?search=Amelia', null, adminToken);
  assert(searchResult.status === 200, 'Admin can search users by keyword');

  // Guest trying to change their own role -> 403 Forbidden (Privilege Escalation Prevention)
  const guestEscalation = await request('PATCH', `/api/users/${registeredUserId}/role`, {
    role: 'admin',
  }, guestToken);
  assert(guestEscalation.status === 403, 'Guest privilege escalation attempt is strictly blocked with 403');

  // Admin updating user role
  const promoteToStaff = await request('PATCH', `/api/users/${registeredUserId}/role`, {
    role: 'staff',
  }, adminToken);
  assert(promoteToStaff.status === 200, 'Admin can change user role to staff');
  assert(promoteToStaff.body.data.role === 'staff', 'User role updated to staff');

  // Admin toggling status (deactivating user)
  const deactivateUser = await request('PATCH', `/api/users/${registeredUserId}/status`, {
    is_active: false,
  }, adminToken);
  assert(deactivateUser.status === 200, 'Admin can deactivate a user account');
  assert(deactivateUser.body.data.is_active === false, 'User status reflected as is_active=false');

  // Deactivated user trying to authenticate -> Blocked
  const deactivatedLogin = await request('POST', '/api/auth/login', {
    email: uniqueEmail,
    password: 'NewPassword123!',
  });
  assert(deactivatedLogin.status === 403, 'Deactivated user is immediately blocked from logging in');

  // Reactivate user
  const reactivateUser = await request('PATCH', `/api/users/${registeredUserId}/status`, {
    is_active: true,
  }, adminToken);
  assert(reactivateUser.status === 200 && reactivateUser.body.data.is_active === true, 'Admin can reactivate user account');

  // Admin cannot deactivate themselves (Safety guard)
  const selfDeactivate = await request('PATCH', '/api/users/1/status', {
    is_active: false,
  }, adminToken);
  assert(selfDeactivate.status === 400, 'Admin self-deactivation is blocked with 400');

  // 8. About Us Content Endpoints
  console.log('\n--- 8. About Us Content API ---');
  const publicAbout = await request('GET', '/api/about');
  assert(publicAbout.status === 200, 'Public can view resort About Us content');
  assert(publicAbout.body.data && publicAbout.body.data.title, 'About Us content contains title and resort story');

  // Guest trying to modify About Us content -> 403
  const guestEditAbout = await request('PUT', '/api/about', {
    title: 'Hacked Title',
  }, guestToken);
  assert(guestEditAbout.status === 403, 'Guest is blocked from modifying About Us content (403 Forbidden)');

  // Admin editing About Us content
  const adminEditAbout = await request('PUT', '/api/about', {
    title: 'TENZAL Luxury Boutique Resort',
    intro: 'A tranquil sanctuary high in the misty tea plantations of Haputale.',
    content: 'Combining traditional Sri Lankan warmth with world-class boutique hospitality.',
    status: 'published',
  }, adminToken);
  assert(adminEditAbout.status === 200, 'Admin can successfully update About Us content');
  assert(adminEditAbout.body.data.title === 'TENZAL Luxury Boutique Resort', 'Updated title saved');

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Start test server
server = app.listen(PORT, async () => {
  try {
    await runTests();
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
