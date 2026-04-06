
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Booking, MatchRequest, Pitch, Notification } from '../types';
import { Calendar, Trophy, MapPin, Clock, CheckCircle, XCircle, Loader2, Plus, Users, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import PitchCard from '../components/PitchCard';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [nearbyPitches, setNearbyPitches] = useState<Pitch[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, pitch:pitches(*, owner:profiles(*))')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true });
      
      setBookings(bookingsData || []);

      // Fetch match requests (where user is captain)
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id')
        .eq('captain_id', user.id);
      
      if (teamsData && teamsData.length > 0) {
        const teamIds = teamsData.map(t => t.id);
        const { data: matchesData } = await supabase
          .from('match_requests')
          .select('*, team:teams(*), pitch:pitches(*)')
          .in('team_id', teamIds)
          .order('match_date', { ascending: true });
        
        setMatchRequests(matchesData || []);
      }

      // Fetch popular/nearby pitches
      const { data: pitchesData } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*), owner:profiles(*)')
        .limit(3);
      
      setNearbyPitches(pitchesData || []);

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const hasTeams = matchRequests.length > 0 || (bookings.length > 0 && profile?.role === 'player');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, <span className="neon-text">{profile?.full_name?.split(' ')[0] || 'Player'}</span>!</h1>
          <p className="text-slate-400">Here's what's happening with your football schedule.</p>
        </div>
        <div className="flex space-x-4">
          <Link to="/find-opponent" className="btn-secondary flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <span>Find Opponent</span>
          </Link>
          <Link to="/discover" className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Book a Pitch</span>
          </Link>
        </div>
      </div>

      {profile?.role === 'player' && matchRequests.length === 0 && (
        <div className="mb-10 glass p-8 rounded-2xl neon-border bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Ready to compete?</h2>
              <p className="text-slate-400 text-sm">Create a team to start challenging others and tracking your stats.</p>
            </div>
          </div>
          <Link to="/find-opponent" className="btn-primary whitespace-nowrap">
            Create Your Team
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bookings & Matches */}
        <div className="lg:col-span-2 space-y-8">
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="glass p-6 rounded-2xl neon-border bg-cyan-500/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <span>Recent Notifications</span>
                </h2>
              </div>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-xl border transition-all flex items-start space-x-4 ${
                      notif.read ? 'bg-white/5 border-white/5 opacity-60' : 'bg-cyan-500/10 border-cyan-500/20'
                    }`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      notif.type === 'match_confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm">{notif.title}</h3>
                        <span className="text-[10px] text-slate-500">{format(new Date(notif.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                      {notif.link && (
                        <Link to={notif.link} className="text-[10px] text-cyan-400 hover:underline mt-2 inline-block font-bold uppercase tracking-widest">
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Bookings */}
          <div className="glass p-6 rounded-2xl neon-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Upcoming Bookings</span>
              </h2>
              <Link to="/discover" className="text-xs text-emerald-400 hover:underline">View all</Link>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="glass bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">{booking.pitch?.name}</h3>
                        <div className="flex items-center text-xs text-slate-400 space-x-3">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {booking.start_time.slice(0, 5)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {booking.status}
                      </div>
                      <Link to={`/pitch/${booking.pitch_id}`} className="text-slate-400 hover:text-white">
                        <MapPin className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 glass bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-slate-500 mb-4">No upcoming bookings found.</p>
                <Link to="/discover" className="text-emerald-400 text-sm font-bold hover:underline">Find a pitch near you</Link>
              </div>
            )}
          </div>

          {/* Match Requests */}
          <div className="glass p-6 rounded-2xl neon-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                <span>My Match Challenges</span>
              </h2>
              <Link to="/find-opponent" className="text-xs text-cyan-400 hover:underline">Find matches</Link>
            </div>

            {matchRequests.length > 0 ? (
              <div className="space-y-4">
                {matchRequests.map((match) => (
                  <div key={match.id} className="glass bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">{match.team?.name} vs Opponent</h3>
                        <div className="flex items-center text-xs text-slate-400 space-x-3">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(match.match_date), 'MMM d, yyyy')}</span>
                          <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {match.pitch?.name || 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      match.status === 'matched' ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {match.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 glass bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-slate-500 mb-4">No active match requests.</p>
                <Link to="/find-opponent" className="text-cyan-400 text-sm font-bold hover:underline">Challenge a team</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Suggested Pitches */}
        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl neon-border">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>Suggested Pitches</span>
            </h2>
            <div className="space-y-4">
              {nearbyPitches.map(pitch => (
                <PitchCard key={pitch.id} pitch={pitch} compact />
              ))}
            </div>
            <Link to="/discover" className="btn-secondary w-full mt-6 text-center text-sm">
              Explore More
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="glass p-6 rounded-2xl neon-border">
            <h2 className="text-xl font-bold mb-6">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass bg-white/5 p-4 rounded-xl text-center">
                <span className="text-2xl font-bold text-emerald-400">{bookings.length}</span>
                <span className="text-[10px] text-slate-500 block uppercase tracking-widest">Games Played</span>
              </div>
              <div className="glass bg-white/5 p-4 rounded-xl text-center">
                <span className="text-2xl font-bold text-cyan-400">{matchRequests.length}</span>
                <span className="text-[10px] text-slate-500 block uppercase tracking-widest">Challenges</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
