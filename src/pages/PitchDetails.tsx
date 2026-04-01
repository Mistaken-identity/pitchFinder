
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Pitch, Review, Booking } from '../types';
import { MapPin, Star, Clock, Phone, MessageCircle, Calendar, Users, Loader2, ChevronLeft, ChevronRight, ShieldCheck, Heart, Share2, DollarSign, CheckCircle, XCircle } from 'lucide-react';
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [showConfirmation, setShowConfirmation] = useState(false);

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

      if (user) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('pitch_id', id)
          .single();
        setIsFavorite(!!favData);
      }

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
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please login to favorite pitches');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('pitch_id', id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, pitch_id: id });
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const sharePitch = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: pitch?.name,
        text: `Check out this pitch on PitchFinder KE: ${pitch?.name}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to book a pitch');
      navigate('/login');
      return;
    }

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
      toast.success('Payment received! Booking confirmed.');
      
      try {
        setBookingLoading(true);
        const totalPrice = (pitch?.price_per_hour || 0) * duration;
        
        // Calculate end time
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = hours + duration;
        const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const { data: booking, error } = await supabase
          .from('bookings')
          .insert({
            pitch_id: id,
            user_id: user!.id,
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime,
            team_name: teamName,
            total_price: totalPrice,
            status: 'confirmed'
          })
          .select()
          .single();

        if (error) throw error;

        // Record payment
        await supabase.from('payments').insert({
          user_id: user!.id,
          amount: totalPrice,
          phone_number: paymentPhone,
          status: 'completed',
          type: 'booking_deposit',
          reference_id: booking.id
        });

        // Notify owner
        await supabase.from('notifications').insert({
          user_id: pitch!.owner_id,
          title: 'New Booking Confirmed!',
          message: `A new booking for ${pitch!.name} on ${format(new Date(bookingDate), 'MMM d')} has been paid and confirmed.`,
          type: 'booking',
          link: '/owner-dashboard'
        });

        setShowConfirmation(true);
        setIsPaying(false);
        setPaymentStatus('idle');
      } catch (error: any) {
        toast.error(error.message || 'Error creating booking');
        setPaymentStatus('failed');
      } finally {
        setBookingLoading(false);
      }
    }, 3000);
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
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{pitch.name}</h1>
                <div className="flex items-center text-slate-400">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                  <span>{pitch.location_name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 self-end md:self-start">
                <button 
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`p-3 rounded-xl glass backdrop-blur-md transition-all flex items-center space-x-2 ${
                    isFavorite ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span className="text-sm font-bold">{isFavorite ? 'Favorited' : 'Favorite'}</span>
                </button>
                <button 
                  onClick={sharePitch}
                  className="p-3 rounded-xl glass bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Share</span>
                </button>
                <div className="text-right ml-4">
                  <div className="flex items-center text-yellow-400 mb-1">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="ml-1 text-xl font-bold">{pitch.rating || 'New'}</span>
                  </div>
                  <span className="text-slate-500 text-sm">{pitch.review_count} reviews</span>
                </div>
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
                  Secure M-Pesa Payment Required
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* M-Pesa Payment Modal */}
      {isPaying && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => !bookingLoading && setIsPaying(false)}></div>
          <div className="relative w-full max-w-md glass p-8 rounded-2xl neon-border text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Confirm Booking Payment</h2>
            <p className="text-slate-400 mb-6">Total amount to pay: <span className="text-emerald-400 font-bold text-lg">KSH {(pitch.price_per_hour * duration).toLocaleString()}</span></p>
            
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
                  Cancel Booking
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

      {/* Attendance Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"></div>
          <div className="relative w-full max-w-lg glass p-10 rounded-3xl neon-border text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-8">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Booking Confirmed!</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Your booking for <span className="text-white font-bold">{pitch.name}</span> on <span className="text-white font-bold">{format(new Date(bookingDate), 'MMMM d')}</span> is now active.
            </p>
            
            <div className="glass bg-white/5 p-6 rounded-2xl mb-8 text-left border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Anti-Scam Protocol</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                To ensure a safe experience, both you and the pitch owner must be present at the facility to finalize the match. Please show your digital receipt to the owner upon arrival.
              </p>
            </div>

            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full py-4 text-lg font-bold"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchDetails;
