
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Users, Calendar, ShieldCheck, ArrowRight, Trophy, Code } from 'lucide-react';

const HUMOR_QUOTES = [
  "In football, the ball is round. In coding, the bugs are everywhere. Both will ruin your weekend.",
  "Why did the developer go to the football match? To see the 'pitch' deck.",
  "My code is like a Sunday league defender: slow, buggy, and always missing the target.",
  "A 'clean sheet' in football is a dream. A 'clean build' in coding is a miracle.",
  "Footballers dive for penalties. Developers dive into stack overflow. Both are looking for a quick fix.",
  "Referees use VAR. Developers use console.log. Both still get it wrong half the time.",
  "The only thing more stressful than a penalty shootout is a production deployment on a Friday."
];

const Home: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HUMOR_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000" 
            alt="Football Pitch" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
              FIND YOUR <span className="neon-text">PERFECT PITCH</span> <br />
              IN KENYA
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              The ultimate platform for amateur football in Kenya. Discover pitches, book slots, and find teams to play against.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/discover" className="btn-primary flex items-center space-x-2 w-full sm:w-auto">
                <span>Start Playing</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/find-opponent" className="btn-secondary flex items-center space-x-2 w-full sm:w-auto">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span>Find an Opponent</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose PitchFinder?</h2>
            <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Easy Discovery',
                desc: 'Find pitches near you with our interactive map. Filter by price, rating, and availability.',
                icon: MapPin,
                color: 'text-emerald-400'
              },
              {
                title: 'Instant Booking',
                desc: 'Book your preferred slot in seconds or contact pitch owners directly via WhatsApp.',
                icon: Calendar,
                color: 'text-cyan-400'
              },
              {
                title: 'Team Matchmaking',
                desc: 'Looking for a challenge? Post a match request and connect with other teams in your area.',
                icon: Users,
                color: 'text-purple-400'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="glass p-8 rounded-2xl neon-border hover:bg-white/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-white/5 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass p-12 rounded-3xl text-center relative overflow-hidden neon-border">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Are you a Pitch Owner?</h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              List your facility on PitchFinder KE and reach thousands of players across Nairobi. Manage bookings and grow your business.
            </p>
            <Link to="/signup?role=owner" className="btn-primary inline-flex items-center space-x-2">
              <span>Register Your Pitch</span>
              <ShieldCheck className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Animated Humor & Founder Recognition */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-12 h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex items-center space-x-4 text-slate-400 italic text-lg"
              >
                <Code className="w-6 h-6 text-emerald-500 shrink-0" />
                <p>"{HUMOR_QUOTES[quoteIndex]}"</p>
                <Trophy className="w-6 h-6 text-emerald-500 shrink-0" />
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="pt-8 border-t border-white/5">
            <p className="text-slate-500 text-sm uppercase tracking-[0.3em] mb-2">Developed by</p>
            <h4 className="text-2xl font-bold neon-text">Antony Emong'oluk</h4>
            <p className="text-xs text-slate-600 mt-2">Founder & Lead Architect</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
