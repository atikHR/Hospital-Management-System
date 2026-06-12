import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/public/Home';
import DoctorList from './pages/public/DoctorList';
import DoctorProfile from './pages/public/DoctorProfile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManageCategories from './pages/admin/ManageCategories';
import ManagePatients from './pages/admin/ManagePatients';
import ManageAppointments from './pages/admin/ManageAppointments';
import ManageOffers from './pages/admin/ManageOffers';
import ManageGallery from './pages/admin/ManageGallery';
import ManageQuotes from './pages/admin/ManageQuotes';

import CursorTrail from './components/CursorTrail';

function App() {
  return (
    <>
      <CursorTrail />
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<DoctorList />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient */}
        <Route path="/patient/dashboard" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/patient/profile" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfile />
          </ProtectedRoute>
        } />

        {/* Doctor */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/doctors" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageDoctors />
          </ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageCategories />
          </ProtectedRoute>
        } />
        <Route path="/admin/patients" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManagePatients />
          </ProtectedRoute>
        } />
        <Route path="/admin/appointments" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageAppointments />
          </ProtectedRoute>
        } />
        <Route path="/admin/offers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageOffers />
          </ProtectedRoute>
        } />
        <Route path="/admin/gallery" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageGallery />
          </ProtectedRoute>
        } />
        <Route path="/admin/quotes" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageQuotes />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
