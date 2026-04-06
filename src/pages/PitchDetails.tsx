
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Pitch, Review, Booking, Profile } from '../types';
import { MapPin, Star, Clock, Phone, MessageCircle, Calendar, Users, Loader2, ChevronLeft, ChevronRight, ShieldCheck, Heart, Share2, DollarSign, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfToday } from 'date-fns';

const PitchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [pitch, setPitch] = useState<Pitch & { owner?: Profile } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [otherPitches, setOtherPitches] = useState<Pitch[]>([]);
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
  const [pitchBookings, setPitchBookings] = useState<Booking[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchPitchBookings = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('pitch_id', id)
        .eq('status', 'confirmed');
      
      if (error) throw error;
      setPitchBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchPitchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*), owner:profiles(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPitch(data);

      // Fetch other pitches by the same owner
      if (data.owner_id) {
        const { data: othersData } = await supabase
          .from('pitches')
          .select('*, images:pitch_images(*)')
          .eq('owner_id', data.owner_id)
          .neq('id', id)
          .limit(3);
        setOtherPitches(othersData || []);
      }

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
    fetchPitchBookings();
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
        fetchPitchBookings(); // Refresh calendar availability
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
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Image Gallery */}
          <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden glass neon-border">
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
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 glass p-2 rounded-full hover:bg-white/20"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 glass p-2 rounded-full hover:bg-white/20"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
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
          <div className="glass p-6 md:p-8 rounded-2xl neon-border">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div className="w-full">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                  {pitch.name}
                  {pitchBookings.filter(b => b.booking_date === format(new Date(), 'yyyy-MM-dd')).length < 12 && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md border border-emerald-500/30 animate-pulse">
                      Live Availability
                    </span>
                  )}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-slate-400">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-500" />
                    <span className="text-sm md:text-base">{pitch.location_name}</span>
                  </div>
                  <Link 
                    to={`/owner/${pitch.owner_id}`}
                    className="flex items-center space-x-2 group hover:text-emerald-400 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden border border-white/10 group-hover:border-emerald-500 transition-colors">
                      {pitch.owner?.avatar_url ? (
                        <img src={pitch.owner.avatar_url} alt={pitch.owner.full_name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-3 h-3 text-slate-500 m-auto mt-1" />
                      )}
                    </div>
                    <span className="text-sm font-bold underline decoration-white/10 group-hover:decoration-emerald-500/50 underline-offset-4">
                      {pitch.owner?.full_name || 'Pitch Owner'}
                    </span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between w-full md:w-auto space-x-3">
                <div className="flex space-x-2">
                  <button 
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={`p-2.5 md:p-3 rounded-xl glass backdrop-blur-md transition-all flex items-center space-x-2 ${
                      isFavorite ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    <span className="text-xs md:text-sm font-bold">{isFavorite ? 'Saved' : 'Save'}</span>
                  </button>
                  <button 
                    onClick={sharePitch}
                    className="p-2.5 md:p-3 rounded-xl glass bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm font-bold">Share</span>
                  </button>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-yellow-400 mb-1 justify-end">
                    <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                    <span className="ml-1 text-lg md:text-xl font-bold">{pitch.rating || 'New'}</span>
                  </div>
                  <span className="text-slate-500 text-[10px] md:text-sm">{pitch.review_count} reviews</span>
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

            {/* Owner Section */}
            <div className="border-t border-white/10 pt-8 mb-8">
              <h3 className="text-xl font-bold mb-6">About the Owner</h3>
              <Link 
                to={`/owner/${pitch.owner_id}`}
                className="flex items-center justify-between glass p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-colors">
                    {pitch.owner?.avatar_url ? (
                      <img src={pitch.owner.avatar_url} alt={pitch.owner.full_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold group-hover:text-emerald-400 transition-colors">{pitch.owner?.full_name || 'Pitch Owner'}</h4>
                    <p className="text-sm text-slate-400">Verified Pitch Provider</p>
                    <div className="flex items-center mt-1 text-xs text-emerald-400">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      <span>Identity Verified</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-widest">Member Since</div>
                  <div className="text-sm font-bold">{pitch.owner?.created_at ? format(new Date(pitch.owner.created_at), 'MMM yyyy') : 'N/A'}</div>
                  <div className="mt-2 text-emerald-400 text-xs font-bold flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    View Profile <ExternalLink className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Other Pitches by Owner */}
            {otherPitches.length > 0 && (
              <div className="border-t border-white/10 pt-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Other Pitches by {pitch.owner?.full_name?.split(' ')[0] || 'Owner'}</h3>
                  <Link to={`/owner/${pitch.owner_id}`} className="text-emerald-400 text-sm hover:underline flex items-center">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherPitches.map((other) => (
                    <Link 
                      key={other.id} 
                      to={`/pitch/${other.id}`}
                      className="glass p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex space-x-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                          <img 
                            src={other.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200'} 
                            alt={other.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="font-bold group-hover:text-emerald-400 transition-colors">{other.name}</h4>
                          <div className="flex items-center text-xs text-slate-400 mt-1">
                            <MapPin className="w-3 h-3 mr-1 text-emerald-500" />
                            <span className="truncate max-w-[150px]">{other.location_name}</span>
                          </div>
                          <div className="mt-2 text-emerald-400 font-bold text-sm">
                            KSH {other.price_per_hour}/hr
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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

            {/* Calendar Availability Section */}
            <div className="glass p-6 md:p-8 rounded-2xl neon-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Pitch Availability</h3>
                  <p className="text-sm text-slate-500">Select a date to see available slots</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    disabled={isBefore(startOfMonth(currentMonth), startOfMonth(new Date()))}
                    className="p-2 glass rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-bold min-w-[140px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 glass rounded-lg hover:bg-white/10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart);
                  const endDate = endOfWeek(monthEnd);
                  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                  return calendarDays.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = bookingDate === dateStr;
                    const isToday = isSameDay(day, new Date());
                    const isPast = isBefore(day, startOfToday());
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    
                    const dayBookings = pitchBookings.filter(b => b.booking_date === dateStr);
                    const isFullyBooked = dayBookings.length >= 12; // Simplified logic: 12 slots max
                    const hasBookings = dayBookings.length > 0;

                    return (
                      <button
                        key={idx}
                        disabled={isPast}
                        onClick={() => setBookingDate(dateStr)}
                        className={`
                          relative h-14 sm:h-20 rounded-xl border transition-all flex flex-col items-center justify-center p-1
                          ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                          ${isPast ? 'cursor-not-allowed bg-white/5 border-transparent' : 'cursor-pointer'}
                          ${isSelected 
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105 z-10' 
                            : 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-white/10'
                          }
                        `}
                      >
                        <span className={`text-sm sm:text-lg font-bold ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                          {format(day, 'd')}
                        </span>
                        
                        {!isPast && isCurrentMonth && (
                          <div className="mt-1 flex space-x-1">
                            {hasBookings ? (
                              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : isFullyBooked ? 'bg-red-500' : 'bg-yellow-500'}`} />
                            ) : (
                              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950/30' : 'bg-emerald-500/30'}`} />
                            )}
                          </div>
                        )}

                        {isToday && !isSelected && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                  <span>Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Partially Booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Fully Booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400">Selected</span>
                </div>
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
          <div className="glass p-6 sm:p-8 rounded-2xl neon-border sticky top-24">
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
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                {pitchBookings.filter(b => b.booking_date === bookingDate).length > 0 && (
                  <p className="text-[10px] text-yellow-500 mt-2 font-bold uppercase tracking-widest">
                    {pitchBookings.filter(b => b.booking_date === bookingDate).length} slots already booked for this date
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    required
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration (Hrs)</label>
                  <select 
                    className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
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
                  className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all"
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
                  className="w-full btn-primary py-4 flex items-center justify-center space-x-2 rounded-xl"
                >
                  {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="font-bold">Confirm Booking</span>}
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-4 uppercase tracking-widest font-bold">
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
          <div className="relative w-full max-w-lg glass p-10 rounded-3xl neon-border text-center overflow-hidden">
            {/* Success Animation Background */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-8 neon-border border-emerald-500/50">
                <CheckCircle className="w-12 h-12" />
              </div>
              
              <h2 className="text-4xl font-black mb-2 tracking-tight">BOOKING <span className="neon-text">SECURED!</span></h2>
              <p className="text-slate-400 mb-8 font-medium">Your slot is locked and loaded. Get ready to play!</p>
              
              <div className="glass bg-white/5 p-8 rounded-2xl mb-8 text-left border border-white/10 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Facility</span>
                  <span className="text-sm font-bold text-white">{pitch.name}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Date & Time</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {format(new Date(bookingDate), 'MMM d, yyyy')} @ {startTime}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Duration</span>
                  <span className="text-sm font-bold text-white">{duration} Hour{duration > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Paid</span>
                  <span className="text-lg font-black text-emerald-400">KSH {(pitch.price_per_hour * duration).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="glass bg-emerald-500/10 p-4 rounded-xl mb-8 border border-emerald-500/20 flex items-start space-x-3 text-left">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  <span className="font-bold text-emerald-400 block mb-1">Anti-Scam Protocol Active</span>
                  Your payment is held securely. Show your digital receipt in the dashboard to the owner upon arrival to finalize the match.
                </p>
              </div>

              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary w-full py-5 text-lg font-black tracking-widest uppercase shadow-lg shadow-emerald-500/20"
                >
                  Go to My Dashboard
                </button>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="text-slate-500 text-sm hover:text-white transition-colors font-bold"
                >
                  Close & Stay Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchDetails;
