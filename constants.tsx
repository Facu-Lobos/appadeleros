






import React from 'react';
import { CourtData, TimeSlotData, BookingStatus, PublicMatch, UserProfileData, ClubProfileData, Tournament, MatchStat, UpcomingMatch, PlayerCategory, Ranking, ChatMessage, Notification, DayOfWeek } from './types';

export const PLAYER_CATEGORIES: PlayerCategory[] = ['1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7ma', '8va'];
export const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const LOCATIONS: { [country: string]: { [state: string]: string[] } } = {
    "España": {
        "Andalucía": ["Sevilla", "Málaga"],
        "Aragón": ["Zaragoza"],
        "Comunidad de Madrid": ["Madrid"],
        "Comunidad Valenciana": ["Valencia"],
        "Cataluña": ["Barcelona"]
    },
    "Argentina": {
        "Buenos Aires": ["Ciudad de Buenos Aires", "La Plata", "Mar del Plata", "Villa Gesell", "Pinamar", "Madariaga"],
        "Córdoba": ["Córdoba", "Villa Carlos Paz"],
        "Santa Fe": ["Rosario", "Santa Fe"]
    },
    "México": {
        "Ciudad de México": ["Ciudad de México"],
        "Jalisco": ["Guadalajara"],
        "Nuevo León": ["Monterrey"]
    }
};

export const generateTimeSlots = (openingTime: string, closingTime: string, turnDuration: number): TimeSlotData[] => {
    const slots: TimeSlotData[] = [];
    if (!openingTime || !closingTime || !turnDuration) return slots;

    const [startH, startM] = openingTime.split(':').map(Number);
    const [endH, endM] = closingTime.split(':').map(Number);

    const current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    let i = 0;
    while (current < end) {
        slots.push({
            id: `slot-${i++}-${Date.now()}`,
            time: current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            status: BookingStatus.AVAILABLE,
            duration: turnDuration,
        });
        current.setMinutes(current.getMinutes() + turnDuration);
    }
    return slots;
};

export const INITIAL_CLUBS: ClubProfileData[] = [
    {
        id: 'club-1',
        email: 'central@padel.com',
        password: 'password123',
        memberId: 'CEN-001',
        name: "APPadeleros Club Central",
        country: "España",
        state: "Comunidad de Madrid",
        city: "Madrid",
        totalCourts: 3,
        courtDetails: [
            { name: "Pista Central", type: "Cristal", location: "Indoor", surface: "Alfombra" },
            { name: "Pista Panorámica", type: "Cristal", location: "Outdoor", surface: "Alfombra" },
            { name: "Pista Club", type: "Muro", location: "Indoor", surface: "Cemento" }
        ],
        openingTime: "09:00",
        closingTime: "23:00",
        openingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        status: 'Abierto',
        turnDuration: 90,
        hasBuffet: true,
        photos: [
            "https://images.unsplash.com/photo-1633250393829-23a4b2773a6a?q=80&w=2940&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1551712010-6380a0472064?q=80&w=2835&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1543294628-824f16954359?q=80&w=2940&auto=format&fit=crop"
        ],
        notifications: [],
    },
    {
        id: 'club-2',
        email: 'norte@padel.com',
        password: 'password123',
        memberId: 'NOR-001',
        name: "Pádel Norte",
        country: "España",
        state: "Cataluña",
        city: "Barcelona",
        totalCourts: 2,
        courtDetails: [
            { name: "Pista Rápida", type: "Cristal", location: "Indoor", surface: "Alfombra" },
            { name: "Pista Ocio", type: "Muro", location: "Outdoor", surface: "Cemento" },
        ],
        openingTime: "10:00",
        closingTime: "22:00",
        openingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        status: 'Abierto',
        turnDuration: 60,
        hasBuffet: false,
        photos: [
            "https://images.unsplash.com/photo-1596131499598-b0178492040b?q=80&w=2940&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1593111453995-d163e52c8581?q=80&w=2874&auto=format&fit=crop"
        ],
        notifications: [],
    },
     {
        id: 'club-3',
        email: 'sur@padel.com',
        password: 'password123',
        memberId: 'SUR-001',
        name: "Club de Pádel Sol",
        country: "España",
        state: "Andalucía",
        city: "Sevilla",
        totalCourts: 4,
        courtDetails: [
            { name: "Pista Sol 1", type: "Cristal", location: "Outdoor", surface: "Alfombra" },
            { name: "Pista Sol 2", type: "Cristal", location: "Outdoor", surface: "Alfombra" },
            { name: "Pista Luna 1", type: "Muro", location: "Indoor", surface: "Cemento" },
            { name: "Pista Luna 2", type: "Muro", location: "Indoor", surface: "Cemento" },
        ],
        openingTime: "08:00",
        closingTime: "23:00",
        openingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        status: 'Cerrado',
        turnDuration: 90,
        hasBuffet: true,
        photos: [
            "https://images.unsplash.com/photo-1629285483773-631191009340?q=80&w=2864&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1588578492373-3543d81b16d2?q=80&w=2940&auto=format&fit=crop"
        ],
        notifications: [],
    },
    {
        id: 'club-4',
        email: 'val@padel.com',
        password: 'password123',
        memberId: 'VAL-001',
        name: "Pádel City Valencia",
        country: "España",
        state: "Comunidad Valenciana",
        city: "Valencia",
        totalCourts: 5,
        courtDetails: [
             { name: "Pista Turia", type: "Cristal", location: "Outdoor", surface: "Alfombra" },
             { name: "Pista Centro", type: "Cristal", location: "Indoor", surface: "Alfombra" },
        ],
        openingTime: "09:00",
        closingTime: "23:00",
        openingDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        status: 'Abierto',
        turnDuration: 90,
        hasBuffet: true,
        photos: [
            "https://images.unsplash.com/photo-1574674768650-349aeb8a892b?q=80&w=2874&auto=format&fit=crop",
        ],
        notifications: [],
    }
];


export const INITIAL_COURTS: CourtData[] = INITIAL_CLUBS.flatMap(club => 
    club.courtDetails.map((court, index) => ({
        ...court,
        id: `court-${club.id}-${index}`,
        clubId: club.id,
        clubName: club.name,
        timeSlots: generateTimeSlots(club.openingTime, club.closingTime, club.turnDuration)
    }))
);

export const INITIAL_USER_PROFILE: UserProfileData = {
    id: 'player-alex',
    email: 'alex@padel.com',
    password: 'password123',
    firstName: 'Alex',
    lastName: 'Jugador',
    sex: 'Masculino',
    country: 'España',
    state: 'Comunidad de Madrid',
    city: 'Madrid',
    availability: ['Tardes', 'Fines de semana'],
    category: '4ta',
    avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Alex+Jugador`,
    photos: [
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=2787&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1596131499598-b0178492040b?q=80&w=2940&auto=format&fit=crop"
    ],
    stats: {
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        last30DaysTrend: 0,
    },
    upcomingMatches: [],
    matchHistory: [],
    friends: ['player-carla'],
    friendRequests: [],
    notifications: [],
};

export const OTHER_USER_PROFILE: UserProfileData = {
    id: 'player-carla',
    email: 'carla@padel.com',
    password: 'password123',
    firstName: 'Carla',
    lastName: 'Gomez',
    sex: 'Femenino',
    country: 'España',
    state: 'Comunidad de Madrid',
    city: 'Madrid',
    availability: ['Tardes'],
    category: '5ta',
    avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Carla+Gomez`,
    photos: [],
    stats: { matches: 0, wins: 0, losses: 0, winRate: 0, last30DaysTrend: 0 },
    upcomingMatches: [],
    matchHistory: [],
    friends: ['player-alex'],
    friendRequests: [],
    notifications: [],
};

export const ALL_INITIAL_USERS = [INITIAL_USER_PROFILE, OTHER_USER_PROFILE];

export const INITIAL_PUBLIC_MATCHES: PublicMatch[] = [
    {
        id: 'match-1',
        clubId: 'club-1',
        courtName: 'Pista Central',
        time: '18:00',
        category: '4ta',
        gender: 'Masculino',
        playersNeeded: 4,
        currentPlayers: 2,
        createdBy: 'player-alex'
    },
    {
        id: 'match-2',
        clubId: 'club-2',
        courtName: 'Pista Rápida',
        time: '19:30',
        category: '2da',
        gender: 'Mixto',
        playersNeeded: 4,
        currentPlayers: 3,
        createdBy: 'player-carla'
    },
    {
        id: 'match-3',
        clubId: 'club-1',
        courtName: 'Pista Club',
        time: '20:00',
        category: 'Cualquiera',
        gender: 'Femenino',
        playersNeeded: 4,
        currentPlayers: 1,
        createdBy: 'player-carla'
    },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: 'msg-1',
        conversationId: 'player-alex_club-1',
        senderId: 'player-alex',
        receiverId: 'club-1',
        text: 'Hola, ¿tenéis disponibilidad para clases particulares?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        id: 'msg-2',
        conversationId: 'player-alex_club-1',
        senderId: 'club-1',
        receiverId: 'player-alex',
        text: '¡Hola Alex! Sí, tenemos huecos por las mañanas. ¿Te viene bien?',
        timestamp: new Date(Date.now() - 1000 * 60 * 50 * 2).toISOString(),
    },
    {
        id: 'msg-3',
        conversationId: 'player-alex_player-carla',
        senderId: 'player-carla',
        receiverId: 'player-alex',
        text: '¡Hola! Vi que te uniste al partido del viernes. ¡Qué ganas!',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    }
];


export const INITIAL_TOURNAMENTS: Tournament[] = [
    { 
        id: 't-1',
        clubId: 'club-1',
        name: 'Torneo de Apertura', 
        category: '3ra', 
        date: '2024-08-15', 
        status: 'Inscripción Abierta',
        format: 'Copa del Mundo',
        teams: [],
        maxTeams: 16,
        teamsPerGroup: 4,
        registrations: [],
        data: {
            groups: [],
            knockout: {}
        }
    },
    { 
        id: 't-2',
        clubId: 'club-1',
        name: 'Copa Verano', 
        category: '4ta', 
        date: '2024-07-20', 
        status: 'Finalizado',
        format: 'Copa del Mundo',
        teams: [{id: '1', name: 'Equipo A'}, {id: '2', name: 'Equipo B'}],
        maxTeams: 16,
        teamsPerGroup: 4,
        registrations: [],
        data: {
             groups: [],
            knockout: {
                final: { id: 'f-2', round: 'Final', played: true, teamA: {id: '1', name: 'Equipo A'}, teamB: {id: '2', name: 'Equipo B'}, winner: {id: '1', name: 'Equipo A'} }
            }
        }
    },
];

export const INITIAL_RANKINGS: Ranking[] = PLAYER_CATEGORIES.map(cat => ({
    category: cat,
    players: []
}));


export const PadelBallIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} viewBox="0 0 24 24">
        {/* Ball Circle: Filled with primary color */}
        <circle cx="12" cy="12" r="11" fill="#00F5D4" />

        {/* 'U' shape rotated 45 degrees, larger and touching the edges */}
        <path
            d="M 5 19 V 12 C 5 5 19 5 19 12 V 19"
            stroke="#0F172A" /* dark-primary bg */
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="rotate(45 12 12)"
        />
    </svg>
);


export const PadelRacketIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className || "h-8 w-8"}
        viewBox="1 0 64 64"
    >
        <g transform="scale(0.8) translate(6.4, 6.4)">
            {/* Group for stroked elements */}
            <g
                stroke="#00F5D4" /* primary color */
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Head: Inverted teardrop shape (ping-pong style) with primary fill */}
                <path d="M32 50 C22 50 13 30 13 20 C13 10 18 6 32 6 C46 6 51 10 51 20 C51 30 42 50 32 50 Z" fill="#00F5D4"/>


                {/* Heart/Bridge: no fill */}
                <path d="M24 41 l8 -8 l8 8" fill="none" />

                {/* Handle: thinner grip, connected to the head (Altura modificada de 22 a 18) */}
                <rect x="29" y="50" width="6" height="16" rx="2" fill="#00F5D4" />

                {/* Cap: (Coordenadas de path modificadas para alinearse con el nuevo grip) */}
                <path d="M27 68 Q32 73 37 68" fill="#00F5D4" />
            </g>


            {/* Holes: dark fill, arranged in a 4x4 grid */}
            <g fill="#0F172A" stroke="none">
                {/* Row 1 */}
                <circle cx="23" cy="16" r="1.5" />
                <circle cx="29" cy="16" r="1.5" />
                <circle cx="35" cy="16" r="1.5" />
                <circle cx="41" cy="16" r="1.5" />
                {/* Row 2 */}
                <circle cx="23" cy="22" r="1.5" />
                <circle cx="29" cy="22" r="1.5" />
                <circle cx="35" cy="22" r="1.5" />
                <circle cx="41" cy="22" r="1.5" />
                {/* Row 3 */}
                <circle cx="23" cy="28" r="1.5" />
                <circle cx="29" cy="28" r="1.5" />
                <circle cx="35" cy="28" r="1.5" />
                <circle cx="41" cy="28" r="1.5" />
                {/* Row 4 */}
                <circle cx="23" cy="34" r="1.5" />
                <circle cx="29" cy="34" r="1.5" />
                <circle cx="35" cy="34" r="1.5" />
                <circle cx="41" cy="34" r="1.5" />
            </g>
        </g>
    </svg>
);

export const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-light-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export const UserCircleIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const BuildingStorefrontIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

export const SparklesIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M16 17v4m-2-2h4M19 3v4m-2-2h4M12 3a9 9 0 110 18 9 9 0 010-18zm0 0v18" />
    </svg>
);

export const TrophyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256" className={className}>
        <path d="M224,48H32a8,8,0,0,0-8,8V64a8,8,0,0,0,16,0V88a72.08,72.08,0,0,0,72,72,8,8,0,0,0,16,0,72.08,72.08,0,0,0,72-72V64a8,8,0,0,0,16,0V56A8,8,0,0,0,224,48ZM128,144a56.06,56.06,0,0,1-56-56h56Zm56-56a56.06,56.06,0,0,1-56,56V88Z"></path>
        <path d="M208,24H48A16,16,0,0,0,32,40V56H48V40H208V56h16V40A16,16,0,0,0,208,24Z" opacity="0.2"></path>
        <path d="M160,192H96a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0v-8h48v8a8,8,0,0,0,16,0V200A8,8,0,0,0,160,192Z" opacity="0.2"></path>
        <path d="M160,184H96a16,16,0,0,0-16,16v16a16,16,0,0,0,16,16h64a16,16,0,0,0,16-16V200A16,16,0,0,0,160,184Zm0,24H96V200h64Z"></path>
    </svg>
);

export const CalendarIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const ChartBarIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);


// --- Icons for Bottom Nav Bar ---
export const HouseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256" className={className}>
      <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
    </svg>
);

export const TennisBallIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256" className={className}>
        <path d="M201.57,54.46a104,104,0,1,0,0,147.08A103.4,103.4,0,0,0,201.57,54.46ZM65.75,65.77a87.63,87.63,0,0,1,53.66-25.31A87.31,87.31,0,0,1,94,94.06a87.42,87.42,0,0,1-53.62,25.35A87.58,87.58,0,0,1,65.75,65.77ZM40.33,135.48a103.29,103.29,0,0,0,65-30.11,103.24,103.24,0,0,0,30.13-65,87.78,87.78,0,0,1,80.18,80.14,104,104,0,0,0-95.16,95.1,87.78,87.78,0,0,1-80.18-80.14Zm149.92,54.75a87.69,87.69,0,0,1-53.66,25.31,88,88,0,0,1,79-78.95A87.58,87.58,0,0,1,190.25,190.23Z"></path>
    </svg>
);

export const UserIconFill = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256" className={className}>
        <path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z"></path>
    </svg>
);


export const ChatBubbleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256" className={className}>
        <path d="M216,48H40A16,16,0,0,0,24,64V224L56.34,191.66A15.9,15.9,0,0,1,68,192H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48Z" opacity="0.2"></path><path d="M216,40H40A24,24,0,0,0,16,64V224a7.8,7.8,0,0,0,4.69,7.31,8.1,8.1,0,0,0,8.5-1.1L64,196H216a24,24,0,0,0,24-24V64A24,24,0,0,0,216,40Zm8,136a8,8,0,0,1-8,8H68a23.9,23.9,0,0,0-13.66,4L32,212.69V64a8,8,0,0,1,8-8H216a8,8,0,0,1,8,8Z"></path>
    </svg>
);

export const NotificationBellIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256" className={className}>
        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
    </svg>
);

export const EllipsisVerticalIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
      <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
    </svg>
);

export const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
      <path fillRule="evenodd" d="M8.75 1a.75.75 0 0 1 .75.75v.5h1a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1 0-1.5h1v-.5a.75.75 0 0 1 .75-.75ZM10 4.5a.75.75 0 0 0-1.5 0v9.5a.75.75 0 0 0 1.5 0v-9.5ZM7.25 4.5a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-1.5 0v-9.5a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-1.5 0v-9.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3.5 6a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a1 1 0 0 0-1-1h-10ZM5 7a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V7.5A.5.5 0 0 1 5 7Zm3.5 0a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V7.5A.5.5 0 0 1 8.5 7Zm3.5 0a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V7.5A.5.5 0 0 1 12 7Z" clipRule="evenodd" />
    </svg>
);