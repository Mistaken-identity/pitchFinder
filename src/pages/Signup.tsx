
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Phone, Loader2, Trophy, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserRole } from '../types';

const Signup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'player';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/personas/svg?seed=Lucky');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  const AVATARS = [
    { id: '1', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Lucky', label: 'Striker' },
    { id: '2', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Bailey', label: 'Midfielder' },
    { id: '3', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Oliver', label: 'Defender' },
    { id: '4', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Willow', label: 'Winger' },
    { id: '5', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Ziggy', label: 'Goalie' },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role,
          phone,
          avatar_url: avatarUrl,
        });

      if (profileError) throw profileError;

      setShowWelcome(true);
    } catch (error: any) {
      toast.error(error.message || 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full glass p-8 rounded-2xl neon-border">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
          <p className="text-slate-400 mt-2">Join the PitchFinder KE community</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('player')}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-row sm:flex-col items-center justify-center space-x-4 sm:space-x-0 sm:space-y-2 ${
                role === 'player' 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="font-bold">Player</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-row sm:flex-col items-center justify-center space-x-4 sm:space-x-0 sm:space-y-2 ${
                role === 'owner' 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
              <span className="font-bold">Pitch Owner</span>
            </button>
          </div>
          
          {/* Avatar Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-4 text-center">Choose your Player Profile</label>
            <div className="flex flex-wrap justify-center gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarUrl(avatar.url)}
                  className={`group relative p-1 rounded-2xl border-2 transition-all duration-300 hover:scale-110 ${
                    avatarUrl === avatar.url 
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800">
                    <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Football Juggling Decoration */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center transition-all duration-700 ${
                    avatarUrl === avatar.url ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}>
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full blur-sm opacity-50 animate-pulse"></div>
                      <span className="relative z-10 text-xl animate-bounce" style={{ display: 'inline-block' }}>⚽</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{avatar.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  required
                  className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                  placeholder="+254 700 000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/10">
          <p className="text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
          <div className="relative w-full max-w-md glass p-10 rounded-3xl neon-border text-center">
            {/* Juggling Avatar in Welcome Modal */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="w-full h-full rounded-3xl overflow-hidden bg-slate-800 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 flex items-center justify-center">
                <span className="text-3xl animate-bounce" style={{ display: 'inline-block' }}>⚽</span>
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-30 animate-pulse"></div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-4 neon-text">Welcome to the Squad!</h2>
            <p className="text-slate-300 mb-8 leading-relaxed italic">
              "You've successfully signed up! Your coding skills might be better than your finishing, but at least here you won't get a red card for a syntax error. Prepare to be thrashed on the pitch and mocked in the chat. Welcome to PitchFinder KE!"
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full py-4 text-lg font-bold"
            >
              Enter the Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
