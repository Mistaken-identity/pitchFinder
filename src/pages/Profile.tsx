
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Mail, ShieldCheck, Users, Loader2, Camera, Save, Heart, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Pitch } from '../types';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [favorites, setFavorites] = useState<Pitch[]>([]);
  const [favsLoading, setFavsLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
      fetchFavorites();
    }
  }, [profile]);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, pitch:pitches(*, images:pitch_images(*))')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setFavorites(data?.map(f => f.pitch) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setFavsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="glass p-8 rounded-3xl neon-border relative overflow-hidden mb-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-emerald-500/50 transition-all duration-300">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-slate-600" />
              )}
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-xl text-slate-950 shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Info Section */}
          <div className="flex-grow w-full">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-1">{profile.full_name || 'Player'}</h1>
                <div className="flex items-center justify-center md:justify-start space-x-2 text-slate-500 text-sm">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    profile.role === 'owner' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {profile.role}
                  </span>
                  <span>•</span>
                  <span>Member since {new Date(profile.created_at).getFullYear()}</span>
                </div>
              </div>
              
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center space-x-2 px-6"
                >
                  <Users className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        required
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="tel"
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Avatar URL</label>
                  <input
                    type="url"
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2 px-8"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: profile.full_name || '',
                        phone: profile.phone || '',
                        avatar_url: profile.avatar_url || ''
                      });
                    }}
                    className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 glass bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Email Address</p>
                      <p className="text-slate-200">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 glass bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Phone Number</p>
                      <p className="text-slate-200">{profile.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 glass bg-white/5 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Account Status</h3>
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="font-bold">Verified Account</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Your account is fully verified and active.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
          <span>My Favorites</span>
        </h2>
        {favsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map(pitch => (
              <Link key={pitch.id} to={`/pitch/${pitch.id}`} className="glass p-4 rounded-2xl neon-border flex items-center space-x-4 hover:bg-white/5 transition-all">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img 
                    src={pitch.images?.[0]?.image_url || `https://picsum.photos/seed/${pitch.id}/200/200`} 
                    alt={pitch.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold truncate">{pitch.name}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1 text-emerald-500" />
                    <span className="truncate">{pitch.location_name}</span>
                  </div>
                  <p className="text-emerald-400 font-bold text-sm mt-1">KSH {pitch.price_per_hour}/hr</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 glass bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-slate-500">You haven't favorited any pitches yet.</p>
            <Link to="/discover" className="text-emerald-400 text-sm hover:underline mt-2 inline-block">Explore pitches</Link>
          </div>
        )}
      </div>

      {/* Account Security Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold">Account Security</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Your account is secured with email authentication. You can change your password in the settings.</p>
          <button className="text-xs text-emerald-400 font-bold hover:underline">Change Password</button>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold">Team Membership</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">You are currently a captain of 1 team and a member of 2 other teams.</p>
          <button className="text-xs text-cyan-400 font-bold hover:underline">Manage Teams</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
