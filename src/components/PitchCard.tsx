
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, Phone } from 'lucide-react';
import { Pitch } from '../types';

interface PitchCardProps {
  pitch: Pitch;
  compact?: boolean;
}

const PitchCard: React.FC<PitchCardProps> = ({ pitch, compact = false }) => {
  const primaryImage = pitch.images?.find(img => img.is_primary)?.image_url || 
    (pitch.images?.[0]?.image_url) || 
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800';

  return (
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
        <div className="absolute top-2 right-2 glass px-2 py-1 rounded text-xs font-bold text-emerald-400">
          KSH {pitch.price_per_hour}/hr
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
              <Clock className="w-3 h-3 mr-1" />
              <span>Available Now</span>
            </div>
            <div className="flex items-center text-xs text-slate-500">
              <Phone className="w-3 h-3 mr-1" />
              <span>Contact Owner</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default PitchCard;
