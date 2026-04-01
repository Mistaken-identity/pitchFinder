
export type UserRole = 'player' | 'owner';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface Pitch {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  contact_phone: string | null;
  whatsapp_number: string | null;
  is_available: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  images?: PitchImage[];
}

export interface PitchImage {
  id: string;
  pitch_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  pitch_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  team_name: string | null;
  total_price: number;
  created_at: string;
  pitch?: Pitch;
}

export interface Review {
  id: string;
  pitch_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: Profile;
}

export interface Team {
  id: string;
  captain_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  location: string | null;
  captain_phone: string;
  assistant_name: string;
  assistant_phone: string;
  created_at: string;
}

export interface MatchRequest {
  id: string;
  team_id: string;
  pitch_id: string | null;
  match_date: string;
  match_time: string;
  skill_level_required: string | null;
  bet_amount: number;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  opponent_team_id: string | null;
  description: string | null;
  created_at: string;
  team?: Team;
  pitch?: Pitch;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'match_request' | 'match_confirmed' | 'booking' | 'payment';
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  prize_pool: string | null;
  entry_fee: number;
  image_url: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  phone_number: string;
  checkout_request_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  type: 'pitch_listing' | 'booking_deposit';
  reference_id: string | null;
  created_at: string;
}
