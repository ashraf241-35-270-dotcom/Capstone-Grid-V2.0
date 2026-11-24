import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SectionsPage from './pages/SectionsPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/:id" element={<ExplorePage />} />
        <Route path="archive" element={<ExplorePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
