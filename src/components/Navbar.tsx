
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Trophy, LayoutDashboard, LogOut, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Discover', path: '/discover', icon: MapPin },
    { name: 'Find Opponent', path: '/find-opponent', icon: Trophy },
    { name: 'Tournaments', path: '/tournaments', icon: Trophy },
  ];

  if (user) {
    navLinks.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
    if (profile?.role === 'owner') {
      navLinks.push({ name: 'My Pitches', path: '/owner-dashboard', icon: User });
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <Trophy className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-xl font-bold tracking-tighter neon-text">PitchFinder KE</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-slate-300 hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
              
              {user ? (
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-white/10">
                  <Link to="/profile" className="text-slate-300 hover:text-emerald-400">
                    <User className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 ml-4">
                  <Link to="/login" className="btn-secondary text-sm">Login</Link>
                  <Link to="/signup" className="btn-primary text-sm">Sign Up</Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-emerald-400 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-300 hover:text-emerald-400 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="text-slate-300 hover:text-red-400 block w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="btn-secondary text-center text-sm">Login</Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="btn-primary text-center text-sm">Sign Up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
