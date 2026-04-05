
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types';
import { Trophy, Calendar, MapPin, DollarSign, Loader2, Search, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Tournaments: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [newTournament, setNewTournament] = useState({
    title: '',
    description: '',
    location: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    prize_pool: '',
    entry_fee: 0,
    image_url: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tournaments')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('tournaments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

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

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to create a tournament');
      return;
    }

    try {
      setIsSubmitting(true);
      
      let imageUrl = newTournament.image_url;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const { error } = await supabase
        .from('tournaments')
        .insert({
          ...newTournament,
          image_url: imageUrl,
          owner_id: user.id
        });

      if (error) throw error;

      toast.success('Tournament created successfully!');
      setIsCreating(false);
      setSelectedFile(null);
      setImagePreview(null);
      fetchTournaments();
    } catch (error: any) {
      toast.error(error.message || 'Error creating tournament');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Upcoming <span className="neon-text italic">Tournaments</span></h1>
          <p className="text-slate-400">Join the biggest football events in Kenya and win big.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search tournaments..."
              className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center justify-center space-x-2 w-full md:w-auto px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredTournaments.map((tournament) => (
            <div key={tournament.id} className="glass rounded-2xl overflow-hidden neon-border group flex flex-col">
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img 
                  src={tournament.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800'} 
                  alt={tournament.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 glass bg-emerald-500/80 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                  {tournament.prize_pool ? `Prize: ${tournament.prize_pool}` : 'Glory Awaits'}
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-xl font-bold mb-4 line-clamp-1">{tournament.title}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-slate-400">
                    <Calendar className="w-4 h-4 mr-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <MapPin className="w-4 h-4 mr-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{tournament.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <DollarSign className="w-4 h-4 mr-3 text-emerald-500 shrink-0" />
                    <span>Entry Fee: KSH {tournament.entry_fee.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  {tournament.description}
                </p>
                <div className="mt-auto">
                  <button className="btn-primary w-full py-3">Register Team</button>
                </div>
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

      {/* Create Tournament Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsCreating(false)}></div>
          <div className="relative w-full max-w-2xl glass p-6 sm:p-8 rounded-2xl neon-border my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Tournament</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTournament} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="e.g. Nairobi Summer Cup"
                  value={newTournament.title}
                  onChange={(e) => setNewTournament({...newTournament, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="Tell teams about the tournament..."
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <input 
                    type="text" 
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="e.g. Camp Toyoyo"
                    value={newTournament.location}
                    onChange={(e) => setNewTournament({...newTournament, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Poster</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      id="tournament-image"
                      onChange={handleFileChange}
                    />
                    <label 
                      htmlFor="tournament-image"
                      className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      {selectedFile ? (
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm truncate max-w-[150px]">{selectedFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-500">Upload Poster</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                    value={newTournament.start_date}
                    onChange={(e) => setNewTournament({...newTournament, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                    value={newTournament.end_date}
                    onChange={(e) => setNewTournament({...newTournament, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Prize Pool</label>
                  <input 
                    type="text" 
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="e.g. KSH 50,000"
                    value={newTournament.prize_pool}
                    onChange={(e) => setNewTournament({...newTournament, prize_pool: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Entry Fee (KSH)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                    value={newTournament.entry_fee}
                    onChange={(e) => setNewTournament({...newTournament, entry_fee: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 btn-secondary py-3">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span className="font-bold">Create Tournament</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
