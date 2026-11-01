import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ToastProvider } from './components/common/Toast';
import OverviewPage from './pages/OverviewPage';
import RoomsPage from './pages/RoomsPage';
import BookingsPage from './pages/BookingsPage';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            {/* Overview / Dashboard */}
            <Route path="/" element={<OverviewPage />} />
            <Route path="/overview" element={<Navigate to="/" replace />} />

            {/* Room Booking Module Assigned Routes (Student ID: 22CIS0276) */}
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />

            {/* Team Members' Modules (Clean Prototypes) */}
            <Route
              path="/food-menu"
              element={
                <PlaceholderPage
                  title="Food Menu Management"
                  subtitle="Manage dishes, prices, availability and daily specials"
                />
              }
            />
            <Route
              path="/food-orders"
              element={
                <PlaceholderPage
                  title="Food Orders"
                  subtitle="Live order management and kitchen updates"
                />
              }
            />
            <Route
              path="/gallery"
              element={
                <PlaceholderPage
                  title="Gallery Management"
                  subtitle="Manage resort photo albums and luxury assets"
                />
              }
            />
            <Route
              path="/destinations"
              element={
                <PlaceholderPage
                  title="Destinations"
                  subtitle="Manage places used by Explore and Plan My Day"
                />
              }
            />
            <Route
              path="/plan-my-day"
              element={
                <PlaceholderPage
                  title="Plan My Day Data"
                  subtitle="Curated guest day plans, activities and itineraries"
                />
              }
            />
            <Route
              path="/resort-content"
              element={
                <PlaceholderPage
                  title="Resort Content"
                  subtitle="Editorial copy, resort story, amenities and policies"
                />
              }
            />
            <Route
              path="/inquiries"
              element={
                <PlaceholderPage
                  title="Customer Inquiries"
                  subtitle="Review and respond to guest pre-booking inquiries"
                />
              }
            />
            <Route
              path="/customers"
              element={
                <PlaceholderPage
                  title="Customers"
                  subtitle="Guest profiles, loyalty data, and preferences"
                />
              }
            />
            <Route
              path="/staff-roles"
              element={
                <PlaceholderPage
                  title="Staff & Roles"
                  subtitle="Control access for authorized resort staff"
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  subtitle="Configure resort preferences, currencies, and notifications"
                />
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
