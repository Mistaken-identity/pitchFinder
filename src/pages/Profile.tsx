
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Mail, ShieldCheck, Users, Loader2, Camera, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
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
    }
  }, [profile]);

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
      <div className="glass p-8 rounded-3xl neon-border relative overflow-hidden">
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
            <button className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-xl text-slate-950 shadow-lg hover:scale-110 transition-transform">
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
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address (Private)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                  <input
                    type="email"
                    disabled
                    className="w-full glass bg-white/5 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-slate-600 cursor-not-allowed"
                    value={user?.email || ''}
                  />
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

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2 px-8"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
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
