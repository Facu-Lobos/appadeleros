

import React, { useState, useCallback, useMemo } from 'react';
import { CourtData, TimeSlotData, BookingStatus, Tournament, AppView, UserProfileData, ClubProfileData, PlayerAppView, ClubAppView, PlayerCategory, Ranking, ChatMessage, Notification, FriendRequest, DayOfWeek, MatchStat, TournamentRegistration, Team, Group, GroupMatch, PublicMatch } from './types';
import { INITIAL_COURTS, INITIAL_PUBLIC_MATCHES, INITIAL_TOURNAMENTS, INITIAL_USER_PROFILE, INITIAL_CLUBS, generateTimeSlots, INITIAL_RANKINGS, INITIAL_MESSAGES, ALL_INITIAL_USERS, DAYS_OF_WEEK } from './constants';
import { calculateTournamentPoints, updateRankingsWithPoints, getPlayersFromTeam, getWinnerFromScore } from './services/rankingService';
import Header from './components/Header';
import BookingModal from './components/BookingModal';
import ClubDashboard from './components/ClubDashboard';
import AuthScreen from './components/AuthScreen';
import PlayerLogin from './components/PlayerLogin';
import ClubLogin from './components/ClubLogin';
import PlayerRegistration from './components/PlayerRegistration';
import ClubRegistration from './components/ClubRegistration';
import PlayerProfilePage from './components/PlayerProfilePage';
import PlayerHomePage from './components/PlayerHomePage';
import BottomNavBar from './components/BottomNavBar';
import TournamentDetailPage from './components/TournamentDetailPage';
import ClubDetailPage from './components/ClubDetailPage';
import PlayerTournamentsPage from './components/PlayerTournamentsPage';
import ChatListPage from './components/ChatListPage';
import ConversationPage from './components/ConversationPage';
import CommunityPage from './components/CommunityPage';
import ForgotPassword from './components/ForgotPassword';

// dateKey: YYYY-MM-DD
type SingleBookings = Record<string, Record<string, Record<string, { playerName: string; id: string }>>>;
// dayOfWeek: 0-6
type FixedBookings = Record<number, Record<string, Record<string, { playerName: string; id: string }>>>;

const createGroups = (teams: Team[], teamsPerGroup: number): Group[] => {
    const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
    const numGroups = Math.ceil(teams.length / teamsPerGroup);
    const groups: Group[] = [];
    
    for (let i = 0; i < numGroups; i++) {
        const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
        if (groupTeams.length === 0) continue;
        const matches: GroupMatch[] = [];
        
        for (let j = 0; j < groupTeams.length; j++) {
            for (let k = j + 1; k < groupTeams.length; k++) {
                matches.push({
                    id: `m-${i}-${j}-${k}-${Date.now()}`,
                    teamA: groupTeams[j],
                    teamB: groupTeams[k],
                    played: false,
                });
            }
        }
        
        groups.push({
            name: `Grupo ${String.fromCharCode(65 + i)}`,
            teams: groupTeams,
            matches,
            standings: groupTeams.map(t => ({ teamId: t.id, name: t.name, points: 0, played: 0, wins: 0, draws: 0, losses: 0 })),
        });
    }
    return groups;
};

export const App: React.FC = () => {
    const [allPlayers, setAllPlayers] = useState<UserProfileData[]>(ALL_INITIAL_USERS);
    const [allClubs, setAllClubs] = useState<ClubProfileData[]>(INITIAL_CLUBS);
    const [baseCourts, setBaseCourts] = useState<CourtData[]>(INITIAL_COURTS);
    const [publicMatches, setPublicMatches] = useState<PublicMatch[]>(INITIAL_PUBLIC_MATCHES);
    const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
    const [rankings, setRankings] = useState<Ranking[]>(INITIAL_RANKINGS);
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    
    const [selectedSlot, setSelectedSlot] = useState<TimeSlotData | null>(null);
    const [selectedCourt, setSelectedCourt] = useState<CourtData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [view, setView] = useState<AppView>('auth');
    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
    const [loggedInClub, setLoggedInClub] = useState<ClubProfileData | null>(null);
    
    // View states
    const [playerView, setPlayerView] = useState<PlayerAppView>('home');
    const [clubView, setClubView] = useState<ClubAppView>('tournaments');

    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [selectedClubIdForPlayerView, setSelectedClubIdForPlayerView] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    // Notification Panel
    const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

    const [singleBookings, setSingleBookings] = useState<SingleBookings>({});
    const [fixedBookings, setFixedBookings] = useState<FixedBookings>({});

    const handleLogout = useCallback(() => {
        setUserProfile(null);
        setLoggedInClub(null);
        setView('auth');
        setPlayerView('home');
        setClubView('tournaments');
        setSelectedTournamentId(null);
        setSelectedClubIdForPlayerView(null);
        setSelectedConversationId(null);
        setIsNotificationsPanelOpen(false);
    }, []);
    
    const handlePlayerLogin = useCallback(({ email, pass }: { email: string; pass: string }) => {
        const foundPlayer = allPlayers.find(p => p.email === email);
        if (!foundPlayer) {
            alert("Usuario inexistente");
        } else if (foundPlayer.password !== pass) {
            alert("Contraseña incorrecta");
        } else {
            setUserProfile(foundPlayer);
            setPlayerView('home');
        }
    }, [allPlayers]);

    const handleClubLogin = useCallback(({ email, pass, memberId }: { email: string; pass: string; memberId: string }) => {
        const foundClub = allClubs.find(c => c.email === email);
        if (!foundClub) {
            alert("Usuario inexistente");
        } else if (foundClub.password !== pass) {
            alert("Contraseña incorrecta");
        } else if (foundClub.memberId !== memberId) {
            alert("Número de socio incorrecto");
        } else {
            const clubCourts = baseCourts.filter(c => c.clubId === foundClub.id);
            if (clubCourts.length === 0) {
                 const newCourts: CourtData[] = foundClub.courtDetails.map((cd, i) => ({
                    ...cd,
                    id: `court-${foundClub.id}-${i}`,
                    clubId: foundClub.id,
                    clubName: foundClub.name,
                    timeSlots: generateTimeSlots(foundClub.openingTime, foundClub.closingTime, foundClub.turnDuration),
                }));
                 setBaseCourts(prev => [...prev, ...newCourts]);
            }
            setLoggedInClub(foundClub);
        }
    }, [allClubs, baseCourts]);

    const handleSlotClick = useCallback((slot: TimeSlotData, court: CourtData) => {
        setSelectedSlot(slot);
        setSelectedCourt(court);
        setIsModalOpen(true);
    }, []);

    const handleConfirmBooking = useCallback((
        playerName: string, 
        bookingType: 'single' | 'fixed'
    ) => {
        if (!selectedSlot || !selectedCourt || (!userProfile && !loggedInClub)) return;

        const bookingId = `booking-${Date.now()}`;
        const courtId = selectedCourt.id;
        
        if (bookingType === 'single') {
            const dateKey = selectedDate.toISOString().split('T')[0];
            setSingleBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (!newBookings[dateKey]) newBookings[dateKey] = {};
                if (!newBookings[dateKey][courtId]) newBookings[dateKey][courtId] = {};
                newBookings[dateKey][courtId][selectedSlot.time] = { playerName, id: bookingId };
                return newBookings;
            });
        } else { // fixed
            const dayOfWeek = selectedDate.getDay();
            setFixedBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (!newBookings[dayOfWeek]) newBookings[dayOfWeek] = {};
                if (!newBookings[dayOfWeek][courtId]) newBookings[dayOfWeek][courtId] = {};
                newBookings[dayOfWeek][courtId][selectedSlot.time] = { playerName, id: bookingId };
                return newBookings;
            });
        }
        
        const currentUserId = userProfile?.id || loggedInClub!.id;
        const newNotification: Notification = {
            id: `notif-booking-${Date.now()}`,
            type: 'booking',
            title: 'Reserva Confirmada',
            message: `Tu pista en ${selectedCourt.name} a las ${selectedSlot.time} ha sido reservada.`,
            timestamp: new Date().toISOString(),
            read: false,
        };

        if (userProfile) {
            setUserProfile(p => p ? {...p, notifications: [newNotification, ...p.notifications] } : null);
        }
        if (loggedInClub) {
            setLoggedInClub(c => c ? {...c, notifications: [newNotification, ...c.notifications] } : null);
        }
        
        handleCloseModal();
    }, [selectedSlot, selectedCourt, selectedDate, userProfile, loggedInClub]);
    
    const handleCancelBooking = useCallback((bookingId: string, bookingType: 'single' | 'fixed') => {
        if (!selectedSlot || !selectedCourt) return;
        const courtId = selectedCourt.id;

        if(bookingType === 'single') {
            const dateKey = selectedDate.toISOString().split('T')[0];
            setSingleBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (newBookings[dateKey]?.[courtId]?.[selectedSlot.time]) {
                    delete newBookings[dateKey][courtId][selectedSlot.time];
                }
                return newBookings;
            });
        } else { // fixed
             const dayOfWeek = selectedDate.getDay();
             setFixedBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (newBookings[dayOfWeek]?.[courtId]?.[selectedSlot.time]) {
                    delete newBookings[dayOfWeek][courtId][selectedSlot.time];
                }
                return newBookings;
            });
        }
        
        handleCloseModal();
    }, [selectedSlot, selectedCourt, selectedDate]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedSlot(null);
        setSelectedCourt(null);
    }, []);
    
    const handleJoinMatch = useCallback((matchId: string) => {
        if(!userProfile) return;

        const newNotification: Notification = {
            id: `notif-join-${Date.now()}`,
            type: 'match_join',
            title: '¡Te has unido a un partido!',
            message: ``, // Message will be set inside setPublicMatches
            timestamp: new Date().toISOString(),
            read: false,
        };

        setPublicMatches(prevMatches =>
            prevMatches.map(match => {
                if (match.id === matchId && match.currentPlayers < match.playersNeeded) {
                    newNotification.message = `Confirmada tu plaza en el partido de las ${match.time} en ${match.courtName}.`;
                    return { ...match, currentPlayers: match.currentPlayers + 1 };
                }
                return match;
            })
        );
         setUserProfile(p => p ? {...p, notifications: [newNotification, ...p.notifications] } : null);
    }, [userProfile]);
    
    const handleSendMessage = useCallback((text: string) => {
        if (!selectedConversationId || (!userProfile && !loggedInClub)) return;

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const senderName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : loggedInClub!.name;
        const otherUserId = selectedConversationId.replace(currentUserId, '').replace('_', '');
        
        // 1. Add the new message to the state
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            conversationId: selectedConversationId,
            senderId: currentUserId,
            receiverId: otherUserId,
            text,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);

        // 2. Prepare and add the notification to the receiving user
        const notification: Notification = {
            id: `notif-msg-${Date.now()}`,
            type: 'message',
            title: `Nuevo mensaje de ${senderName}`,
            message: text,
            timestamp: new Date().toISOString(),
            read: false,
            link: { view: 'chat', params: { conversationId: selectedConversationId } }
        };
        
        // Add notification to the receiver's profile in the main list
        const isReceiverPlayer = allPlayers.some(p => p.id === otherUserId);
        if (isReceiverPlayer) {
            setAllPlayers(prev => prev.map(p => 
                p.id === otherUserId ? { ...p, notifications: [notification, ...p.notifications] } : p
            ));
        } else {
            setAllClubs(prev => prev.map(c => 
                c.id === otherUserId ? { ...c, notifications: [notification, ...c.notifications] } : c
            ));
        }
        
    }, [selectedConversationId, userProfile, loggedInClub, allPlayers, allClubs]);

    const handleDeleteConversation = useCallback((conversationId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación? Esta acción es irreversible.')) {
            return;
        }
        setMessages(prev => prev.filter(msg => msg.conversationId !== conversationId));
        // If the currently selected conversation is the one being deleted, go back to the list.
        if (selectedConversationId === conversationId) {
            setSelectedConversationId(null);
        }
    }, [selectedConversationId]);

    const handleNotificationClick = useCallback((notification: Notification) => {
        if (notification.type === 'friend_request') return;
        
        const markAsRead = (notifications: Notification[]) => notifications.map(n => n.id === notification.id ? { ...n, read: true } : n);

        if (userProfile) setUserProfile(prev => ({ ...prev!, notifications: markAsRead(prev!.notifications) }));
        if (loggedInClub) setLoggedInClub(prev => ({ ...prev!, notifications: markAsRead(prev!.notifications) }));

        setIsNotificationsPanelOpen(false);

        if (notification.link?.view === 'chat' && notification.link.params?.conversationId) {
            if(userProfile) setPlayerView('chat');
            if(loggedInClub) {
                setClubView('chat');
                setSelectedConversationId(notification.link.params.conversationId);
            }
        } else if (notification.link?.view === 'tournaments' && notification.link.params?.tournamentId) {
             if(loggedInClub) {
                setClubView('tournaments');
                setSelectedTournamentId(notification.link.params.tournamentId);
             } else if (userProfile) {
                setPlayerView('tournaments');
             }
        }

    }, [userProfile, loggedInClub]);

    const handleMarkAllNotificationsAsRead = useCallback(() => {
        const markAllAsRead = (notifications: Notification[]) => notifications.map(n => ({ ...n, read: true }));
        if (userProfile) setUserProfile(prev => ({ ...prev!, notifications: markAllAsRead(prev!.notifications) }));
        if (loggedInClub) setLoggedInClub(prev => ({ ...prev!, notifications: markAllAsRead(prev!.notifications) }));
    }, [userProfile, loggedInClub]);


    const handleCreateTournament = useCallback((tournament: Tournament) => {
        setTournaments(prev => [...prev, tournament]);
    }, []);
    
    const handleUpdateTournament = useCallback((updatedTournament: Tournament) => {
        const previousTournament = tournaments.find(t => t.id === updatedTournament.id);
        
        // Update rankings if tournament is finished
        if (previousTournament && previousTournament.status !== 'Finalizado' && updatedTournament.status === 'Finalizado') {
            const playerPoints = calculateTournamentPoints(updatedTournament);
            const newRankings = updateRankingsWithPoints(rankings, playerPoints, updatedTournament.category);
            setRankings(newRankings);
        }

        // Update player stats and match history from new results
        if (previousTournament) {
            const newMatchStats: { playerName: string, stat: Omit<MatchStat, 'imageUrl'> & { imageUrl?: string } }[] = [];
            const genericImageUrl = "https://images.unsplash.com/photo-1596131499598-b0178492040b?q=80&w=2940&auto=format&fit=crop";

            const processMatches = (prevMatches: any[], currentMatches: any[]) => {
                currentMatches.forEach((match, index) => {
                    const prevMatch = prevMatches?.[index];
                    if (match.played && !prevMatch?.played && match.score) {
                        const winner = getWinnerFromScore(match.score);
                        if (!winner) return;
                        
                        const winningTeam = winner === 'A' ? match.teamA : match.teamB;
                        const losingTeam = winner === 'A' ? match.teamB : match.teamA;
                        
                        const winners = getPlayersFromTeam(winningTeam);
                        const losers = getPlayersFromTeam(losingTeam);
                        
                        const opponentNameForWinners = losers.join(' y ');
                        const opponentNameForLosers = winners.join(' y ');

                        winners.forEach(playerName => {
                            newMatchStats.push({ playerName, stat: { result: 'Victoria', opponent: opponentNameForWinners, club: updatedTournament.name, score: match.score } });
                        });
                        losers.forEach(playerName => {
                            newMatchStats.push({ playerName, stat: { result: 'Derrota', opponent: opponentNameForLosers, club: updatedTournament.name, score: match.score } });
                        });
                    }
                });
            };

            processMatches(previousTournament.data.groups?.flatMap(g => g.matches), updatedTournament.data.groups?.flatMap(g => g.matches));
            Object.keys(updatedTournament.data.knockout || {}).forEach(roundKey => {
                 const currentRound = updatedTournament.data.knockout[roundKey];
                 const prevRound = previousTournament.data.knockout?.[roundKey];
                 processMatches(
                    prevRound ? (Array.isArray(prevRound) ? prevRound : [prevRound]) : [],
                    currentRound ? (Array.isArray(currentRound) ? currentRound : [currentRound]) : []
                 );
            });
            
             if (newMatchStats.length > 0) {
                setAllPlayers(prevAllPlayers => {
                    const updatedPlayers = JSON.parse(JSON.stringify(prevAllPlayers));
                    newMatchStats.forEach(({ playerName, stat }) => {
                        const player = updatedPlayers.find(p => `${p.firstName} ${p.lastName}` === playerName);
                        if (player) {
                            player.stats.matches++;
                            if (stat.result === 'Victoria') player.stats.wins++;
                            else player.stats.losses++;
                            player.stats.winRate = Math.round((player.stats.wins / player.stats.matches) * 100);
                            player.matchHistory.unshift({ ...stat, imageUrl: genericImageUrl });
                        }
                    });
                     if (userProfile) {
                        const updatedUserProfile = updatedPlayers.find(p => p.id === userProfile.id);
                        if (updatedUserProfile) {
                            setUserProfile(updatedUserProfile);
                        }
                    }
                    return updatedPlayers;
                });
            }
        }

        setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
    }, [tournaments, rankings, userProfile]);

    const handleTournamentRegistrationRequest = useCallback((tournamentId: string, teamName: string, partnerEmail: string) => {
        if (!userProfile) return;

        const partner = allPlayers.find(p => p.email === partnerEmail);
        if (!partner) {
            alert("No se encontró ningún jugador con ese email.");
            return;
        }
        if (partner.id === userProfile.id) {
            alert("No puedes ser tu propio compañero de equipo.");
            return;
        }

        const newRegistration: TournamentRegistration = {
            id: `reg-${Date.now()}`,
            tournamentId,
            teamName,
            playerIds: [userProfile.id, partner.id],
            playerDetails: [
                { id: userProfile.id, name: `${userProfile.firstName} ${userProfile.lastName}`, category: userProfile.category },
                { id: partner.id, name: `${partner.firstName} ${partner.lastName}`, category: partner.category },
            ],
            status: 'pending',
        };

        const tournamentToUpdate = tournaments.find(t => t.id === tournamentId);
        if (!tournamentToUpdate) return;
        
        setTournaments(prev => prev.map(t => 
            t.id === tournamentId 
                ? { ...t, registrations: [...t.registrations, newRegistration] }
                : t
        ));

        // Notify Club
        const clubNotification: Notification = {
            id: `notif-reg-${Date.now()}`,
            type: 'tournament_registration',
            title: 'Nueva inscripción a torneo',
            message: `El equipo '${teamName}' se ha inscrito en '${tournamentToUpdate.name}'.`,
            timestamp: new Date().toISOString(),
            read: false,
            link: { view: 'tournaments', params: { tournamentId } }
        };
        setAllClubs(prev => prev.map(c => 
            c.id === tournamentToUpdate.clubId 
                ? { ...c, notifications: [clubNotification, ...c.notifications] }
                : c
        ));
        
        alert("¡Inscripción enviada! El club revisará tu solicitud.");

    }, [userProfile, allPlayers, tournaments]);

    const handleRegistrationAction = useCallback((tournamentId: string, registrationId: string, status: 'approved' | 'rejected') => {
        let teamToAdd: Team | null = null;
        let registrationToNotify: TournamentRegistration | null = null;
        let tournamentName = '';
        
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                const updatedRegistrations = t.registrations.map(r => {
                    if (r.id === registrationId) {
                        registrationToNotify = r;
                        tournamentName = t.name;
                        const updatedReg = { ...r, status };
                        if (status === 'approved') {
                            teamToAdd = { id: r.id, name: r.teamName };
                        }
                        return updatedReg;
                    }
                    return r;
                });
                const newTeams = teamToAdd ? [...t.teams, teamToAdd] : t.teams;
                return { ...t, registrations: updatedRegistrations, teams: newTeams };
            }
            return t;
        }));
        
        if (registrationToNotify) {
            const playerNotification: Notification = {
                id: `notif-reg-resp-${Date.now()}`,
                type: status === 'approved' ? 'tournament_approval' : 'tournament_rejection',
                title: `Inscripción a '${tournamentName}' ${status === 'approved' ? 'Aprobada' : 'Rechazada'}`,
                message: `Tu inscripción para el equipo '${registrationToNotify.teamName}' ha sido ${status === 'approved' ? 'aprobada' : 'rechazada'}.`,
                timestamp: new Date().toISOString(),
                read: false,
                link: { view: 'tournaments' }
            };
            
            setAllPlayers(prev => prev.map(p => 
                registrationToNotify!.playerIds.includes(p.id)
                    ? { ...p, notifications: [playerNotification, ...p.notifications] }
                    : p
            ));
        }

    }, []);

    const handleGenerateGroupsForTournament = useCallback((tournamentId: string) => {
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament || tournament.teams.length === 0) {
            alert("No hay equipos suficientes para generar los grupos.");
            return;
        }

        if (tournament.teams.length % tournament.teamsPerGroup !== 0) {
             if (!window.confirm(`El número de equipos (${tournament.teams.length}) no es un múltiplo exacto de los equipos por grupo (${tournament.teamsPerGroup}). Algunos grupos pueden ser más pequeños. ¿Continuar?`)) {
                return;
             }
        }
        
        const groups = createGroups(tournament.teams, tournament.teamsPerGroup);
        const updatedTournament = {
            ...tournament,
            data: { ...tournament.data, groups },
            status: 'Fase de Grupos' as 'Fase de Grupos',
        };
        handleUpdateTournament(updatedTournament);
    }, [tournaments, handleUpdateTournament]);

    const handleAuthNavigate = (destination: 'player-login' | 'club-login' | 'player-signup' | 'club-signup') => {
        setView(destination);
    };
    
    const handlePlayerRegister = (profileData: Omit<UserProfileData, 'id' |'avatarUrl' | 'photos' | 'stats' | 'upcomingMatches' | 'matchHistory' | 'friends' | 'friendRequests' | 'notifications'>) => {
        const newProfile: UserProfileData = {
            ...profileData,
            id: `player-${Date.now()}`,
            avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${profileData.firstName}+${profileData.lastName}`,
            photos: [],
            stats: { matches: 0, wins: 0, losses: 0, winRate: 0, last30DaysTrend: 0 },
            upcomingMatches: [],
            matchHistory: [],
            friends: [],
            friendRequests: [],
            notifications: [{
                id: `notif-welcome-${Date.now()}`,
                type: 'welcome',
                title: '¡Bienvenido a APPadeleros!',
                message: `Hola ${profileData.firstName}, ¡tu perfil ha sido creado con éxito!`,
                timestamp: new Date().toISOString(),
                read: false,
            }],
        };
        setAllPlayers(prev => [...prev, newProfile]);
        setUserProfile(newProfile);
        setPlayerView('home');
    };

    const handleClubRegister = (profile: ClubProfileData, newCourts: CourtData[]) => {
        setAllClubs(prev => [...prev, profile]);
        setBaseCourts(prev => [...prev, ...newCourts]);
        setLoggedInClub(profile);
    };
    
    const handleUpdateClubProfile = useCallback((updatedProfile: ClubProfileData) => {
        setLoggedInClub(updatedProfile);
        setAllClubs(prev => prev.map(c => c.id === updatedProfile.id ? updatedProfile : c));

        const otherClubsCourts = baseCourts.filter(c => c.clubId !== updatedProfile.id);
        const newClubCourts: CourtData[] = updatedProfile.courtDetails.map((cd, i) => {
            const existingCourt = baseCourts.find(bc => bc.clubId === updatedProfile.id && bc.name === cd.name);
            return {
                ...cd,
                id: existingCourt?.id || `court-${updatedProfile.id}-${i}-${Date.now()}`,
                clubId: updatedProfile.id,
                clubName: updatedProfile.name,
                timeSlots: generateTimeSlots(updatedProfile.openingTime, updatedProfile.closingTime, updatedProfile.turnDuration),
            };
        });

        setBaseCourts([...otherClubsCourts, ...newClubCourts]);
    }, [baseCourts]);
    
    const handleUpdatePlayerProfile = (updatedProfile: UserProfileData) => {
        setUserProfile(updatedProfile);
        setAllPlayers(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    };

    const handleSelectClub = (clubId: string) => {
        setSelectedClubIdForPlayerView(clubId);
    };

    const handleBackToClubList = () => {
        setSelectedClubIdForPlayerView(null);
    };
    
    const handleDeletePlayerProfile = useCallback(() => {
        if (!userProfile) return;
        setAllPlayers(prev => prev.filter(p => p.id !== userProfile.id));
        handleLogout();
    }, [userProfile, handleLogout]);

    const handleDeleteClubProfile = useCallback(() => {
        if (!loggedInClub) return;
        const clubIdToDelete = loggedInClub.id;

        setAllClubs(prev => prev.filter(c => c.id !== clubIdToDelete));
        setBaseCourts(prev => prev.filter(c => c.clubId !== clubIdToDelete));
        setPublicMatches(prev => prev.filter(m => m.clubId !== clubIdToDelete));
        handleLogout();
    }, [loggedInClub, handleLogout]);

    const handleStartChat = useCallback((friendId: string) => {
        if (!userProfile) return;
        const userIds = [userProfile.id, friendId].sort();
        const conversationId = userIds.join('_');
        setSelectedConversationId(conversationId);
        setPlayerView('chat');
    }, [userProfile]);

    const handleClubStartChat = useCallback((playerId: string) => {
        if (!loggedInClub) return;
        const userIds = [loggedInClub.id, playerId].sort();
        const conversationId = userIds.join('_');
        setSelectedConversationId(conversationId);
        setClubView('chat');
    }, [loggedInClub]);

    const handleRemoveFriend = useCallback((friendId: string) => {
        if (!userProfile) return;
        if (!window.confirm('¿Estás seguro de que quieres eliminar a este amigo? Se borrará también el historial de chat.')) {
            return;
        }
        
        const currentUserId = userProfile.id;

        setAllPlayers(prev => prev.map(p => {
            if (p.id === currentUserId) return { ...p, friends: p.friends.filter(id => id !== friendId) };
            if (p.id === friendId) return { ...p, friends: p.friends.filter(id => id !== currentUserId) };
            return p;
        }));

        setUserProfile(prev => ({ ...prev!, friends: prev!.friends.filter(id => id !== friendId) }));

        const userIds = [currentUserId, friendId].sort();
        const conversationId = userIds.join('_');
        setMessages(prev => prev.filter(msg => msg.conversationId !== conversationId));

    }, [userProfile]);


    // --- Friends System ---
    const handleSendFriendRequest = useCallback((toId: string) => {
        if (!userProfile) return;
        const fromUser = userProfile;

        const newRequest: FriendRequest = {
            fromId: fromUser.id,
            fromName: `${fromUser.firstName} ${fromUser.lastName}`,
            fromAvatarUrl: fromUser.avatarUrl,
        };
        const newNotification: Notification = {
            id: `notif-fr-${Date.now()}`,
            type: 'friend_request',
            title: 'Solicitud de Amistad',
            message: `${fromUser.firstName} ${fromUser.lastName} quiere ser tu amigo.`,
            timestamp: new Date().toISOString(),
            read: false,
            payload: { fromId: fromUser.id }
        };

        setAllPlayers(prevPlayers => prevPlayers.map(p => {
            if (p.id === toId) {
                if (p.friendRequests.some(req => req.fromId === fromUser.id)) return p;
                return { 
                    ...p, 
                    friendRequests: [...p.friendRequests, newRequest],
                    notifications: [newNotification, ...p.notifications]
                };
            }
            return p;
        }));
    }, [userProfile]);
    
    const handleAcceptFriendRequest = useCallback((fromId: string) => {
        if (!userProfile) return;
        const currentUserId = userProfile.id;

        const fromUser = allPlayers.find(p => p.id === fromId);
        if (!fromUser) return;
        
        const acceptanceNotification: Notification = {
            id: `notif-accept-${Date.now()}`,
            type: 'friend_accept',
            title: 'Amistad Aceptada',
            message: `${userProfile.firstName} ${userProfile.lastName} y tú ahora sois amigos.`,
            timestamp: new Date().toISOString(),
            read: false,
        };

        setAllPlayers(prev => prev.map(p => {
            if (p.id === fromId) {
                return { ...p, friends: [...p.friends, currentUserId], notifications: [acceptanceNotification, ...p.notifications] };
            }
            if (p.id === currentUserId) {
                return {
                    ...p,
                    friends: [...p.friends, fromId],
                    friendRequests: p.friendRequests.filter(req => req.fromId !== fromId),
                };
            }
            return p;
        }));

        setUserProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                friends: [...prev.friends, fromId],
                friendRequests: prev.friendRequests.filter(req => req.fromId !== fromId),
                notifications: prev.notifications.filter(n => !(n.type === 'friend_request' && n.payload?.fromId === fromId)),
            };
        });
    }, [userProfile, allPlayers]);

    const handleDeclineFriendRequest = useCallback((fromId: string) => {
        if (!userProfile) return;
        const currentUserId = userProfile.id;

        setAllPlayers(prev => prev.map(p => {
            if (p.id === currentUserId) {
                return {
                    ...p,
                    friendRequests: p.friendRequests.filter(req => req.fromId !== fromId),
                };
            }
            return p;
        }));

        setUserProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                friendRequests: prev.friendRequests.filter(req => req.fromId !== fromId),
                notifications: prev.notifications.filter(n => !(n.type === 'friend_request' && n.payload?.fromId === fromId)),
            };
        });
    }, [userProfile]);
    
    const handleForgotPasswordRequest = useCallback((email: string) => {
        const playerExists = allPlayers.some(p => p.email === email);
        const clubExists = allClubs.some(c => c.email === email);
        
        // In a real app, you'd send an email here only if playerExists or clubExists is true.
        // For this simulation, we just log it, and the UI shows a generic confirmation message.
        console.log(`Password reset requested for ${email}. Player exists: ${playerExists}, Club exists: ${clubExists}`);
    }, [allPlayers, allClubs]);


    const courtsForDisplay = useMemo(() => {
        const dateKey = selectedDate.toISOString().split('T')[0];
        // getDay() is Sun-indexed (0=Sun, 1=Mon, ...). Our DAYS_OF_WEEK is Mon-indexed.
        // We convert Sun->6, Mon->0, etc.
        const dayOfWeekJs = selectedDate.getDay();
        const dayName = DAYS_OF_WEEK[(dayOfWeekJs + 6) % 7];

        const singleBookingsForDay = singleBookings[dateKey] || {};
        const fixedBookingsForDay = fixedBookings[dayOfWeekJs] || {};

        return baseCourts.map(court => {
            const club = allClubs.find(c => c.id === court.clubId);
            
            // Check if club is open on the selected day
            const isClubOpenOnSelectedDate = club && club.status === 'Abierto' && club.openingDays.includes(dayName);
            
            if (!isClubOpenOnSelectedDate) {
                return {
                    ...court,
                    timeSlots: court.timeSlots.map(slot => ({
                        ...slot,
                        status: BookingStatus.UNAVAILABLE,
                        bookedBy: 'Club cerrado',
                    })),
                };
            }

            const newTimeSlots = court.timeSlots.map(slot => {
                const singleBooking = singleBookingsForDay[court.id]?.[slot.time];
                const fixedBooking = fixedBookingsForDay[court.id]?.[slot.time];
                const booking = singleBooking ? { ...singleBooking, type: 'single' } : fixedBooking ? { ...fixedBooking, type: 'fixed' } : null;

                if (booking) {
                    return {
                        ...slot,
                        status: BookingStatus.BOOKED,
                        bookedBy: booking.playerName,
                        bookingId: booking.id,
                        bookingType: booking.type as 'single' | 'fixed',
                    };
                }
                
                return {
                    ...slot,
                    status: BookingStatus.AVAILABLE,
                    bookedBy: undefined,
                    bookingId: undefined,
                    bookingType: undefined,
                };
            });
            return { ...court, timeSlots: newTimeSlots };
        });
    }, [selectedDate, singleBookings, fixedBookings, baseCourts, allClubs]);

    const handlePlayerViewChange = (view: PlayerAppView) => {
        if (view === 'chat' && userProfile) {
            const updatedNotifications = userProfile.notifications.map(n =>
                n.type === 'message' ? { ...n, read: true } : n
            );
             setUserProfile(prev => ({...prev!, notifications: updatedNotifications}));
             // Also update the global list, so if they log out and back in, the state is preserved
             setAllPlayers(prevAll => prevAll.map(p => p.id === userProfile.id ? {...p, notifications: updatedNotifications} : p));
        }
        setPlayerView(view);
        setSelectedClubIdForPlayerView(null);
        setSelectedConversationId(null);
    };

    const handleClubViewChange = (view: ClubAppView) => {
        setClubView(view);
        // When changing main tabs, always exit any specific conversation view
        setSelectedConversationId(null);
    };
    
    const unreadChatCount = useMemo(() => {
        if (!userProfile) return 0;
        const unreadConvoIds = new Set<string>();
        userProfile.notifications.forEach(n => {
            if (n.type === 'message' && !n.read && n.link?.params?.conversationId) {
                unreadConvoIds.add(n.link.params.conversationId);
            }
        });
        return unreadConvoIds.size;
    }, [userProfile?.notifications]);

    if (userProfile) {
        const selectedClubForDetailView = selectedClubIdForPlayerView
            ? allClubs.find(c => c.id === selectedClubIdForPlayerView)
            : null;
        
        const mainContent = () => {
             if (selectedClubForDetailView) {
                return <ClubDetailPage
                           club={selectedClubForDetailView}
                           courts={courtsForDisplay}
                           onSlotClick={handleSlotClick}
                           selectedDate={selectedDate}
                           setSelectedDate={setSelectedDate}
                           onBack={handleBackToClubList}
                       />
            }
            if (selectedConversationId) {
                return <ConversationPage
                    conversationId={selectedConversationId}
                    messages={messages}
                    currentUserId={userProfile.id}
                    allUsers={[...allPlayers, ...allClubs]}
                    onSendMessage={handleSendMessage}
                    onBack={() => {
                        setSelectedConversationId(null);
                    }}
                 />
            }
            switch(playerView) {
                case 'home':
                    return <PlayerHomePage
                                userProfile={userProfile}
                                allClubs={allClubs}
                                onSelectClub={handleSelectClub}
                            />
                case 'tournaments':
                    return <PlayerTournamentsPage
                                currentUser={userProfile}
                                tournaments={tournaments}
                                clubs={allClubs}
                                allPlayers={allPlayers}
                                onRegister={handleTournamentRegistrationRequest}
                            />
                case 'chat':
                     return <ChatListPage 
                                messages={messages}
                                currentUserId={userProfile.id}
                                allUsers={[...allPlayers, ...allClubs]}
                                onSelectConversation={setSelectedConversationId}
                                onDeleteConversation={handleDeleteConversation}
                             />
                case 'community':
                    return <CommunityPage
                                currentUser={userProfile}
                                allPlayers={allPlayers}
                                allClubs={allClubs}
                                onSendFriendRequest={handleSendFriendRequest}
                            />
                case 'profile':
                    return <PlayerProfilePage 
                                profile={userProfile} 
                                allPlayers={allPlayers}
                                onUpdateProfile={handleUpdatePlayerProfile} 
                                onDeleteProfile={handleDeletePlayerProfile} 
                                onStartChat={handleStartChat}
                                onRemoveFriend={handleRemoveFriend}
                            />
                default:
                    return null;
            }
        };

        return (
            <div className="min-h-screen bg-dark-primary font-sans">
               <Header
                    onLogout={handleLogout}
                    notifications={userProfile.notifications}
                    isPanelOpen={isNotificationsPanelOpen}
                    onTogglePanel={() => setIsNotificationsPanelOpen(!isNotificationsPanelOpen)}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                    onAcceptFriendRequest={handleAcceptFriendRequest}
                    onDeclineFriendRequest={handleDeclineFriendRequest}
                />
               <main className="container mx-auto p-4 pb-24">
                   {mainContent()}
               </main>
               
               {isModalOpen && selectedSlot && (
                    <BookingModal
                       isOpen={isModalOpen}
                       onClose={handleCloseModal}
                       onConfirm={handleConfirmBooking}
                       onCancelBooking={handleCancelBooking}
                       slotData={selectedSlot}
                       court={selectedCourt}
                       userProfile={userProfile}
                   />
               )}
               <BottomNavBar 
                    activeView={playerView} 
                    setView={handlePlayerViewChange} 
                    unreadMessageCount={unreadChatCount}
                />
           </div>
        );
   }
    
    if (loggedInClub) {
        const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
        
        return (
            <div className="min-h-screen bg-dark-primary font-sans">
                <Header
                    onLogout={handleLogout}
                    notifications={loggedInClub.notifications}
                    isPanelOpen={isNotificationsPanelOpen}
                    onTogglePanel={() => setIsNotificationsPanelOpen(!isNotificationsPanelOpen)}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                    onAcceptFriendRequest={handleAcceptFriendRequest}
                    onDeclineFriendRequest={handleDeclineFriendRequest}
                />
                <main className="container mx-auto p-4 lg:p-8">
                    {selectedTournament ? (
                        <TournamentDetailPage 
                            tournament={selectedTournament} 
                            onUpdateTournament={handleUpdateTournament}
                            onBack={() => setSelectedTournamentId(null)}
                            onRegistrationAction={handleRegistrationAction}
                            onGenerateGroups={handleGenerateGroupsForTournament}
                        />
                    ) : (
                         <ClubDashboard 
                            clubProfile={loggedInClub}
                            onUpdateProfile={handleUpdateClubProfile}
                            onDeleteProfile={handleDeleteClubProfile}
                            tournaments={tournaments.filter(t => t.clubId === loggedInClub.id)} 
                            rankings={rankings}
                            onCreateTournament={handleCreateTournament}
                            onSelectTournament={(id) => setSelectedTournamentId(id)}
                            courts={courtsForDisplay.filter(c => c.clubId === loggedInClub.id)}
                            onSlotClick={handleSlotClick}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            messages={messages}
                            currentUserId={loggedInClub.id}
                            allUsers={[...allPlayers, ...allClubs]}
                            onSelectConversation={setSelectedConversationId}
                            selectedConversationId={selectedConversationId}
                            onSendMessage={handleSendMessage}
                            onDeleteConversation={handleDeleteConversation}
                            activeView={clubView}
                            setView={handleClubViewChange}
                            onStartChat={handleClubStartChat}
                        />
                    )}
                </main>
                 {isModalOpen && selectedSlot && (
                     <BookingModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onConfirm={handleConfirmBooking}
                        onCancelBooking={handleCancelBooking}
                        slotData={selectedSlot}
                        court={selectedCourt}
                        userProfile={userProfile}
                    />
                )}
            </div>
        )
    }

    switch (view) {
        case 'player-login':
            return <PlayerLogin onLogin={handlePlayerLogin} onBack={() => setView('auth')} onForgotPassword={() => setView('forgot-password')} />;
        case 'club-login':
            return <ClubLogin onLogin={handleClubLogin} onBack={() => setView('auth')} onForgotPassword={() => setView('forgot-password')} />;
        case 'player-signup':
            return <PlayerRegistration onRegister={handlePlayerRegister} onBack={() => setView('auth')} />;
        case 'club-signup':
            return <ClubRegistration onRegister={handleClubRegister} onBack={() => setView('auth')} />;
        case 'forgot-password':
            return <ForgotPassword onRequest={handleForgotPasswordRequest} onBack={() => setView('auth')} />;
        case 'auth':
        default:
            return <AuthScreen onNavigate={handleAuthNavigate} />;
    }
};