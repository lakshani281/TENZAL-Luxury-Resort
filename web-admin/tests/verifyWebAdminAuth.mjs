/**
 * Automated Verification Suite for Web Admin Authentication & Protected Routes
 * Uses Vite SSR module loader + React renderToStaticMarkup (no extra test dependencies).
 */

import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}${details ? ` - ${details}` : ''}`);
    failed++;
  }
}

async function run() {
  console.log('====================================================');
  console.log(' TENZAL Web Admin - Auth & Protected Routes Tests');
  console.log('====================================================');

  const vite = await createServer({
    root: path.resolve(import.meta.dirname, '..'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });

  try {
    // Provide minimal global localStorage for AuthContext module load
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };

    const { default: AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx');
    const { default: ProtectedRoute } = await vite.ssrLoadModule('/src/components/common/ProtectedRoute.jsx');
    const { default: Header } = await vite.ssrLoadModule('/src/components/layout/Header.jsx');
    const { default: Sidebar } = await vite.ssrLoadModule('/src/components/layout/Sidebar.jsx');

    function renderWithAuth(authValue, initialPath = '/', element) {
      return renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: authValue },
          React.createElement(MemoryRouter, { initialEntries: [initialPath] }, element)
        )
      );
    }

    // 1. Unauthenticated redirect behavior (ProtectedRoute renders Navigate to /login)
    console.log('\n--- 1. ProtectedRoute & Role Enforcement ---');
    const unauthHtml = renderWithAuth(
      { user: null, token: null, isAuthenticated: false, isLoading: false },
      '/rooms',
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'LOGIN_PAGE_TARGET') }),
        React.createElement(
          Route,
          {
            path: '/*',
            element: React.createElement(
              ProtectedRoute,
              { allowedRoles: ['admin', 'staff'] },
              React.createElement('div', null, 'PROTECTED_ADMIN_CONTENT')
            ),
          }
        )
      )
    );
    assert(
      !unauthHtml.includes('PROTECTED_ADMIN_CONTENT'),
      'Unauthenticated user cannot render protected admin content'
    );

    // 2. Loading state during refresh verification
    const loadingHtml = renderWithAuth(
      { user: null, token: 'tok', isAuthenticated: false, isLoading: true },
      '/',
      React.createElement(
        ProtectedRoute,
        { allowedRoles: ['admin', 'staff'] },
        React.createElement('div', null, 'PROTECTED_ADMIN_CONTENT')
      )
    );
    assert(
      loadingHtml.includes('Authenticating TENZAL Workspace'),
      'Loading state renders authentication spinner during refresh check'
    );

    // 3. Authenticated Admin access
    const adminHtml = renderWithAuth(
      {
        user: { id: 1, name: 'Nadeesha Perera', role: 'admin', email: 'admin@tenzal.com' },
        token: 'valid-admin-token',
        isAuthenticated: true,
        isLoading: false,
      },
      '/',
      React.createElement(
        ProtectedRoute,
        { allowedRoles: ['admin', 'staff'] },
        React.createElement('div', null, 'PROTECTED_ADMIN_CONTENT')
      )
    );
    assert(
      adminHtml.includes('PROTECTED_ADMIN_CONTENT'),
      'Authenticated admin can access protected routes'
    );

    // 4. Authenticated Staff access
    const staffHtml = renderWithAuth(
      {
        user: { id: 2, name: 'Kasun Silva', role: 'staff', email: 'kasun@tenzal.com' },
        token: 'valid-staff-token',
        isAuthenticated: true,
        isLoading: false,
      },
      '/food-orders',
      React.createElement(
        ProtectedRoute,
        { allowedRoles: ['admin', 'staff'] },
        React.createElement('div', null, 'PROTECTED_STAFF_CONTENT')
      )
    );
    assert(
      staffHtml.includes('PROTECTED_STAFF_CONTENT'),
      'Authenticated staff can access protected routes'
    );

    // 5. Guest role restriction
    const guestHtml = renderWithAuth(
      {
        user: { id: 4, name: 'Amelia Hart', role: 'guest', email: 'amelia@example.com' },
        token: 'valid-guest-token',
        isAuthenticated: true,
        isLoading: false,
      },
      '/',
      React.createElement(
        ProtectedRoute,
        { allowedRoles: ['admin', 'staff'] },
        React.createElement('div', null, 'PROTECTED_ADMIN_CONTENT')
      )
    );
    assert(
      guestHtml.includes('Access Restricted') && !guestHtml.includes('PROTECTED_ADMIN_CONTENT'),
      'Authenticated guest is blocked with Access Restricted'
    );

    // 6. Header & Sidebar display authenticated user details
    console.log('\n--- 2. Header & Sidebar User Context ---');
    const staffAuth = {
      user: { id: 2, name: 'Kasun Silva', role: 'staff', email: 'kasun@tenzal.com' },
      token: 'valid-staff-token',
      isAuthenticated: true,
      isLoading: false,
      logout: async () => {},
    };
    const headerHtml = renderWithAuth(
      staffAuth,
      '/',
      React.createElement(Header, { title: 'Overview', subtitle: 'Summary' })
    );
    assert(
      headerHtml.includes('Kasun Silva') && headerHtml.includes('KS') && headerHtml.includes('staff'),
      'Header renders authenticated user name, initials, and role'
    );

    const sidebarHtml = renderWithAuth(staffAuth, '/', React.createElement(Sidebar));
    assert(
      sidebarHtml.includes('Kasun Silva') && sidebarHtml.includes('KS') && sidebarHtml.includes('Sign out'),
      'Sidebar renders authenticated user details and Sign out button'
    );

    // 7. Source integration verification (App.jsx, AuthContext.jsx, Sidebar.jsx)
    console.log('\n--- 3. Auth Integration Contracts (Login, Refresh, Logout) ---');
    const srcRoot = path.resolve(import.meta.dirname, '..', 'src');
    const appSrc = fs.readFileSync(path.join(srcRoot, 'App.jsx'), 'utf8');
    const authCtxSrc = fs.readFileSync(path.join(srcRoot, 'context', 'AuthContext.jsx'), 'utf8');
    const sidebarSrc = fs.readFileSync(path.join(srcRoot, 'components', 'layout', 'Sidebar.jsx'), 'utf8');

    assert(
      appSrc.includes('<AuthProvider>') &&
        appSrc.includes('path="/login"') &&
        appSrc.includes('PublicLoginRoute') &&
        appSrc.includes('allowedRoles={[\'admin\', \'staff\']}'),
      'App.jsx wires AuthProvider, /login PublicLoginRoute, and ProtectedRoute for admin/staff'
    );
    assert(
      authCtxSrc.includes('authApi.getMe()') &&
        authCtxSrc.includes("localStorage.removeItem('tenzal_token')") &&
        authCtxSrc.includes("localStorage.removeItem('tenzal_user')"),
      'AuthContext.jsx verifies session via /auth/me on refresh and clears invalid/expired tokens and logout state'
    );
    assert(
      sidebarSrc.includes('await logout()') && sidebarSrc.includes("navigate('/login', { replace: true })"),
      'Sidebar.jsx clears auth via logout() and redirects to /login'
    );
  } finally {
    await vite.close();
  }

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Fatal Web Admin test error:', err);
  process.exit(1);
});
