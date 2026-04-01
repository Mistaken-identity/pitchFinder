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
import Profile from './pages/Profile';

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/find-opponent" element={<FindOpponent />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
