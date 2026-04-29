
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/3 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24 relative z-10">
        
        {/* Animated Juggler Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex flex-col items-center justify-center text-center lg:text-left order-2 lg:order-1 px-4"
        >
          <div className="relative w-full max-w-[280px] md:max-w-sm aspect-square flex items-center justify-center">
            {/* Stage/Aura */}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
            
            {/* Player Character */}
            <motion.div 
              animate={{ 
                y: [0, -12, 0],
                rotate: [0, 1, -1, 0] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="relative z-10"
            >
              <div className="w-40 h-40 md:w-64 md:h-64 rounded-[48px] bg-slate-900 border-2 border-emerald-500/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                <img 
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=0f172a" 
                  alt="Player" 
                  className="w-full h-full object-cover scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-transparent to-transparent"></div>
              </div>
              
              {/* Specialized Shadow */}
              <motion.div 
                animate={{ 
                  scaleX: [1, 1.2, 1], 
                  opacity: [0.3, 0.5, 0.3],
                  width: ['100%', '110%', '100%']
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-black/60 rounded-[100%] blur-xl"
              ></motion.div>
            </motion.div>

            {/* Pro Juggling Ball */}
            <motion.div
              animate={{
                y: [-80, -320, -100, -300, -80, -340],
                x: [0, 60, -40, 70, -30, 0],
                rotate: [0, 1080, 2160, 3240, 4320, 5400],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "backInOut",
              }}
              className="absolute z-20"
            >
              <div className="relative">
                <span className="text-5xl md:text-8xl drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">⚽</span>
                {/* Visual Kick Effect */}
                <motion.div 
                  animate={{ opacity: [0, 0.8, 0], scale: [1, 2, 0.5] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
                  className="absolute inset-0 bg-emerald-400/20 rounded-full blur-lg"
                ></motion.div>
              </div>
            </motion.div>
          </div>

          <div className="mt-6 lg:mt-12 max-w-sm mx-auto lg:mx-0">
            <div className="hidden sm:inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Live Feedback Enabled</span>
            </div>
            <h3 className="text-2xl md:text-5xl font-black italic tracking-tighter text-white mb-3">
              REJOIN THE <span className="neon-text">SQUAD.</span>
            </h3>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
              Experience the future of Kenyan semi-pro football. Your teammates are checking the clock.
            </p>
          </div>
        </motion.div>

        {/* Login Form Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full lg:max-w-md order-1 lg:order-2"
        >
          <div className="glass p-8 md:p-10 rounded-3xl neon-border relative group overflow-hidden">
            {/* Form Top Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            
            <div className="text-center mb-10">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-slate-950" />
              </div>
              <h2 className="text-4xl font-black tracking-tight mb-2">LOGIN <span className="neon-text italic">NOW</span></h2>
              <p className="text-slate-400 font-medium">Continue your football journey</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 ml-1">Email Address</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity"></div>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                  <input
                    type="email"
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-white placeholder-slate-600"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 ml-1">Password</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity"></div>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                  <input
                    type="password"
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-white placeholder-slate-600"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Enter Pitch</span>
                    <Trophy className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center pt-8 border-t border-white/5">
              <p className="text-slate-400 font-medium">
                Don't have an account?{' '}
                <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-bold underline decoration-emerald-500/30 underline-offset-4">Register your squad</Link>
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Login;
