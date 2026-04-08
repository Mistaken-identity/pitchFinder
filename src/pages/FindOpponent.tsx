
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MatchRequest, Team, Pitch } from '../types';
import { Trophy, Users, Calendar, MapPin, Clock, Plus, Loader2, ShieldCheck, MessageCircle, Phone, Share2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const FindOpponent: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('request_id');

  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastPostedMatch, setLastPostedMatch] = useState<MatchRequest | null>(null);
  const [focusedMatch, setFocusedMatch] = useState<MatchRequest | null>(null);

  // New Match Request Form
  const [newMatch, setNewMatch] = useState({
    team_id: '',
    pitch_id: '',
    opponent_team_id: '',
    match_date: format(new Date(), 'yyyy-MM-dd'),
    match_time: '18:00',
    skill_level_required: 'intermediate',
    bet_amount: 0,
    description: ''
  });

  // New Team Form
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    skill_level: 'intermediate',
    location: '',
    captain_phone: '',
    assistant_phone: ''
  });

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [showWelcomeNote, setShowWelcomeNote] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch open match requests
      const { data: matchesData } = await supabase
        .from('match_requests')
        .select('*, team:teams!team_id(*), pitch:pitches(*)')
        .eq('status', 'open')
        .order('match_date', { ascending: true });
      
      const matches = matchesData || [];
      setMatchRequests(matches);

      // If there's a request_id in URL, focus on it
      if (requestId) {
        const focused = matches.find(m => m.id === requestId);
        if (focused) {
          setFocusedMatch(focused);
        } else {
          // Try fetching it specifically if not in open list (might be matched already or just not in top 20)
          const { data: specificMatch } = await supabase
            .from('match_requests')
            .select('*, team:teams!team_id(*), pitch:pitches(*)')
            .eq('id', requestId)
            .single();
          
          if (specificMatch) {
            setFocusedMatch(specificMatch);
          }
        }
      }

      // Fetch all teams
      const { data: allTeamsData } = await supabase
        .from('teams')
        .select('*')
        .limit(20);
      
      setAllTeams(allTeamsData || []);

      // Fetch user's teams
      if (user) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .eq('captain_id', user.id);
        
        setMyTeams(teamsData || []);
        if (teamsData && teamsData.length > 0) {
          setNewMatch(prev => ({ ...prev, team_id: teamsData[0].id }));
        }
      }

      // Fetch pitches for selection
      const { data: pitchesData } = await supabase
        .from('pitches')
        .select('id, name');
      
      setPitches(pitchesData || []);
    } catch (error) {
      console.error('Error fetching matchmaking data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (myTeams.length > 0 && !newMatch.team_id) {
      setNewMatch(prev => ({ ...prev, team_id: myTeams[0].id }));
    }
  }, [myTeams, newMatch.team_id]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (isEditingTeam && editingTeamId) {
        const { error } = await supabase
          .from('teams')
          .update(newTeam)
          .eq('id', editingTeamId);
        
        if (error) throw error;
        toast.success('Team updated successfully!');
      } else {
        const { error } = await supabase
          .from('teams')
          .insert({
            ...newTeam,
            captain_id: user.id
          });

        if (error) throw error;
        setShowWelcomeNote(true);
      }

      setIsCreatingTeam(false);
      setIsEditingTeam(false);
      setEditingTeamId(null);
      setNewTeam({
        name: '',
        description: '',
        skill_level: 'intermediate',
        location: '',
        captain_phone: '',
        assistant_phone: ''
      });
      await fetchData();
      
      // If there was a pending match, accept it now
      if (pendingMatchId && !isEditingTeam) {
        handleAcceptChallenge(pendingMatchId);
        setPendingMatchId(null);
      }
    } catch (error: any) {
      toast.error(error.message || `Error ${isEditingTeam ? 'updating' : 'creating'} team`);
    }
  };

  const handlePostMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newMatch.team_id) {
      toast.error('Please select one of your teams first');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('match_requests')
        .insert({
          ...newMatch,
          team_id: newMatch.team_id,
          pitch_id: newMatch.pitch_id || null,
          opponent_team_id: newMatch.opponent_team_id || null,
          status: 'open'
        })
        .select('*, team:teams!team_id(*), pitch:pitches(*)')
        .single();

      if (error) throw error;

      setLastPostedMatch(data);
      setIsPosting(false);
      setShowShareModal(true);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error posting match');
    }
  };

  const shareToWhatsApp = (match: MatchRequest) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?request_id=${match.id}`;
    const teamName = match.team?.name || 'Our Team';
    const date = format(new Date(match.match_date), 'MMM d');
    const time = match.match_time.slice(0, 5);
    const pitch = match.pitch?.name || 'Location TBD';
    
    const opponentTeam = allTeams.find(t => t.id === match.opponent_team_id);
    let message = "";
    
    if (opponentTeam) {
      message = `⚽ *MATCH CHALLENGE!* ⚽\n\n*${teamName}* has challenged *${opponentTeam.name}* to a match!\n\n📅 *Date:* ${date}\n🕒 *Time:* ${time}\n📍 *Pitch:* ${pitch}\n\nClick the link below to view the request and accept the challenge:\n${shareUrl}`;
    } else {
      message = `⚽ *MATCH CHALLENGE!* ⚽\n\n*${teamName}* is looking for an opponent!\n\n📅 *Date:* ${date}\n🕒 *Time:* ${time}\n📍 *Pitch:* ${pitch}\n\nClick the link below to accept the challenge and book the match:\n${shareUrl}`;
    }
    
    const phone = opponentTeam?.captain_phone || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAcceptChallenge = async (matchId: string) => {
    if (!user) {
      toast.error('Please login to accept challenges');
      navigate('/login');
      return;
    }

    if (myTeams.length === 0) {
      toast.error('You need to create a team first!');
      setPendingMatchId(matchId);
      setIsCreatingTeam(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('match_requests')
        .update({
          status: 'matched',
          opponent_team_id: myTeams[0].id
        })
        .eq('id', matchId);

      if (error) throw error;

      // Create notification for the team that posted the request
      const match = matchRequests.find(m => m.id === matchId);
      if (match && match.team) {
        await supabase.from('notifications').insert({
          user_id: match.team.captain_id,
          title: 'Match Confirmed!',
          message: `Your match request for ${format(new Date(match.match_date), 'MMM d')} has been accepted by ${myTeams[0].name}.`,
          type: 'match_confirmed',
          link: '/dashboard'
        });
      }

      toast.success('Challenge accepted! Get ready for the match.');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error accepting challenge');
    }
  };

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
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Find an <span className="neon-text italic">Opponent</span></h1>
          <p className="text-slate-400">Challenge teams, host matches, and climb the ranks.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={() => {
              if (!user) {
                toast.error('Please login to create a team');
                navigate('/login');
                return;
              }
              setIsCreatingTeam(true);
            }}
            className="btn-secondary flex items-center justify-center space-x-2 px-6 py-3"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Create Team</span>
          </button>
          <button 
            onClick={() => {
              if (!user) {
                toast.error('Please login to post a match');
                navigate('/login');
                return;
              }
              setIsPosting(true);
            }}
            className="btn-primary flex items-center justify-center space-x-2 px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            <span>Post Match</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Match Requests List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <span>Open Challenges</span>
          </h2>

          {matchRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matchRequests.map((match) => (
                <div key={match.id} className="glass p-6 rounded-2xl neon-border flex flex-col h-full">
                  {match.opponent_team_id && (
                    <div className="mb-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Targeted Challenge
                    </div>
                  )}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                      {match.team?.logo_url ? (
                        <img src={match.team.logo_url} alt={match.team.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{match.team?.name}</h3>
                      <div className="flex items-center text-xs text-slate-500">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                          {match.team?.skill_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 flex-grow">
                    <div className="flex items-center text-sm text-slate-400">
                      <Calendar className="w-4 h-4 mr-3 text-emerald-500" />
                      <span>{format(new Date(match.match_date), 'EEEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                      <Clock className="w-4 h-4 mr-3 text-emerald-500" />
                      <span>{match.match_time.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                      <MapPin className="w-4 h-4 mr-3 text-emerald-500" />
                      <span>{match.pitch?.name || 'Location TBD'}</span>
                    </div>
                    {match.bet_amount > 0 && (
                      <div className="flex items-center text-sm text-yellow-400 font-bold">
                        <Trophy className="w-4 h-4 mr-3" />
                        <span>Bet: KSH {match.bet_amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <button 
                      onClick={() => handleAcceptChallenge(match.id)}
                      className="btn-primary py-2 px-6 text-sm flex-grow mr-2"
                    >
                      Accept Challenge
                    </button>
                    <button className="glass p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">No open challenges at the moment.</p>
              <button 
                onClick={() => {
                  if (!user) {
                    toast.error('Please login to post a match');
                    navigate('/login');
                    return;
                  }
                  setIsPosting(true);
                }} 
                className="text-emerald-400 font-bold mt-2 hover:underline"
              >
                Be the first to post a match!
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: My Teams & Info */}
        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl neon-border">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>My Teams</span>
            </h2>
            {myTeams.length > 0 ? (
              <div className="space-y-4">
                {myTeams.map(team => (
                  <div key={team.id} className="glass bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10">
                        <Users className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{team.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{team.skill_level}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setNewTeam({
                          name: team.name,
                          description: team.description || '',
                          skill_level: team.skill_level,
                          location: team.location || '',
                          captain_phone: team.captain_phone,
                          assistant_phone: team.assistant_phone
                        });
                        setEditingTeamId(team.id);
                        setIsEditingTeam(true);
                        setIsCreatingTeam(true);
                      }}
                      className="p-2 glass bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-emerald-400"
                    >
                      <Plus className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-4">You haven't created a team yet.</p>
                <button 
                  onClick={() => {
                    if (!user) {
                      toast.error('Please login to create a team');
                      navigate('/login');
                      return;
                    }
                    setIsCreatingTeam(true);
                  }} 
                  className="btn-secondary w-full text-xs"
                >
                  Create Your First Team
                </button>
              </div>
            )}
          </div>

          <div className="glass p-6 rounded-2xl neon-border">
            <h2 className="text-xl font-bold mb-4">How it works</h2>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</div>
                <span>Create a team and set your skill level.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</div>
                <span>Post a match request with your preferred date and location.</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</div>
                <span>Wait for an opponent to accept or browse open challenges.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Post Match Modal */}
      {isPosting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => {
            setIsPosting(false);
            setNewMatch(prev => ({ ...prev, opponent_team_id: '', description: '' }));
          }}></div>
          <div className="relative w-full max-w-lg glass p-8 rounded-2xl neon-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Post Match Request</h2>
              <button onClick={() => {
                setIsPosting(false);
                setNewMatch(prev => ({ ...prev, opponent_team_id: '', description: '' }));
              }} className="p-2 glass rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {newMatch.opponent_team_id && (
              <div className="mb-6 p-4 glass bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold">Challenging: <span className="text-emerald-400">{allTeams.find(t => t.id === newMatch.opponent_team_id)?.name}</span></span>
                </div>
                <button 
                  onClick={() => setNewMatch(prev => ({ ...prev, opponent_team_id: '', description: '' }))}
                  className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {myTeams.length > 0 ? (
              <form onSubmit={handlePostMatch} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Team</label>
                  <select 
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    value={newMatch.team_id}
                    onChange={(e) => setNewMatch({...newMatch, team_id: e.target.value})}
                  >
                    {myTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Match Date</label>
                    <input 
                      type="date" 
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                      value={newMatch.match_date}
                      onChange={(e) => setNewMatch({...newMatch, match_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Match Time</label>
                    <input 
                      type="time" 
                      required
                      className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                      value={newMatch.match_time}
                      onChange={(e) => setNewMatch({...newMatch, match_time: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Pitch (Optional)</label>
                  <select 
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    value={newMatch.pitch_id}
                    onChange={(e) => setNewMatch({...newMatch, pitch_id: e.target.value})}
                  >
                    <option value="">Any Location / TBD</option>
                    {pitches.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bet Amount (KSH) - Optional</label>
                  <input 
                    type="number" 
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. 500"
                    value={newMatch.bet_amount}
                    onChange={(e) => setNewMatch({...newMatch, bet_amount: Number(e.target.value)})}
                  />
                  <p className="text-[10px] text-slate-500 mt-1 italic">Place a bet to make the match more interesting.</p>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={() => setIsPosting(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Post Request</button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 mb-6">You need a team to post a match request.</p>
                <button 
                  onClick={() => {
                    setIsPosting(false);
                    setIsCreatingTeam(true);
                  }}
                  className="btn-primary"
                >
                  Create a Team Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Team Modal */}
      {isCreatingTeam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => {
            setIsCreatingTeam(false);
            setIsEditingTeam(false);
            setEditingTeamId(null);
            setNewTeam({
              name: '',
              description: '',
              skill_level: 'intermediate',
              location: '',
              captain_phone: '',
              assistant_phone: ''
            });
          }}></div>
          <div className="relative w-full max-w-lg glass p-8 rounded-2xl neon-border">
            <h2 className="text-2xl font-bold mb-6">{isEditingTeam ? 'Edit Team Profile' : 'Create Your Team'}</h2>
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. Nairobi Stars"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Skill Level</label>
                <select 
                  className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                  value={newTeam.skill_level}
                  onChange={(e) => setNewTeam({...newTeam, skill_level: e.target.value as any})}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Base Location</label>
                <input 
                  type="text" 
                  required
                  className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. Westlands, Nairobi"
                  value={newTeam.location}
                  onChange={(e) => setNewTeam({...newTeam, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Captain's Phone (WhatsApp)</label>
                <input 
                  type="tel" 
                  required
                  className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                  placeholder="254700000000"
                  value={newTeam.captain_phone}
                  onChange={(e) => setNewTeam({...newTeam, captain_phone: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Assistant Phone</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    placeholder="254700000000"
                    value={newTeam.assistant_phone}
                    onChange={(e) => setNewTeam({...newTeam, assistant_phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setIsCreatingTeam(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Teams Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 flex items-center space-x-2">
          <Users className="w-6 h-6 text-emerald-400" />
          <span>Registered Teams</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allTeams.map((team) => (
            <div key={team.id} className="glass p-6 rounded-2xl neon-border text-center group hover:bg-white/5 transition-all">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-white/10">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Users className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <h3 className="font-bold mb-1">{team.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{team.location}</p>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                  {team.skill_level}
                </span>
              </div>
              <div className="flex flex-col space-y-2 mb-6">
                <div className="flex items-center justify-center text-[10px] text-slate-400">
                  <Phone className="w-3 h-3 mr-1 text-emerald-500" />
                  <span>Capt: {team.captain_phone}</span>
                </div>
                <div className="flex items-center justify-center text-[10px] text-slate-400">
                  <Phone className="w-3 h-3 mr-1 text-cyan-500" />
                  <span>Asst: {team.assistant_phone}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <a 
                  href={`https://wa.me/${team.captain_phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-secondary py-2 text-[10px] flex items-center justify-center space-x-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
                <button 
                  onClick={() => {
                    if (!user) {
                      toast.error('Please login to challenge this team');
                      navigate('/login');
                      return;
                    }
                    setNewMatch(prev => ({ ...prev, description: `Challenging ${team.name}!`, opponent_team_id: team.id }));
                    setIsPosting(true);
                  }}
                  className="flex-1 btn-primary py-2 text-[10px]"
                >
                  Challenge
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share to WhatsApp Modal */}
      {showShareModal && lastPostedMatch && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowShareModal(false)}></div>
          <div className="relative w-full max-w-md glass p-10 rounded-3xl neon-border text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6">
              <Share2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-4 neon-text">Share Challenge!</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Your match request is live! Share it on WhatsApp to find an opponent faster.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => shareToWhatsApp(lastPostedMatch)}
                className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center space-x-3"
              >
                <MessageCircle className="w-6 h-6" />
                <span>Send to WhatsApp</span>
              </button>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focused Match Modal (from Link) */}
      {focusedMatch && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setFocusedMatch(null)}></div>
          <div className="relative w-full max-w-lg glass p-8 rounded-3xl neon-border">
            <button 
              onClick={() => setFocusedMatch(null)}
              className="absolute top-4 right-4 p-2 glass rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-white/10 overflow-hidden">
                {focusedMatch.team?.logo_url ? (
                  <img src={focusedMatch.team.logo_url} alt={focusedMatch.team.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold">{focusedMatch.team?.name}</h2>
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mt-1">
                {focusedMatch.team?.skill_level} Level
              </p>
            </div>

            <div className="glass bg-white/5 p-6 rounded-2xl mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Match Date</span>
                <span className="font-bold">{format(new Date(focusedMatch.match_date), 'EEEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Kickoff Time</span>
                <span className="font-bold">{focusedMatch.match_time.slice(0, 5)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Location</span>
                <span className="font-bold">{focusedMatch.pitch?.name || 'Location TBD'}</span>
              </div>
              {focusedMatch.bet_amount > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-yellow-500 text-xs uppercase tracking-widest font-bold">Match Stake</span>
                  <span className="font-bold text-yellow-400 text-lg">KSH {focusedMatch.bet_amount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {focusedMatch.status === 'open' ? (
              <button 
                onClick={() => {
                  handleAcceptChallenge(focusedMatch.id);
                  setFocusedMatch(null);
                }}
                className="btn-primary w-full py-4 text-lg font-bold"
              >
                Accept Challenge
              </button>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-center">
                <p className="text-yellow-500 font-bold">This match has already been matched!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome Note Modal */}
      {showWelcomeNote && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowWelcomeNote(false)}></div>
          <div className="relative w-full max-w-lg glass p-10 rounded-3xl neon-border overflow-hidden">
            {/* Decorative Background Element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-white/10 rotate-3 group-hover:rotate-0 transition-transform">
                <Trophy className="w-10 h-10" />
              </div>
              
              <h2 className="text-3xl font-black mb-4 tracking-tight">
                TEAM <span className="neon-text italic">REGISTERED!</span>
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="glass bg-white/5 p-4 rounded-xl border border-white/5 relative">
                  <span className="absolute -top-3 left-4 px-2 bg-slate-900 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Captain's Briefing</span>
                  <p className="text-slate-300 leading-relaxed italic text-sm">
                    "Congrats on forming your squad! Remember: in this league, 'VAR' stands for 'Very Angry Referee' and 'Clean Sheet' is something you'll only see in your laundry. Try not to trip over the ball—it's the round thing that doesn't like being kicked into the parking lot."
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass bg-white/5 p-3 rounded-xl border border-white/5 text-left">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pro Tip #1</p>
                    <p className="text-xs text-slate-400">Blaming the pitch is a valid strategy for missing sitters.</p>
                  </div>
                  <div className="glass bg-white/5 p-3 rounded-xl border border-white/5 text-left">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pro Tip #2</p>
                    <p className="text-xs text-slate-400">Hydration means water, not just post-match sodas.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowWelcomeNote(false);
                  if (pendingMatchId) {
                    handleAcceptChallenge(pendingMatchId);
                    setPendingMatchId(null);
                  }
                  navigate('/dashboard');
                }}
                className="btn-primary w-full py-4 text-lg font-bold mb-6 shadow-lg shadow-emerald-500/20"
              >
                Enter the Arena
              </button>

              <div className="pt-6 border-t border-white/5 flex items-center justify-center space-x-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Crafted by</span>
                <div className="px-2 py-1 glass bg-white/5 rounded border border-white/10">
                  <span className="text-[10px] font-black text-emerald-400 italic">TONY TEFLON</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindOpponent;
