
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '../lib/supabase';
import { Pitch, Booking } from '../types';
import PitchCard from '../components/PitchCard';
import { Search, Filter, Map as MapIcon, List, Loader2, Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format, addHours, parseISO, isAfter } from 'date-fns';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: -1.286389, // Nairobi
  lng: 36.817223
};

const mapOptions = {
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#020617' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#10b981' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0ea5e9' }] },
  ],
  disableDefaultUI: true,
  zoomControl: true,
};

const Discover: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Availability Filter State
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterTime, setFilterTime] = useState(format(addHours(new Date(), 1), 'HH:00'));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const fetchPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*), owner:profiles(*)');
      
      if (error) throw error;
      const fetchedPitches = data || [];
      setPitches(fetchedPitches);
      
      // Center map on first pitch if available
      if (fetchedPitches.length > 0 && map) {
        map.panTo({ lat: fetchedPitches[0].latitude, lng: fetchedPitches[0].longitude });
      }
    } catch (error) {
      console.error('Error fetching pitches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!filterDate) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', filterDate)
        .eq('status', 'confirmed');
      
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    fetchPitches();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [filterDate]);

  useEffect(() => {
    if (map && pitches.length > 0) {
      map.panTo({ lat: pitches[0].latitude, lng: pitches[0].longitude });
    }
  }, [map, pitches]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const isPitchAvailable = (pitchId: string) => {
    if (!showAvailableOnly || !filterDate || !filterTime) return true;
    
    const selectedStart = `${filterDate}T${filterTime}`;
    // Assume 1 hour duration for filtering
    const selectedEnd = format(addHours(parseISO(selectedStart), 1), "yyyy-MM-dd'T'HH:mm");

    return !bookings.some(booking => {
      if (booking.pitch_id !== pitchId) return false;
      
      const bookingStart = `${booking.booking_date}T${booking.start_time}`;
      const bookingEnd = `${booking.booking_date}T${booking.end_time}`;
      
      // Check overlap: (StartA < EndB) and (EndA > StartB)
      return (selectedStart < bookingEnd && selectedEnd > bookingStart);
    });
  };

  const filteredPitches = pitches.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = isPitchAvailable(p.id);
    return matchesSearch && matchesAvailability;
  });

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-96 glass border-r border-white/10 flex flex-col z-20 ${viewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-6 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search pitches or locations..." 
              className="w-full glass bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-widest transition-colors ${showFilters ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{filteredPitches.length} pitches found</span>
              <Link to="/seed" className="text-[8px] text-emerald-500/50 hover:text-emerald-500 uppercase tracking-widest mt-1">Seed Data</Link>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4 border-t border-white/5 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center space-x-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>Date</span>
                      </label>
                      <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Time</span>
                      </label>
                      <input 
                        type="time" 
                        value={filterTime}
                        onChange={(e) => setFilterTime(e.target.value)}
                        className="w-full glass bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">Available Only</span>
                      <span className="text-[10px] text-slate-500">Hide booked grounds</span>
                    </div>
                    <button 
                      onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${showAvailableOnly ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showAvailableOnly ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {showAvailableOnly && (
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <span>Filtering for {format(parseISO(filterDate), 'MMM d')} @ {filterTime}</span>
                      <button onClick={() => setShowAvailableOnly(false)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar pb-24 md:pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : filteredPitches.length > 0 ? (
            filteredPitches.map(pitch => (
              <div key={pitch.id} onClick={() => {
                setSelectedPitch(pitch);
                if (map) map.panTo({ lat: pitch.latitude, lng: pitch.longitude });
              }}>
                <PitchCard pitch={pitch} />
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p>No pitches found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className={`flex-grow relative ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
          >
            {filteredPitches.map(pitch => (
              <Marker
                key={pitch.id}
                position={{ lat: pitch.latitude, lng: pitch.longitude }}
                onClick={() => setSelectedPitch(pitch)}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                  scaledSize: new google.maps.Size(40, 40)
                }}
              />
            ))}

            {selectedPitch && (
              <InfoWindow
                position={{ lat: selectedPitch.latitude, lng: selectedPitch.longitude }}
                onCloseClick={() => setSelectedPitch(null)}
              >
                <div className="p-1 min-w-[200px] text-slate-900">
                  <h3 className="font-bold">{selectedPitch.name}</h3>
                  <p className="text-xs text-slate-600 mb-2">{selectedPitch.location_name}</p>
                  <p className="text-sm font-bold text-emerald-600">KSH {selectedPitch.price_per_hour}/hr</p>
                  <Link 
                    to={`/pitch/${selectedPitch.id}`}
                    className="mt-2 block text-center bg-emerald-500 text-white text-xs py-1 rounded hover:bg-emerald-600 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-950">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Mobile View Toggle */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden z-30">
          <button 
            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="btn-primary flex items-center space-x-2 rounded-full px-6 py-3"
          >
            {viewMode === 'map' ? (
              <><List className="w-5 h-5" /> <span>Show List</span></>
            ) : (
              <><MapIcon className="w-5 h-5" /> <span>Show Map</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Discover;
