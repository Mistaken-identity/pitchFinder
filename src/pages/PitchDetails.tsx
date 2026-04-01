
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Pitch, Review, Booking } from '../types';
import { MapPin, Star, Clock, Phone, MessageCircle, Calendar, Users, Loader2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const PitchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(1);
  const [teamName, setTeamName] = useState('');

  const fetchPitchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPitch(data);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*, user:profiles(*)')
        .eq('pitch_id', id)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
    } catch (error: any) {
      toast.error('Error loading pitch details');
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPitchDetails();
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to book a pitch');
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const totalPrice = (pitch?.price_per_hour || 0) * duration;
      
      // Calculate end time
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = hours + duration;
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('bookings')
        .insert({
          pitch_id: id,
          user_id: user.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          team_name: teamName,
          total_price: totalPrice,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Booking request sent! The owner will confirm shortly.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error creating booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!pitch) return null;

  const images = pitch.images && pitch.images.length > 0 
    ? pitch.images.map(img => img.image_url)
    : ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images & Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="relative h-[400px] rounded-2xl overflow-hidden glass neon-border">
            <img 
              src={images[activeImage]} 
              alt={pitch.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 glass p-2 rounded-full hover:bg-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 glass p-2 rounded-full hover:bg-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {images.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${activeImage === i ? 'bg-emerald-500 w-6' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>

          {/* Pitch Info */}
          <div className="glass p-8 rounded-2xl neon-border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{pitch.name}</h1>
                <div className="flex items-center text-slate-400">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                  <span>{pitch.location_name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-yellow-400 mb-1">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="ml-1 text-xl font-bold">{pitch.rating || 'New'}</span>
                </div>
                <span className="text-slate-500 text-sm">{pitch.review_count} reviews</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass p-4 rounded-xl text-center">
                <Clock className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                <span className="text-xs text-slate-500 block">Opening Hours</span>
                <span className="text-sm font-bold">6 AM - 11 PM</span>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <Users className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
                <span className="text-xs text-slate-500 block">Pitch Type</span>
                <span className="text-sm font-bold">Astroturf</span>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <ShieldCheck className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                <span className="text-xs text-slate-500 block">Security</span>
                <span className="text-sm font-bold">CCTV & Guards</span>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <MessageCircle className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                <span className="text-xs text-slate-500 block">Facilities</span>
                <span className="text-sm font-bold">Changing Rooms</span>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Description</h3>
            <p className="text-slate-400 leading-relaxed mb-8">
              {pitch.description || "No description provided for this pitch. It's one of the best facilities in the area with high-quality turf and great lighting for night matches."}
            </p>

            <div className="flex flex-wrap gap-4">
              {pitch.whatsapp_number && (
                <a 
                  href={`https://wa.me/${pitch.whatsapp_number}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp Owner</span>
                </a>
              )}
              {pitch.contact_phone && (
                <a 
                  href={`tel:${pitch.contact_phone}`}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Owner</span>
                </a>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="glass p-8 rounded-2xl neon-border">
            <h3 className="text-xl font-bold mb-6">Reviews & Ratings</h3>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-white/5 pb-6 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                          {review.user?.avatar_url ? (
                            <img src={review.user.avatar_url} alt={review.user.full_name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{review.user?.full_name || 'Anonymous Player'}</p>
                          <p className="text-xs text-slate-500">{format(new Date(review.created_at), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No reviews yet. Be the first to play here!</p>
            )}
          </div>
        </div>

        {/* Right Column: Booking Form */}
        <div className="lg:col-span-1">
          <div className="glass p-8 rounded-2xl neon-border sticky top-24">
            <h3 className="text-2xl font-bold mb-6">Book Pitch</h3>
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
              <span className="text-slate-400">Price per hour</span>
              <span className="text-2xl font-bold text-emerald-400">KSH {pitch.price_per_hour}</span>
            </div>

            <form onSubmit={handleBooking} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="date" 
                    required
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration (Hrs)</label>
                  <select 
                    className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4].map(h => (
                      <option key={h} value={h}>{h} Hour{h > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Team Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Estate FC"
                  className="w-full glass bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500/50"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <div className="flex justify-between mb-4 text-sm">
                  <span className="text-slate-400">Total Price</span>
                  <span className="font-bold">KSH {pitch.price_per_hour * duration}</span>
                </div>
                <button 
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full btn-primary py-4 flex items-center justify-center space-x-2"
                >
                  {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Booking</span>}
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-4 uppercase tracking-widest">
                  Secure payment at the facility
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchDetails;
