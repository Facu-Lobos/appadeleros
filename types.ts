
export enum BookingStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  SELECTED = 'selected',
  UNAVAILABLE = 'unavailable',
}

export type PlayerCategory = '1ra' | '2da' | '3ra' | '4ta' | '5ta' | '6ta' | '7ma' | '8va';
export type PlayerSex = 'Masculino' | 'Femenino' | 'Otro';
export type PlayerAvailability = 'Mañanas' | 'Tardes' | 'Noches' | 'Fines de semana' | 'Cualquiera';

export type UserRole = 'player' | 'club';

export type AppView = 'auth' | 'player-login' | 'club-login' | 'player-signup' | 'club-signup' | 'forgot-password';
export type PlayerAppView = 'home' | 'tournaments' | 'profile' | 'chat' | 'community';
export type ClubAppView = 'calendar' | 'tournaments' | 'ranking' | 'profile' | 'chat' | 'community';

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface TimeSlotData {
  id: string;
  time: string;
  status: BookingStatus;
  bookedBy?: string;
  duration: number;
  bookingId?: string;
  bookingType?: 'single' | 'fixed';
}

export interface CourtDetails {
  name: string;
  type: 'Muro' | 'Cristal';
  location: 'Indoor' | 'Outdoor';
  surface: 'Alfombra' | 'Cemento';
}

export interface CourtData extends CourtDetails {
  id: string;
  clubId: string;
  clubName: string;
  timeSlots: TimeSlotData[];
}

export interface PlayerSuggestion {
    name: string;
    category: string;
    shortBio: string;
}

export interface PublicMatch {
  id:string;
  clubId: string;
  courtName: string;
  time: string;
  category: PlayerCategory | 'Cualquiera';
  gender: 'Masculino' | 'Femenino' | 'Mixto';
  playersNeeded: number;
  currentPlayers: number;
  createdBy: string; // User ID of the creator
}

export interface MatchStat {
    result: 'Victoria' | 'Derrota';
    opponent: string;
    club: string;
    score?: string; // e.g., "6-2, 6-3"
    imageUrl: string;
}

export interface UpcomingMatch {
    clubName: string;
    time: string;
    courtImageUrl: string;
}

export interface FriendRequest {
  fromId: string;
  fromName: string;
  fromAvatarUrl: string;
}

export interface UserProfileData {
  id: string; // Unique identifier for the user
  email: string;
  password?: string;
  first_name: string;
  last_name:string;
  sex: PlayerSex;
  country: string;
  state: string;
  city: string;
  availability: PlayerAvailability[];
  category: PlayerCategory;
  avatar_url: string;
  photos: string[];
  stats: {
      matches: number;
      wins: number;
      losses: number;
      winRate: number; // percentage
      last30DaysTrend: number; // percentage change
  };
  upcoming_matches: UpcomingMatch[];
  match_history: MatchStat[];
  friends: string[]; // array of user IDs
  friendRequests: FriendRequest[];
  notifications: Notification[];
}

export interface ClubProfileData {
  id: string;
  email: string;
  password?: string;
  member_id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  total_courts: number;
  courtDetails: CourtDetails[];
  opening_time: string; // e.g., "09:00"
  closing_time: string; // e.g., "23:00"
  opening_days: DayOfWeek[];
  status: 'Abierto' | 'Cerrado';
  turn_duration: number; // 60, 90, 120
  has_buffet: boolean;
  photos: string[];
  notifications: Notification[];
}


// --- Tournament Types ---

export type Team = {
  id: string;
  name: string;
  playerIds: string[];
};

export type GroupMatch = {
  id: string;
  teamA: Team;
  teamB: Team;
  score?: string; // e.g., "6-2, 6-3"
  played: boolean;
};

export type Group = {
  name: string;
  teams: Team[];
  matches: GroupMatch[];
  standings: { teamId: string; name: string; points: number; played: number; wins: number; draws: number; losses: number; }[];
};

export type KnockoutMatch = {
  id: string;
  teamA?: Team;
  teamB?: Team;
  score?: string; // e.g., "6-2, 6-3"
  played: boolean;
  winner?: Team;
  nextMatchId?: string | null;
  round: string;
};

export type TournamentFormat = 'Copa del Mundo';

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  team_name: string;
  player_ids: string[];
  player_details: { id: string; name: string; category: PlayerCategory }[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface Tournament {
  id: string;
  club_id: string;
  name: string;
  category: PlayerCategory;
  date: string;
  status: 'Inscripción Abierta' | 'Próximo' | 'Fase de Grupos' | 'Fase Final' | 'Finalizado';
  format: TournamentFormat;
  teams: Team[];
  max_teams: number;
  teams_per_group: number;
  tournament_registrations: TournamentRegistration[];
  advancing_teams?: Team[];
  data: {
    groups?: Group[];
    knockout?: {
      roundOf32?: KnockoutMatch[];
      roundOf16?: KnockoutMatch[];
      quarterFinals?: KnockoutMatch[];
      semiFinals?: KnockoutMatch[];
      final?: KnockoutMatch;
    };
  }
}

// --- Ranking Types ---
export interface PlayerRankingEntry {
    playerId: string;
    name: string;
    points: number;
}

export interface Ranking {
    category: PlayerCategory;
    players: PlayerRankingEntry[];
}


// --- Chat Types ---
export interface ChatMessage {
  id: number;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string; // ISO string
  read?: boolean;
}


// --- Notification Types ---
export type NotificationType = 
  'message' | 
  'booking' | 
  'match_join' | 
  'welcome' | 
  'friend_request' | 
  'friend_accept' |
  'tournament_registration' |
  'tournament_approval' |
  'tournament_rejection';

export interface NotificationLinkParams {
    tournamentId?: string;
    conversationId?: string;
}

export interface Notification {
  id: number;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  link?: {
    view: PlayerAppView | ClubAppView;
    params?: NotificationLinkParams;
  };
   payload?: {
    fromId?: string;
  };
}

// --- Booking Types ---
export interface Booking {
  id: string;
  created_at: string;
  court_id: string;
  user_id: string;
  player_name: string;
  booking_date: string; // "YYYY-MM-DD"
  booking_time: string; // "HH:MM"
  booking_type: 'single' | 'fixed';
  day_of_week?: number | null; // JS Standard: 0=Sun, 1=Mon, ..., 6=Sat
}

// --- Toast Notification ---
export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}


// --- Supabase DB Types ---

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          created_at: string
          court_id: string
          user_id: string
          player_name: string
          booking_date: string
          booking_time: string
          booking_type: "single" | "fixed"
          day_of_week: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          court_id: string
          user_id: string
          player_name: string
          booking_date: string
          booking_time: string
          booking_type: "single" | "fixed"
          day_of_week?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          court_id?: string
          user_id?: string
          player_name?: string
          booking_date?: string
          booking_time?: string
          booking_type?: "single" | "fixed"
          day_of_week?: number | null
        }
      }
      club_profiles: {
        Row: {
          id: string
          email: string | null
          member_id: string | null
          name: string | null
          country: string | null
          state: string | null
          city: string | null
          total_courts: number | null
          opening_time: string | null
          closing_time: string | null
          opening_days: string[] | null
          status: string | null
          turn_duration: number | null
          has_buffet: boolean | null
          photos: string[] | null
        }
        Insert: {
          id: string
          email?: string | null
          member_id?: string | null
          name?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          total_courts?: number | null
          opening_time?: string | null
          closing_time?: string | null
          opening_days?: string[] | null
          status?: string | null
          turn_duration?: number | null
          has_buffet?: boolean | null
          photos?: string[] | null
        }
        Update: {
          id?: string
          email?: string | null
          member_id?: string | null
          name?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          total_courts?: number | null
          opening_time?: string | null
          closing_time?: string | null
          opening_days?: string[] | null
          status?: string | null
          turn_duration?: number | null
          has_buffet?: boolean | null
          photos?: string[] | null
        }
      }
      courts: {
        Row: {
          id: string
          created_at: string
          name: string
          type: "Muro" | "Cristal"
          location: "Indoor" | "Outdoor"
          surface: "Alfombra" | "Cemento"
          club_id: string
          club_name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          type: "Muro" | "Cristal"
          location: "Indoor" | "Outdoor"
          surface: "Alfombra" | "Cemento"
          club_id: string
          club_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          type?: "Muro" | "Cristal"
          location?: "Indoor" | "Outdoor"
          surface?: "Alfombra" | "Cemento"
          club_id?: string
          club_name?: string | null
        }
      }
      messages: {
        Row: {
          id: number
          created_at: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          text: string
          read: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          text: string
          read?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          conversation_id?: string
          sender_id?: string
          receiver_id?: string
          text?: string
          read?: boolean
        }
      }
      notifications: {
        Row: {
          id: number
          created_at: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          link: Notification['link'] | null
          payload: Notification['payload'] | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          link?: Notification['link'] | null
          payload?: Notification['payload'] | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          link?: Notification['link'] | null
          payload?: Notification['payload'] | null
        }
      }
      player_profiles: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          sex: string | null
          country: string | null
          state: string | null
          city: string | null
          availability: string[] | null
          category: string | null
          avatar_url: string | null
          photos: string[] | null
          stats: UserProfileData['stats'] | null
          upcoming_matches: UpcomingMatch[] | null
          match_history: MatchStat[] | null
          friends: string[] | null
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          sex?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          availability?: string[] | null
          category?: string | null
          avatar_url?: string | null
          photos?: string[] | null
          stats?: UserProfileData['stats'] | null
          upcoming_matches?: UpcomingMatch[] | null
          match_history?: MatchStat[] | null
          friends?: string[] | null
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          sex?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          availability?: string[] | null
          category?: string | null
          avatar_url?: string | null
          photos?: string[] | null
          stats?: UserProfileData['stats'] | null
          upcoming_matches?: UpcomingMatch[] | null
          match_history?: MatchStat[] | null
          friends?: string[] | null
        }
      }
      public_matches: {
        Row: {
          id: string
          created_at: string
          club_id: string | null
          court_name: string | null
          time: string | null
          category: string | null
          gender: "Masculino" | "Femenino" | "Mixto" | null
          players_needed: number | null
          current_players: number | null
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          club_id?: string | null
          court_name?: string | null
          time?: string | null
          category?: string | null
          gender?: "Masculino" | "Femenino" | "Mixto" | null
          players_needed?: number | null
          current_players?: number | null
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          club_id?: string | null
          court_name?: string | null
          time?: string | null
          category?: string | null
          gender?: "Masculino" | "Femenino" | "Mixto" | null
          players_needed?: number | null
          current_players?: number | null
          created_by?: string | null
        }
      }
      rankings: {
        Row: {
          id: number
          created_at: string
          category: string
          players: PlayerRankingEntry[]
        }
        Insert: {
          id?: number
          created_at?: string
          category: string
          players: PlayerRankingEntry[]
        }
        Update: {
          id?: number
          created_at?: string
          category?: string
          players?: PlayerRankingEntry[]
        }
      }
      tournaments: {
        Row: {
          id: string;
          created_at: string;
          club_id: string;
          name: string;
          category: string;
          date: string;
          status: string;
          format: string;
          teams: Team[] | null;
          max_teams: number;
          teams_per_group: number;
          advancing_teams: Team[] | null;
          data: Tournament['data'] | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          club_id: string;
          name: string;
          category: string;
          date: string;
          status: string;
          format: string;
          teams?: Team[] | null;
          max_teams: number;
          teams_per_group: number;
          advancing_teams?: Team[] | null;
          data?: Tournament['data'] | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          club_id?: string;
          name?: string;
          category?: string;
          date?: string;
          status?: string;
          format?: string;
          teams?: Team[] | null;
          max_teams?: number;
          teams_per_group?: number;
          advancing_teams?: Team[] | null;
          data?: Tournament['data'] | null;
        };
      };
      tournament_registrations: {
        Row: {
          id: string
          created_at: string
          tournament_id: string
          team_name: string
          player_ids: string[]
          player_details: TournamentRegistration['player_details']
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          tournament_id: string
          team_name: string
          player_ids: string[]
          player_details: TournamentRegistration['player_details']
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          tournament_id?: string
          team_name?: string
          player_ids?: string[]
          player_details?: TournamentRegistration['player_details']
          status?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
