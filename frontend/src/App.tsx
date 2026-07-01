import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import type { ReactNode } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import Resume from './pages/Resume';
import CareerCompare from './pages/CareerCompare';
import Skills from './pages/Skills';
import Settings from './pages/Settings';
import Interview from './pages/Interview';
import Challenges from './pages/Challenges';
import Jobs from './pages/Jobs';
import Certifications from './pages/Certifications';
import Badges from './pages/Badges';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Loader from './components/Loader';
import AnnouncementBanner from './components/AnnouncementBanner';
import AdminApp from './admin/AdminApp';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Hides a page when its feature flag is turned off in the admin portal. */
function FeatureRoute({ feature, children }: { feature: string; children: ReactNode }) {
  const { isFeatureEnabled } = useConfig();
  if (!isFeatureEnabled(feature)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Public information pages */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Hidden admin portal — self-guarded (server enforces the role). */}
      <Route path="/admin/*" element={<AdminApp />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/skills" element={<FeatureRoute feature="skills"><Skills /></FeatureRoute>} />
        <Route path="/roadmap" element={<FeatureRoute feature="roadmap"><Roadmap /></FeatureRoute>} />
        <Route path="/certifications" element={<FeatureRoute feature="certifications"><Certifications /></FeatureRoute>} />
        <Route path="/projects" element={<FeatureRoute feature="projects"><Projects /></FeatureRoute>} />
        <Route path="/analytics" element={<FeatureRoute feature="analytics"><Analytics /></FeatureRoute>} />
        <Route path="/resume" element={<FeatureRoute feature="resume"><Resume /></FeatureRoute>} />
        <Route path="/compare" element={<FeatureRoute feature="compare"><CareerCompare /></FeatureRoute>} />
        <Route path="/badges" element={<FeatureRoute feature="badges"><Badges /></FeatureRoute>} />
        <Route path="/interview" element={<FeatureRoute feature="interview"><Interview /></FeatureRoute>} />
        <Route path="/challenges" element={<FeatureRoute feature="challenges"><Challenges /></FeatureRoute>} />
        <Route path="/jobs" element={<FeatureRoute feature="jobs"><Jobs /></FeatureRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <AnnouncementBanner />
          <AppRoutes />
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
