import React from 'react';
import { motion } from 'motion/react';

interface JugglingCharacterProps {
  className?: string;
  avatarUrl?: string;
}

const JugglingCharacter: React.FC<JugglingCharacterProps> = ({ className, avatarUrl }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center w-full h-full`}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>

      <motion.div
        animate={{ 
          y: [0, -12, 0],
          rotate: [-0.5, 0.5, -0.5]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative w-72 h-96 flex flex-col items-center"
      >
        {/* Head with dynamic neck */}
        <div className="relative z-40 mb-[-12px]">
          <motion.div
            animate={{ rotate: [-8, 8, -8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-[32px] bg-slate-800 border-2 border-emerald-500/30 overflow-hidden shadow-2xl relative"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Athlete Head" className="w-full h-full object-cover scale-110" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
            )}
          </motion.div>
          {/* Neck */}
          <div className="w-6 h-4 bg-slate-800 mx-auto -mt-1 rounded-b-lg border-x border-slate-700"></div>
        </div>

        {/* Torso - More organic shape */}
        <motion.div 
          className="relative z-20 w-32 h-44 bg-slate-800 border-b-8 border-emerald-500/10 rounded-t-[45%] rounded-b-[30%] shadow-2xl flex flex-col items-center overflow-hidden"
        >
          {/* Sports Jersey Details */}
          <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-emerald-500/20 to-transparent"></div>
          <div className="mt-10 font-mono text-[8px] font-black text-emerald-500/30 tracking-[0.4em] uppercase">Kenya Elite</div>
          <div className="text-5xl font-black text-emerald-500/5 mt-4 select-none">10</div>
          
          {/* Chest definition */}
          <div className="absolute top-12 w-28 h-px bg-white/5 blur-sm"></div>
        </motion.div>

        {/* Left Arm - Fluid Motion */}
        <motion.div
          style={{ originY: 0, originX: 0.5 }}
          animate={{ rotate: [-25, -45, -25] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 -left-6 z-10"
        >
          <div className="w-6 h-20 bg-slate-800 rounded-full border border-slate-700"></div>
          {/* Lower Arm */}
          <motion.div 
             animate={{ rotate: [5, 15, 5] }}
             className="w-5 h-20 bg-slate-800 -mt-2 rounded-full border border-slate-700 origin-top"
          >
             {/* Hand */}
             <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-6 h-7 bg-slate-700 rounded-lg blur-[1px]"></div>
          </motion.div>
        </motion.div>

        {/* Right Arm - Fluid Motion */}
        <motion.div
          style={{ originY: 0, originX: 0.5 }}
          animate={{ rotate: [25, 45, 25] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="absolute top-32 -right-6 z-10"
        >
          <div className="w-6 h-20 bg-slate-800 rounded-full border border-slate-700"></div>
          {/* Lower Arm */}
          <motion.div 
             animate={{ rotate: [-5, -15, -5] }}
             className="w-5 h-20 bg-slate-800 -mt-2 rounded-full border border-slate-700 origin-top"
          >
             {/* Hand */}
             <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-6 h-7 bg-slate-700 rounded-lg blur-[1px]"></div>
          </motion.div>
        </motion.div>

        {/* Left Leg (The Juggling Leg) - High Knee Action */}
        <motion.div
          style={{ originY: 0 }}
          animate={{ 
            rotate: [15, -75, 15],
            y: [0, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[230px] left-4 z-10"
        >
          {/* Thigh */}
          <div className="w-9 h-24 bg-slate-800 rounded-full border border-slate-700 shadow-lg"></div>
          {/* Calf */}
          <motion.div 
            style={{ originY: 0 }}
            animate={{ rotate: [0, 40, 0] }}
            className="w-7 h-24 bg-slate-800 -mt-4 mx-auto rounded-full border border-slate-700"
          >
            {/* Athletic shoe */}
            <div className="absolute bottom-[-2px] left-[-4px] w-14 h-8 bg-slate-900 rounded-2xl border-b-4 border-emerald-500 shadow-lg rotate-[-15deg]">
               <div className="absolute top-1 inset-x-2 h-px bg-white/20"></div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Leg (Standing Leg) - Dynamic Balance */}
        <motion.div
          style={{ originY: 0 }}
          animate={{ 
            rotate: [-5, 5, -5],
            scaleY: [1, 0.98, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[230px] right-4 z-10"
        >
          {/* Thigh */}
          <div className="w-9 h-24 bg-slate-800 rounded-full border border-slate-700 shadow-lg"></div>
          {/* Calf */}
          <div className="w-7 h-24 bg-slate-800 -mt-4 mx-auto rounded-full border border-slate-700">
             {/* Athletic shoe */}
             <div className="absolute bottom-[-2px] right-[-4px] w-14 h-8 bg-slate-900 rounded-2xl border-b-4 border-emerald-500 shadow-lg rotate-[15deg]">
                <div className="absolute top-1 inset-x-2 h-px bg-white/20"></div>
             </div>
          </div>
        </motion.div>

        {/* The Ball - Perfectly Synced Juggling */}
        <motion.div
          animate={{
            y: [30, -380, 20],
            x: [0, 60, -10],
            rotate: [0, 720, 1440],
            scale: [1, 0.8, 1.1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-72 z-50 pointer-events-none"
        >
          <div className="relative group">
            <span className="text-7xl drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] select-none">⚽</span>
            <motion.div 
              animate={{ opacity: [0, 0.6, 0], scale: [1, 2.5, 1.5] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }}
              className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl"
            ></motion.div>
          </div>
        </motion.div>

        {/* Ground Projection/Shadow */}
        <motion.div
          animate={{ 
            scaleX: [1, 1.4, 1], 
            opacity: [0.3, 0.6, 0.3],
            width: ['100%', '115%', '100%']
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -bottom-12 w-56 h-8 bg-black/60 rounded-[100%] blur-2xl"
        />
      </motion.div>
    </div>
  );
};

export default JugglingCharacter;
