import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PitchDetails from './pages/PitchDetails';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import FindOpponent from './pages/FindOpponent';
import ProfilePage from './pages/Profile';
import Tournaments from './pages/Tournaments';
import OwnerProfile from './pages/OwnerProfile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pitch/:id" element={<PitchDetails />} />
            <Route path="/owner/:id" element={<OwnerProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/find-opponent" element={<FindOpponent />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tournaments" element={<Tournaments />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
