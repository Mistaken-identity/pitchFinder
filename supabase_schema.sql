
-- 1. Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('player', 'owner')) DEFAULT 'player',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Pitches table
CREATE TABLE pitches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  price_per_hour DECIMAL NOT NULL,
  contact_phone TEXT,
  whatsapp_number TEXT,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Pitch Images table
CREATE TABLE pitch_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  team_name TEXT,
  total_price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  captain_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')) DEFAULT 'intermediate',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Match Requests table
CREATE TABLE match_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  pitch_id UUID REFERENCES pitches(id) ON DELETE SET NULL,
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  skill_level_required TEXT,
  status TEXT CHECK (status IN ('open', 'matched', 'completed', 'cancelled')) DEFAULT 'open',
  opponent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Pitches: Everyone can view, only owners can insert/update/delete
CREATE POLICY "Pitches are viewable by everyone" ON pitches FOR SELECT USING (true);
CREATE POLICY "Owners can insert pitches" ON pitches FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own pitches" ON pitches FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own pitches" ON pitches FOR DELETE USING (auth.uid() = owner_id);

-- Pitch Images: Everyone can view, only pitch owners can manage
CREATE POLICY "Pitch images viewable by everyone" ON pitch_images FOR SELECT USING (true);
CREATE POLICY "Owners can manage pitch images" ON pitch_images FOR ALL USING (
  EXISTS (SELECT 1 FROM pitches WHERE id = pitch_id AND owner_id = auth.uid())
);

-- Bookings: Users can view their own bookings, owners can view bookings for their pitches
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view bookings for their pitches" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM pitches WHERE id = pitch_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can insert bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews: Everyone can view, only authenticated users can insert
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teams: Everyone can view, only captains can manage
CREATE POLICY "Teams viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Captains can manage teams" ON teams FOR ALL USING (auth.uid() = captain_id);

-- Match Requests: Everyone can view, only team captains can manage
CREATE POLICY "Match requests viewable by everyone" ON match_requests FOR SELECT USING (true);
CREATE POLICY "Captains can manage match requests" ON match_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM teams WHERE id = team_id AND captain_id = auth.uid())
);
