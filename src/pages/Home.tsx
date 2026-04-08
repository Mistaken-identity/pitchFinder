
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Users, Calendar, ShieldCheck, ArrowRight, Trophy, Code, 
  Zap, Target, MessageSquare, Star, TrendingUp, CheckCircle2, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Pitch } from '../types';
import PitchCard from '../components/PitchCard';

const HUMOR_QUOTES = [
  "Football is a simple game. Twenty-two men chase a ball for 90 minutes and at the end, the Germans always win.",
  "I spent a lot of money on booze, birds and fast cars. The rest I just squandered.",
  "The first 90 minutes are the most important.",
  "VAR: Providing 4K resolution of referees making the same mistakes as before.",
  "My team's defense is like a screen door on a submarine.",
  "I'm not saying my team is bad, but our goalkeeper has a 'Welcome' mat in front of the net.",
  "Football: The only place where a 'clean sheet' is a good thing and 'getting sacked' is a bad thing.",
  "I once asked a referee if he could see. He said 'No, I'm a referee, not a miracle worker.'",
  "The ball is round, the game is 90 minutes, and everything else is just theory.",
  "If you're first, you're first. If you're second, you're nothing."
];

const STATS = [
  { label: 'Pitches Listed', value: '150+', icon: MapPin },
  { label: 'Active Teams', value: '450+', icon: Users },
  { label: 'Matches Played', value: '1,200+', icon: Trophy },
  { label: 'Happy Players', value: '5,000+', icon: Star },
];

const TESTIMONIALS = [
  {
    name: "Kevin 'The Wall' Otieno",
    role: "Captain, Eastlands United",
    text: "Finally, an app that doesn't crash as often as my striker. Found a pitch in 2 minutes and got thrashed 5-0. 10/10 experience.",
    avatar: "https://i.pravatar.cc/150?u=kevin"
  },
  {
    name: "Sarah Wanjiku",
    role: "Owner, Westlands Arena",
    text: "Managing bookings used to be a nightmare of WhatsApp messages. Now it's all automated. More time for me to shout at the refs.",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    name: "Antony 'The Dev' Emong'oluk",
    role: "Founder",
    text: "I built this because I was tired of calling 10 people just to find a pitch. Now I can find a pitch and still lose the game.",
    avatar: "https://i.pravatar.cc/150?u=antony"
  }
];

const Home: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [topPitches, setTopPitches] = useState<Pitch[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(true);

  useEffect(() => {
    fetchTopPitches();
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HUMOR_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchTopPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*), owner:profiles(*)')
        .order('rating', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setTopPitches(data || []);
    } catch (error) {
      console.error('Error fetching top pitches:', error);
    } finally {
      setLoadingPitches(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-950 text-slate-50 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 1.5 }}
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000" 
            alt="Football Pitch" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-md">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Kenya's #1 Football Platform</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 md:mb-8 leading-none">
              DOMINATE THE <br />
              <span className="neon-text italic">PITCH</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed">
              Stop chasing owners. Start chasing goals. The ultimate platform to <span className="text-emerald-400 font-bold">Discover</span>, <span className="text-cyan-400 font-bold">Book</span>, and <span className="text-purple-400 font-bold">Conquer</span> Kenyan football.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
              <Link to="/discover" className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-3 px-8 md:px-10 py-4 md:py-5 text-base md:text-lg group">
                <span>Start Playing</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/find-opponent" className="btn-secondary w-full sm:w-auto flex items-center justify-center space-x-3 px-8 md:px-10 py-4 md:py-5 text-base md:text-lg">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span>Find an Opponent</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Scroll to Explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-emerald-500 to-transparent"></div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 glass rounded-2xl border border-white/5"
              >
                <stat.icon className="w-6 h-6 text-emerald-500 mx-auto mb-4" />
                <div className="text-3xl md:text-4xl font-black mb-1 neon-text">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Grounds Section */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                TOP RATED <br />
                <span className="neon-text">GROUNDS</span>
              </h2>
              <p className="text-xl text-slate-400">The most elite pitches in the city, vetted by the community and ready for your next match.</p>
            </div>
            <Link to="/discover" className="btn-secondary flex items-center space-x-2 group">
              <span>View All Grounds</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingPitches ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          ) : topPitches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topPitches.map((pitch, i) => (
                <motion.div
                  key={pitch.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <PitchCard pitch={pitch} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass rounded-3xl border border-dashed border-white/10">
              <p className="text-slate-500 mb-6">No grounds listed yet. Be the first to list your pitch!</p>
              <Link to="/signup?role=owner" className="btn-primary px-8 py-3">Register Your Pitch</Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                THREE STEPS TO <br />
                <span className="text-emerald-500">GLORY</span>
              </h2>
              <p className="text-xl text-slate-400">We've simplified the beautiful game. No more endless calls, no more "is the pitch free?" drama.</p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-2 text-emerald-500 font-bold italic">
                <TrendingUp className="w-6 h-6" />
                <span>99% Success Rate in Finding Matches</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Find Your Turf',
                desc: 'Browse through the best astro-turfs and grass pitches in Nairobi and beyond. Filter by your budget and location.',
                icon: MapPin,
                color: 'from-emerald-500/20 to-transparent'
              },
              {
                step: '02',
                title: 'Secure the Slot',
                desc: 'Pay instantly via M-Pesa. Your booking is confirmed the moment the transaction hits. No double bookings, ever.',
                icon: Calendar,
                color: 'from-cyan-500/20 to-transparent'
              },
              {
                step: '03',
                title: 'Show Up & Play',
                desc: 'Get your squad together, show up at the facility, and let your football do the talking. (Or the shouting).',
                icon: Target,
                color: 'from-purple-500/20 to-transparent'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`relative p-10 rounded-3xl border border-white/10 bg-gradient-to-br ${item.color} group hover:border-emerald-500/50 transition-all`}
              >
                <div className="text-6xl font-black text-white/5 absolute top-4 right-8 group-hover:text-emerald-500/10 transition-colors">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center mb-8 border border-white/10">
                  <item.icon className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Pitch Section */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="glass rounded-[30px] md:rounded-[40px] overflow-hidden border border-white/10 flex flex-col lg:flex-row">
            <div className="lg:w-1/2 relative h-64 sm:h-80 lg:h-auto">
              <img 
                src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1200" 
                alt="Featured Pitch" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-emerald-500 text-slate-950 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter shadow-xl">
                Pitch of the Month
              </div>
            </div>
            <div className="lg:w-1/2 p-8 sm:p-12 lg:p-20 flex flex-col justify-center">
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />)}
                </div>
                <span className="text-slate-500 text-xs sm:text-sm">(120+ Reviews)</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight">
                WESTLANDS <br />
                <span className="neon-text">ARENA 5.0</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-8 sm:mb-10 leading-relaxed">
                Experience the finest 5-a-side astro-turf in Nairobi. High-intensity lighting, professional-grade surface, and a vibe that makes you feel like you're at the Emirates.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-10 sm:mb-12">
                {['Pro-Grade AstroTurf', 'Night Lighting', 'Changing Rooms', 'Ample Parking'].map((feature, i) => (
                  <div key={i} className="flex items-center space-x-3 text-slate-300 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/discover" className="btn-primary inline-flex items-center justify-center space-x-3 self-stretch sm:self-start px-8 py-4">
                <span className="font-bold">Book This Pitch</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">WHAT THE <br /><span className="text-cyan-400">STREETS</span> ARE SAYING</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto italic">Real feedback from real players who probably spend more time on this app than at work.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="glass p-10 rounded-3xl border border-white/5 relative"
              >
                <MessageSquare className="w-10 h-10 text-emerald-500/20 absolute top-8 right-8" />
                <p className="text-lg text-slate-300 mb-8 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center space-x-4">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border-2 border-emerald-500/50" />
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5 -skew-y-6 origin-right"></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="glass p-16 md:p-24 rounded-[50px] text-center relative overflow-hidden neon-border">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">ARE YOU A <br /> PITCH OWNER?</h2>
            <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop losing money on empty slots. List your facility on PitchFinder KE and reach thousands of players across Kenya.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/signup?role=owner" className="btn-primary px-10 py-5 text-lg flex items-center space-x-3">
                <span>Register Your Pitch</span>
                <ShieldCheck className="w-6 h-6" />
              </Link>
              <a href="https://wa.me/254700000000" className="btn-secondary px-10 py-5 text-lg flex items-center space-x-3">
                <MessageSquare className="w-6 h-6" />
                <span>Chat with Sales</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Humor & Founder Recognition */}
      <section className="py-24 border-t border-white/5 bg-slate-950 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="mb-24 h-32 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center space-y-6 max-w-3xl"
              >
                <Trophy className="w-10 h-10 text-emerald-500/30" />
                <p className="text-2xl md:text-4xl font-black text-slate-200 italic leading-tight tracking-tight">
                  "{HUMOR_QUOTES[quoteIndex]}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 text-left">
            <div className="max-w-xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Founder's Vision</span>
              </div>
              <h4 className="text-3xl font-black mb-4">Antony Emong'oluk</h4>
              <p className="text-slate-400 leading-relaxed mb-6">
                "PitchFinder KE was born from a simple frustration: finding a place to play shouldn't be harder than the game itself. We're building the digital infrastructure for Kenyan football, empowering every player to find their turf and every owner to maximize their reach."
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">Joined by 5,000+ players across Kenya</span>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border border-white/10 bg-white/5 flex flex-col items-center justify-center min-w-[280px] relative group">
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 rotate-12 group-hover:rotate-0 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <div className="space-y-6 w-full">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Code Quality</span>
                  <span className="text-emerald-400 font-black">100%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500"></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Passion Level</span>
                  <span className="text-emerald-400 font-black">∞</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-cyan-500"></div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 w-full text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">Crafted with ❤️ in Kenya</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer-ish Section */}
      <footer className="py-12 border-t border-white/5 text-center text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 PitchFinder KE. All rights reserved. No refunds for bad finishing.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
