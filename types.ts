

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
  firstName: string;
  lastName:string;
  sex: PlayerSex;
  country: string;
  state: string;
  city: string;
  availability: PlayerAvailability[];
  category: PlayerCategory;
  avatarUrl: string;
  photos: string[];
  stats: {
      matches: number;
      wins: number;
      losses: number;
      winRate: number; // percentage
      last30DaysTrend: number; // percentage change
  };
  upcomingMatches: UpcomingMatch[];
  matchHistory: MatchStat[];
  friends: string[]; // array of user IDs
  friendRequests: FriendRequest[];
  notifications: Notification[];
}

export interface ClubProfileData {
  id: string;
  email: string;
  password?: string;
  memberId: string;
  name: string;
  country: string;
  state: string;
  city: string;
  totalCourts: number;
  courtDetails: CourtDetails[];
  openingTime: string; // e.g., "09:00"
  closingTime: string; // e.g., "23:00"
  openingDays: DayOfWeek[];
  status: 'Abierto' | 'Cerrado';
  turnDuration: number; // 60, 90, 120
  hasBuffet: boolean;
  photos: string[];
  notifications: Notification[];
}


// --- Tournament Types ---

export type Team = {
  id: string;
  name: string;
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
  tournamentId: string;
  teamName: string;
  playerIds: string[];
  playerDetails: { id: string; name: string; category: PlayerCategory }[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface Tournament {
  id: string;
  clubId: string;
  name: string;
  category: PlayerCategory;
  date: string;
  status: 'Inscripción Abierta' | 'Próximo' | 'Fase de Grupos' | 'Fase Final' | 'Finalizado';
  format: TournamentFormat;
  teams: Team[];
  maxTeams: number;
  teamsPerGroup: number;
  registrations: TournamentRegistration[];
  advancingTeams?: Team[];
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
  id: string;
  conversationId: string;
  senderId: string; // 'player-alex', 'club-1', etc.
  receiverId: string;
  text: string;
  timestamp: string; // ISO string
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

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  link?: {
    view: PlayerAppView | ClubAppView;
    params?: { [key: string]: any }; // e.g., { tournamentId: '...' }
  };
   payload?: {
    fromId?: string;
  };
}