import React from 'react';
import { motion } from 'motion/react';

interface JugglingCharacterProps {
  className?: string;
  avatarUrl?: string;
}

const JugglingCharacter: React.FC<JugglingCharacterProps> = ({ className, avatarUrl }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>

      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [-1, 1, -1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative w-64 h-80 flex flex-col items-center"
      >
        {/* Head */}
        <motion.div
          animate={{ rotate: [-5, 5, -5], y: [0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-30 w-24 h-24 rounded-3xl bg-slate-800 border-2 border-emerald-500/30 overflow-hidden shadow-xl mb-[-10px]"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
          )}
        </motion.div>

        {/* Torso */}
        <motion.div 
          className="relative z-20 w-32 h-40 bg-slate-800 border-2 border-slate-700 rounded-[40px] shadow-2xl flex flex-col items-center overflow-hidden"
        >
          {/* Shirt Detail */}
          <div className="absolute top-0 inset-x-0 h-4 bg-emerald-500/20"></div>
          <div className="mt-8 text-[10px] font-black text-emerald-500/40 tracking-widest">PITCHFINDER</div>
          <div className="text-4xl font-black text-emerald-500/10 mt-2">10</div>
        </motion.div>

        {/* Left Arm */}
        <motion.div
          style={{ originY: 0, originX: 0.5 }}
          animate={{ rotate: [-20, -40, -20] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 -left-8 w-6 h-28 bg-slate-800 border-2 border-slate-700 rounded-full z-10"
        />

        {/* Right Arm */}
        <motion.div
          style={{ originY: 0, originX: 0.5 }}
          animate={{ rotate: [20, 40, 20] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 -right-8 w-6 h-28 bg-slate-800 border-2 border-slate-700 rounded-full z-10"
        />

        {/* Left Leg (The Juggling Leg) */}
        <motion.div
          style={{ originY: 0 }}
          animate={{ rotate: [10, -60, 10] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[220px] left-6 w-8 h-32 bg-slate-800 border-2 border-slate-700 rounded-full z-10"
        >
          {/* Foot */}
          <div className="absolute bottom-0 -left-2 w-12 h-6 bg-slate-900 rounded-full border-b-2 border-emerald-500/50" />
        </motion.div>

        {/* Right Leg (Standing Leg) */}
        <motion.div
          style={{ originY: 0 }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[220px] right-6 w-8 h-32 bg-slate-800 border-2 border-slate-700 rounded-full z-10"
        >
          {/* Foot */}
          <div className="absolute bottom-0 -right-2 w-12 h-6 bg-slate-900 rounded-full border-b-2 border-emerald-500/50" />
        </motion.div>

        {/* The Ball */}
        <motion.div
          animate={{
            y: [0, -350, 0],
            x: [0, 40, 0],
            rotate: [0, 720, 1440]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-64 z-40"
        >
          <div className="relative group">
            <span className="text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">⚽</span>
            <motion.div 
              animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
              className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md"
            ></motion.div>
          </div>
        </motion.div>

        {/* Shadow */}
        <motion.div
          animate={{ scaleX: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -bottom-10 w-48 h-6 bg-black/50 rounded-full blur-xl"
        />
      </motion.div>
    </div>
  );
};

export default JugglingCharacter;
