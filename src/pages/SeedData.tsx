
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const REAL_PITCHES = [
  {
    name: "Westlands Arena",
    description: "Premium 5-a-side astro-turf in the heart of Westlands. Features high-intensity lighting, professional-grade surface, and ample parking. Perfect for corporate matches and squad games.",
    location_name: "Westlands, Nairobi",
    latitude: -1.2642,
    longitude: 36.8010,
    price_per_hour: 3500,
    contact_phone: "+254 711 000001",
    whatsapp_number: "254711000001",
    images: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    name: "Wadi Degla Club",
    description: "World-class sports facility in Runda. Our pitches are maintained to international standards. Includes access to changing rooms and a cafe for post-match analysis.",
    location_name: "Runda, Nairobi",
    latitude: -1.2189,
    longitude: 36.8203,
    price_per_hour: 5000,
    contact_phone: "+254 711 000002",
    whatsapp_number: "254711000002",
    images: [
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1560272564-c83d66b1ad12?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    name: "Camp Toyoyo",
    description: "The legendary home of grassroots football in Nairobi. High-quality artificial turf that hosts many local league matches. Great atmosphere and very accessible.",
    location_name: "Jericho, Nairobi",
    latitude: -1.2884,
    longitude: 36.8744,
    price_per_hour: 2500,
    contact_phone: "+254 711 000003",
    whatsapp_number: "254711000003",
    images: [
      "https://images.unsplash.com/photo-1431324155629-1a6eda1eed2d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    name: "Ligi Ndogo Grounds",
    description: "Well-known football academy and facility on Ngong Road. Offers both grass and artificial surfaces. Excellent for training sessions and friendly matches.",
    location_name: "Ngong Road, Nairobi",
    latitude: -1.3005,
    longitude: 36.7670,
    price_per_hour: 4000,
    contact_phone: "+254 711 000004",
    whatsapp_number: "254711000004",
    images: [
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    name: "The Arena (Kasarani)",
    description: "Modern football facility located near the Sports City. Features multiple 5-a-side and 7-a-side pitches. Equipped with floodlights for night games.",
    location_name: "Kasarani, Nairobi",
    latitude: -1.2311,
    longitude: 36.8941,
    price_per_hour: 3000,
    contact_phone: "+254 711 000005",
    whatsapp_number: "254711000005",
    images: [
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    name: "Nairobi Academy",
    description: "High-quality grass and artificial pitches located in the serene environment of Karen. Ideal for weekend matches and training camps.",
    location_name: "Karen, Nairobi",
    latitude: -1.3324,
    longitude: 36.7485,
    price_per_hour: 4500,
    contact_phone: "+254 711 000006",
    whatsapp_number: "254711000006",
    images: [
      "https://images.unsplash.com/photo-1518605336397-90db35f53951?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    name: "AstroTurf (Parklands)",
    description: "Conveniently located in Parklands, this facility offers a top-tier artificial surface for competitive 5-a-side football. Excellent floodlights for late-night kickoffs.",
    location_name: "Parklands, Nairobi",
    latitude: -1.2612,
    longitude: 36.8234,
    price_per_hour: 3500,
    contact_phone: "+254 711 000007",
    whatsapp_number: "254711000007",
    images: [
      "https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200"
    ]
  }
];

const SeedData: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (profile?.role !== 'owner') {
      toast.error('Only pitch owners can seed data (to ensure correct owner_id)');
      return;
    }

    setLoading(true);
    setStatus('loading');
    setMessage('Seeding real pitches into the database...');

    try {
      for (const pitchData of REAL_PITCHES) {
        const { images, ...pitchInfo } = pitchData;
        
        // 1. Insert Pitch
        const { data: pitch, error: pitchError } = await supabase
          .from('pitches')
          .insert({
            ...pitchInfo,
            owner_id: user.id,
            is_available: true,
            rating: 4.5 + Math.random() * 0.5,
            review_count: Math.floor(Math.random() * 50) + 10
          })
          .select()
          .single();

        if (pitchError) throw pitchError;

        // 2. Insert Images
        if (pitch && images) {
          const imageInserts = images.map((url, index) => ({
            pitch_id: pitch.id,
            image_url: url,
            is_primary: index === 0
          }));

          const { error: imageError } = await supabase
            .from('pitch_images')
            .insert(imageInserts);

          if (imageError) throw imageError;
        }
      }

      setStatus('success');
      setMessage('Successfully seeded 5 real Nairobi pitches!');
      toast.success('Database seeded successfully!');
    } catch (error: any) {
      console.error('Seeding error:', error);
      setStatus('error');
      setMessage(`Error: ${error.message || 'Unknown error occurred'}`);
      toast.error('Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="max-w-md w-full glass p-8 rounded-3xl neon-border text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-emerald-500/30">
          <Database className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-black mb-4 tracking-tight">Database Seeder</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          This tool will populate your database with real football turfs from Nairobi, Kenya. 
          You must be logged in as a <span className="text-emerald-400 font-bold">Pitch Owner</span> to run this.
        </p>

        {status === 'idle' && (
          <button 
            onClick={handleSeed}
            disabled={loading}
            className="btn-primary w-full py-4 font-bold flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Seed Real Pitches</span>}
          </button>
        )}

        {status === 'loading' && (
          <div className="py-4 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
            <p className="text-emerald-400 font-medium animate-pulse">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-emerald-400 font-bold">{message}</p>
            <button 
              onClick={() => window.location.href = '/discover'}
              className="btn-secondary w-full py-3"
            >
              Go to Discover
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-400 font-bold">{message}</p>
            <button 
              onClick={() => setStatus('idle')}
              className="btn-secondary w-full py-3"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Developer Tool • Use with Caution
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeedData;
