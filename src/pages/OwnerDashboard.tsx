
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Pitch, Booking } from '../types';
import { Plus, Edit, Trash2, Calendar, Clock, User, MapPin, Loader2, DollarSign, BarChart3, Image as ImageIcon, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '300px'
};

const defaultCenter = {
  lat: -1.286389,
  lng: 36.817223
};

const OwnerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPitch, setIsAddingPitch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  // New Pitch Form State
  const [newPitch, setNewPitch] = useState({
    name: '',
    location_name: '',
    latitude: -1.286389,
    longitude: 36.817223,
    price_per_hour: 3000,
    description: '',
    contact_phone: '',
    whatsapp_number: '',
    image_url: ''
  });

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch owner's pitches
      const { data: pitchesData } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*)')
        .eq('owner_id', user.id);
      
      setPitches(pitchesData || []);

      if (pitchesData && pitchesData.length > 0) {
        const pitchIds = pitchesData.map(p => p.id);
        // Fetch bookings for these pitches
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*, pitch:pitches(*), user:profiles(*)')
          .in('pitch_id', pitchIds)
          .order('created_at', { ascending: false });
        
        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && profile.role !== 'owner') {
      toast.error('Access denied. Only pitch owners can view this dashboard.');
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, profile]);

  const handleAddPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Trigger payment first
    setIsPaying(true);
    setPaymentPhone(profile?.phone || '');
  };

  const processPayment = async () => {
    if (!paymentPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    setPaymentStatus('pending');
    
    // Simulate M-Pesa STK Push
    setTimeout(async () => {
      setPaymentStatus('success');
      toast.success('Payment received! Finalizing your listing...');
      
      try {
        setIsSubmitting(true);
        const { image_url, ...pitchData } = newPitch;
        
        const { data: pitch, error: pitchError } = await supabase
          .from('pitches')
          .insert({
            ...pitchData,
            owner_id: user!.id
          })
          .select()
          .single();

        if (pitchError) throw pitchError;

        if (image_url) {
          await supabase.from('pitch_images').insert({
            pitch_id: pitch.id,
            image_url: image_url,
            is_primary: true
          });
        }

        // Record payment
        await supabase.from('payments').insert({
          user_id: user!.id,
          amount: 1000,
          phone_number: paymentPhone,
          status: 'completed',
          type: 'pitch_listing',
          reference_id: pitch.id
        });

        toast.success('Pitch added successfully!');
        setIsAddingPitch(false);
        setIsPaying(false);
        setPaymentStatus('idle');
        setNewPitch({
          name: '',
          location_name: '',
          latitude: -1.286389,
          longitude: 36.817223,
          price_per_hour: 3000,
          description: '',
          contact_phone: '',
          whatsapp_number: '',
          image_url: ''
        });
        fetchData();
      } catch (error: any) {
        toast.error(error.message || 'Error adding pitch');
        setPaymentStatus('failed');
      } finally {
        setIsSubmitting(false);
      }
    }, 3000);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setNewPitch({
        ...newPitch,
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng()
      });
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking ${status}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error updating booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const totalEarnings = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Owner <span className="neon-text">Dashboard</span></h1>
          <p className="text-slate-400">Manage your facilities and bookings here.</p>
        </div>
        <button 
          onClick={() => setIsAddingPitch(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Pitch</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass p-6 rounded-2xl neon-border flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Total Earnings</p>
            <p className="text-2xl font-bold">KSH {totalEarnings.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl neon-border flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Total Bookings</p>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl neon-border flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Active Pitches</p>
            <p className="text-2xl font-bold">{pitches.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Pitches */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>My Facilities</span>
          </h2>
          {pitches.length > 0 ? (
            pitches.map(pitch => (
              <div key={pitch.id} className="glass p-4 rounded-xl neon-border group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold">{pitch.name}</h3>
                    <p className="text-xs text-slate-500">{pitch.location_name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 glass hover:bg-white/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 glass hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400 font-bold">KSH {pitch.price_per_hour}/hr</span>
                  <Link to={`/pitch/${pitch.id}`} className="text-xs text-slate-500 hover:text-white underline">View Public Page</Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 glass bg-white/5 rounded-xl border border-dashed border-white/10">
              <p className="text-slate-500">No pitches listed yet.</p>
            </div>
          )}
        </div>

        {/* Booking Requests */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Recent Booking Requests</span>
          </h2>
          <div className="glass rounded-2xl overflow-hidden border border-white/10">
            <table className="w-full text-left">
              <thead className="glass bg-white/5 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Pitch / Team</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.length > 0 ? (
                  bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{booking.pitch?.name}</p>
                        <p className="text-xs text-slate-500">{booking.team_name || booking.user?.full_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{format(new Date(booking.booking_date), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-slate-500">{booking.start_time.slice(0, 5)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">KSH {booking.total_price}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 
                          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {booking.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              className="p-1.5 glass hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                              className="p-1.5 glass hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      No booking requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Pitch Modal */}
      {isAddingPitch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddingPitch(false)}></div>
          <div className="relative w-full max-w-4xl glass p-8 rounded-2xl neon-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6">Add New Pitch</h2>
            <form onSubmit={handleAddPitch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Form Fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Pitch Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. Camp Toyoyo"
                        value={newPitch.name}
                        onChange={(e) => setNewPitch({...newPitch, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Location Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. Jericho, Nairobi"
                        value={newPitch.location_name}
                        onChange={(e) => setNewPitch({...newPitch, location_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Price per Hour (KSH)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                        value={newPitch.price_per_hour}
                        onChange={(e) => setNewPitch({...newPitch, price_per_hour: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp Number</label>
                      <input 
                        type="tel" 
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                        placeholder="254700000000"
                        value={newPitch.whatsapp_number}
                        onChange={(e) => setNewPitch({...newPitch, whatsapp_number: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Main Image URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input 
                        type="url" 
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                        placeholder="https://images.unsplash.com/..."
                        value={newPitch.image_url}
                        onChange={(e) => setNewPitch({...newPitch, image_url: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea 
                      rows={3}
                      className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                      placeholder="Tell players about your facility..."
                      value={newPitch.description}
                      onChange={(e) => setNewPitch({...newPitch, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                {/* Right Side: Map Picker */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">Set Location on Map</label>
                  <div className="glass rounded-xl overflow-hidden border border-white/10 h-[300px]">
                    {isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={defaultCenter}
                        zoom={12}
                        onClick={handleMapClick}
                        options={{
                          styles: [
                            { elementType: 'geometry', stylers: [{ color: '#020617' }] },
                            { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
                          ],
                          disableDefaultUI: true,
                          zoomControl: true,
                        }}
                      >
                        <Marker 
                          position={{ lat: newPitch.latitude, lng: newPitch.longitude }} 
                          draggable={true}
                          onDragEnd={(e) => {
                            if (e.latLng) {
                              setNewPitch({
                                ...newPitch,
                                latitude: e.latLng.lat(),
                                longitude: e.latLng.lng()
                              });
                            }
                          }}
                        />
                      </GoogleMap>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center">
                      <span className="font-bold mr-1">Lat:</span> {newPitch.latitude.toFixed(6)}
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-1">Lng:</span> {newPitch.longitude.toFixed(6)}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Click on the map to set the exact location of your pitch.</p>
                </div>
              </div>

              <div className="flex space-x-4 pt-6 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsAddingPitch(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Pitch Listing</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* M-Pesa Payment Modal */}
      {isPaying && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => !isSubmitting && setIsPaying(false)}></div>
          <div className="relative w-full max-w-md glass p-8 rounded-2xl neon-border text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Listing Fee Required</h2>
            <p className="text-slate-400 mb-6">To list your pitch on PitchFinder KE, a one-time fee of <span className="text-emerald-400 font-bold text-lg">KSH 1,000</span> is required.</p>
            
            {paymentStatus === 'idle' ? (
              <div className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2 ml-1">M-Pesa Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    placeholder="254700000000"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                  />
                </div>
                <button 
                  onClick={processPayment}
                  className="btn-primary w-full py-4 font-bold"
                >
                  Pay with M-Pesa
                </button>
                <button 
                  onClick={() => setIsPaying(false)}
                  className="text-slate-500 text-sm hover:text-white transition-colors"
                >
                  Cancel Listing
                </button>
              </div>
            ) : paymentStatus === 'pending' ? (
              <div className="py-8 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
                <p className="text-emerald-400 font-medium animate-pulse">Waiting for M-Pesa confirmation...</p>
                <p className="text-xs text-slate-500">Please check your phone and enter your M-Pesa PIN.</p>
              </div>
            ) : paymentStatus === 'success' ? (
              <div className="py-8 space-y-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-emerald-400 font-bold">Payment Successful!</p>
              </div>
            ) : (
              <div className="py-8 space-y-4">
                <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                <p className="text-red-400 font-bold">Payment Failed</p>
                <button onClick={() => setPaymentStatus('idle')} className="btn-secondary w-full">Try Again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
