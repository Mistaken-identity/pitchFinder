
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '../lib/supabase';
import { Pitch } from '../types';
import PitchCard from '../components/PitchCard';
import { Search, Filter, Map as MapIcon, List, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

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

  const fetchPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*, images:pitch_images(*), owner:profiles(*)');
      
      if (error) throw error;
      setPitches(data || []);
    } catch (error) {
      console.error('Error fetching pitches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPitches();
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const filteredPitches = pitches.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <button className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{filteredPitches.length} pitches found</span>
          </div>
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
