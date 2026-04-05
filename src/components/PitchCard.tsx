
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, Phone, Heart, Share2 } from 'lucide-react';
import { Pitch } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

interface PitchCardProps {
  pitch: Pitch;
  compact?: boolean;
}

const PitchCard: React.FC<PitchCardProps> = ({ pitch, compact = false }) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBookedNow, setIsBookedNow] = useState(false);

  const primaryImage = pitch.images?.find(img => img.is_primary)?.image_url || 
    (pitch.images?.[0]?.image_url) || 
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800';

  useEffect(() => {
    if (user) {
      checkIfFavorite();
    }
    checkCurrentBooking();
  }, [user, pitch.id]);

  const checkCurrentBooking = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('pitch_id', pitch.id)
      .eq('booking_date', today)
      .eq('status', 'confirmed')
      .lte('start_time', currentTime)
      .gt('end_time', currentTime);

    if (data && data.length > 0) {
      setIsBookedNow(true);
    }
  };

  const checkIfFavorite = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user?.id)
      .eq('pitch_id', pitch.id)
      .single();
    
    setIsFavorite(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to favorite pitches');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('pitch_id', pitch.id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, pitch_id: pitch.id });
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const sharePitch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/pitch/${pitch.id}`;
    if (navigator.share) {
      navigator.share({
        title: pitch.name,
        text: `Check out this pitch on PitchFinder KE: ${pitch.name}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Link 
        to={`/pitch/${pitch.id}`}
        className={`block glass rounded-xl overflow-hidden neon-border hover:bg-white/10 transition-all duration-300 group ${compact ? 'flex' : ''}`}
      >
        <div className={`${compact ? 'w-1/3 h-full' : 'h-48'} overflow-hidden relative`}>
          <img 
            src={primaryImage} 
            alt={pitch.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 right-2 flex flex-col space-y-2">
            <button 
              onClick={toggleFavorite}
              disabled={loading}
              className={`p-1.5 rounded-lg glass backdrop-blur-md transition-all ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-red-500/50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={sharePitch}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-emerald-500/50 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex flex-col space-y-1">
            <div className="glass px-2 py-1 rounded text-xs font-bold text-emerald-400">
              KSH {pitch.price_per_hour}/hr
            </div>
            {isBookedNow && (
              <div className="bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-black text-white uppercase tracking-widest animate-pulse">
                Currently Booked
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg leading-tight">{pitch.name}</h3>
            <div className="flex items-center text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 text-sm font-bold">{pitch.rating || 'New'}</span>
            </div>
          </div>
          
          <div className="flex items-center text-slate-400 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1 text-emerald-500" />
            <span className="truncate">{pitch.location_name}</span>
          </div>
          
          {!compact && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center text-xs text-slate-500">
                <Clock className={`w-3 h-3 mr-1 ${isBookedNow ? 'text-red-400' : 'text-emerald-400'}`} />
                <span>{isBookedNow ? 'Next Slot Available' : 'Available Now'}</span>
              </div>
              <div className="flex items-center text-xs text-slate-500">
                <Phone className="w-3 h-3 mr-1" />
                <span>Contact Owner</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default PitchCard;
