
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types';
import { Trophy, Calendar, MapPin, DollarSign, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        setTournaments(data || []);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Upcoming <span className="neon-text">Tournaments</span></h1>
          <p className="text-slate-400">Join the biggest football events in Kenya and win big.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search tournaments..."
            className="w-full glass bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTournaments.map((tournament) => (
            <div key={tournament.id} className="glass rounded-2xl overflow-hidden neon-border group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={tournament.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800'} 
                  alt={tournament.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 glass bg-emerald-500/80 px-3 py-1 rounded-full text-xs font-bold">
                  {tournament.prize_pool ? `Prize: ${tournament.prize_pool}` : 'Glory Awaits'}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">{tournament.title}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-slate-400">
                    <Calendar className="w-4 h-4 mr-3 text-emerald-500" />
                    <span>{format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <MapPin className="w-4 h-4 mr-3 text-emerald-500" />
                    <span>{tournament.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <DollarSign className="w-4 h-4 mr-3 text-emerald-500" />
                    <span>Entry Fee: KSH {tournament.entry_fee.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  {tournament.description}
                </p>
                <button className="btn-primary w-full">Register Team</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass bg-white/5 rounded-3xl border border-dashed border-white/10">
          <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">No tournaments found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
