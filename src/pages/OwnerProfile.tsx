
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Pitch, Profile } from '../types';
import PitchCard from '../components/PitchCard';
import { MapPin, Users, Phone, MessageCircle, Loader2, ChevronLeft, ShieldCheck, Calendar, Trophy, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const OwnerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [owner, setOwner] = useState<Profile | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      // Fetch owner profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (profileError) throw profileError;
      setOwner(profileData);

      // Fetch all pitches by this owner
      const { data: pitchesData, error: pitchesError } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*)')
        .eq('owner_id', id)
        .order('created_at', { ascending: false });
      
      if (pitchesError) throw pitchesError;
      setPitches(pitchesData || []);
    } catch (error: any) {
      console.error('Error fetching owner data:', error);
      toast.error('Error loading owner profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOwnerData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Owner Not Found</h2>
        <p className="text-slate-400 mb-8">The pitch owner you're looking for doesn't exist or has been removed.</p>
        <Link to="/discover" className="btn-primary">Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link to="/discover" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back to Discover
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Owner Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-8 rounded-3xl neon-border text-center sticky top-24">
            <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-emerald-500/20 mx-auto mb-6">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.full_name || ''} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-12 h-12 text-slate-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{owner.full_name || 'Pitch Owner'}</h1>
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6">Verified Provider</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-sm py-3 border-b border-white/5">
                <span className="text-slate-500">Member Since</span>
                <span className="font-bold">{format(new Date(owner.created_at), 'MMM yyyy')}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-3 border-b border-white/5">
                <span className="text-slate-500">Total Pitches</span>
                <span className="font-bold text-emerald-400">{pitches.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-3 border-b border-white/5">
                <span className="text-slate-500">Identity Status</span>
                <div className="flex items-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  <span className="font-bold">Verified</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {owner.phone && (
                <a 
                  href={`tel:${owner.phone}`}
                  className="btn-secondary w-full flex items-center justify-center space-x-2 py-3"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Owner</span>
                </a>
              )}
              <a 
                href={`https://wa.me/${owner.phone?.replace(/\+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full flex items-center justify-center space-x-2 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Content: Pitches List */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Listed Pitches</h2>
              <p className="text-slate-400">Discover all facilities managed by {owner.full_name?.split(' ')[0] || 'this owner'}.</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Top Rated Provider</span>
            </div>
          </div>

          {pitches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pitches.map((pitch) => (
                <PitchCard key={pitch.id} pitch={pitch} />
              ))}
            </div>
          ) : (
            <div className="glass p-12 rounded-3xl text-center border border-white/5">
              <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Pitches Listed</h3>
              <p className="text-slate-500">This owner hasn't listed any pitches yet.</p>
            </div>
          )}

          {/* Owner Achievements/Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="glass p-6 rounded-2xl border border-white/5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Highly Rated</div>
                <div className="text-xs text-slate-500">Consistently 4.5+ stars</div>
              </div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Reliable Host</div>
                <div className="text-xs text-slate-500">98% booking success</div>
              </div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Secure Venue</div>
                <div className="text-xs text-slate-500">Verified safety protocols</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
