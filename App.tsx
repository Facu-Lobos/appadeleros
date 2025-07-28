




import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CourtData, TimeSlotData, BookingStatus, Tournament, AppView, UserProfileData, ClubProfileData, PlayerAppView, ClubAppView, Ranking, ChatMessage, Notification, FriendRequest, Team, Group, GroupMatch, TournamentRegistration, PublicMatch, CourtDetails, NotificationType, Booking, ToastMessage } from './types';
import { generateTimeSlots, DAYS_OF_WEEK } from './constants';
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
import { supabase } from './services/supabaseClient';
import GlobalLoader from './components/GlobalLoader';
import Toast from './components/Toast';

// dateKey: YYYY-MM-DD -> courtId -> time -> { playerName, id }
type SingleBookings = Record<string, Record<string, Record<string, { playerName: string; id: string }>>>;
// dayOfWeek: 0-6 (JS standard, Sun-Sat) -> courtId -> time -> { playerName, id }
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

// Helper to convert data URL to Blob for uploading
const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

export const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<ToastMessage | null>(null);

    const [allPlayers, setAllPlayers] = useState<UserProfileData[]>([]);
    const [allClubs, setAllClubs] = useState<ClubProfileData[]>([]);
    const [baseCourts, setBaseCourts] = useState<CourtData[]>([]);
    const [publicMatches, setPublicMatches] = useState<PublicMatch[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [rankings, setRankings] = useState<Ranking[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
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

    const showToast = useCallback((message: ToastMessage) => {
        setToast(message);
        setTimeout(() => {
            setToast(null);
        }, 3000);
    }, []);

     // --- Auth and Data Loading ---
    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            showToast({ text: "Error: No se pudo conectar a la base de datos.", type: 'error'});
            return;
        };

        // Fetch initial data on load
        const fetchAllData = async () => {
             const [
                { data: clubsData },
                { data: courtsData },
                { data: tournamentsData },
                { data: playersData },
                { data: publicMatchesData },
                { data: rankingsData },
            ] = await Promise.all([
                supabase.from('club_profiles').select('*'),
                supabase.from('courts').select('*'),
                supabase.from('tournaments').select('*, teams(*), registrations(*), data'),
                supabase.from('player_profiles').select('*'),
                supabase.from('public_matches').select('*'),
                supabase.from('rankings').select('*'),
            ]);

            if (clubsData) setAllClubs(clubsData as ClubProfileData[]);
            if (courtsData) setBaseCourts(courtsData as CourtData[]);
            if (tournamentsData) setTournaments(tournamentsData as unknown as Tournament[]);
            if (playersData) setAllPlayers(playersData as UserProfileData[]);
            if (publicMatchesData) setPublicMatches(publicMatchesData as PublicMatch[]);
            if (rankingsData) setRankings(rankingsData as Ranking[]);
        };
        
        fetchAllData().finally(() => setIsLoading(false));


        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                // Fetch user-specific data upon login
                const { data: messagesData } = await supabase.from('messages').select('*').or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
                if (messagesData) setMessages(messagesData as ChatMessage[]);

                 const { data: bookingsData } = await supabase.from('bookings').select('*');
                 if (bookingsData) {
                    const newSingleBookings: SingleBookings = {};
                    const newFixedBookings: FixedBookings = {};
                    for (const booking of bookingsData as Booking[]) {
                        const bookingItem = { playerName: booking.player_name, id: booking.id };
                        if (booking.booking_type === 'single') {
                            const dateKey = booking.booking_date;
                            if (!newSingleBookings[dateKey]) newSingleBookings[dateKey] = {};
                            if (!newSingleBookings[dateKey][booking.court_id]) newSingleBookings[dateKey][booking.court_id] = {};
                            newSingleBookings[dateKey][booking.court_id][booking.booking_time] = bookingItem;
                        } else if (booking.booking_type === 'fixed' && booking.day_of_week !== null) {
                            const dayOfWeek = booking.day_of_week!;
                            if (!newFixedBookings[dayOfWeek]) newFixedBookings[dayOfWeek] = {};
                            if (!newFixedBookings[dayOfWeek][booking.court_id]) newFixedBookings[dayOfWeek][booking.court_id] = {};
                            newFixedBookings[dayOfWeek][booking.court_id][booking.booking_time] = bookingItem;
                        }
                    }
                    setSingleBookings(newSingleBookings);
                    setFixedBookings(newFixedBookings);
                }

                const { data: playerProfile } = await supabase.from('player_profiles').select('*, notifications(*)').eq('id', session.user.id).single();
                if (playerProfile) {
                    setUserProfile(playerProfile as UserProfileData);
                    setLoggedInClub(null);
                    setPlayerView('home');
                    setView(undefined);
                    return;
                }

                const { data: clubProfile } = await supabase.from('club_profiles').select('*, notifications(*)').eq('id', session.user.id).single();
                if (clubProfile) {
                    setLoggedInClub(clubProfile as ClubProfileData);
                    setUserProfile(null);
                    setClubView('tournaments');
                     setView(undefined);
                    return;
                }
                
                showToast({ text: "No se encontró un perfil para este usuario.", type: 'error' });
                await supabase.auth.signOut();

            } else {
                setUserProfile(null);
                setLoggedInClub(null);
                setView('auth');
            }
        });

        return () => subscription.unsubscribe();
    }, [showToast]);

    // --- Realtime Subscriptions ---
    useEffect(() => {
        if (!supabase) return;
        const currentUserId = userProfile?.id || loggedInClub?.id;

        if (!currentUserId) return;

        // Listen for new messages for the current user
        const messageChannel = supabase.channel(`messages-for-${currentUserId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `receiver_id=eq.${currentUserId}` 
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as ChatMessage]);
            })
            .subscribe();

        // Listen for new notifications for the current user
        const notificationChannel = supabase.channel(`notifications-for-${currentUserId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications', 
                filter: `user_id=eq.${currentUserId}` 
            }, (payload) => {
                const newNotification = payload.new as Notification;
                 if (userProfile) {
                    setUserProfile(prev => ({...prev!, notifications: [newNotification, ...prev!.notifications]}));
                } else if (loggedInClub) {
                    setLoggedInClub(prev => ({...prev!, notifications: [newNotification, ...prev!.notifications]}));
                }
            })
            .subscribe();

        // Cleanup subscriptions on component unmount or user change
        return () => {
            supabase.removeChannel(messageChannel);
            supabase.removeChannel(notificationChannel);
        };

    }, [userProfile, loggedInClub]);

    const handleLogout = useCallback(async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) showToast({ text: `Error al cerrar sesión: ${error.message}`, type: 'error'});
        // State will be cleared by onAuthStateChange
    }, [showToast]);
    
    const handlePlayerLogin = useCallback(async ({ email, pass }: { email: string; pass: string }) => {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showToast({ text: error.message, type: 'error'});
        }
        // onAuthStateChange handles success
    }, [showToast]);

    const handleClubLogin = useCallback(async ({ email, pass }: { email: string; pass: string }) => {
         if (!supabase) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showToast({ text: error.message, type: 'error'});
        }
        // onAuthStateChange handles success and checks if user is a club
    }, [showToast]);

     const handlePlayerRegister = async (profileData: Omit<UserProfileData, 'id' | 'avatarUrl' | 'photos' | 'stats' | 'upcomingMatches' | 'matchHistory' | 'friends' | 'friendRequests' | 'notifications'>) => {
        if (!supabase) return;
        const { email, password, ...metaData } = profileData;
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    ...metaData,
                    first_name: metaData.firstName,
                    last_name: metaData.lastName,
                    avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${metaData.firstName}+${metaData.lastName}`,
                    role: 'player'
                }
            }
        });
        if (error) showToast({ text: error.message, type: 'error'});
        // The trigger on Supabase should create the profile, and onAuthStateChange will log the user in.
    };

    const handleClubRegister = async (profile: ClubProfileData, newCourts: CourtData[], photoFiles: File[]) => {
        if (!supabase) return;
        const { email, password } = profile;
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password: password!,
        });

        if (signUpError) {
            showToast({ text: signUpError.message, type: 'error'});
            return;
        }
        if (!user) {
            showToast({ text: "El registro falló, por favor intenta de nuevo.", type: 'error'});
            return;
        }

        const photoUrls = await Promise.all(
            photoFiles.map(async (file) => {
                const filePath = `gallery/${user.id}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage.from('club-photos').upload(filePath, file);
                if (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                    return null;
                }
                const { data: { publicUrl } } = supabase.storage.from('club-photos').getPublicUrl(filePath);
                return publicUrl;
            })
        );
        
        const validUrls = photoUrls.filter(url => url !== null) as string[];
        
        const profileToInsert = {
            id: user.id,
            email: profile.email,
            member_id: profile.memberId,
            name: profile.name,
            country: profile.country,
            state: profile.state,
            city: profile.city,
            total_courts: newCourts.length,
            opening_time: profile.openingTime,
            closing_time: profile.closingTime,
            opening_days: profile.openingDays,
            status: profile.status,
            turn_duration: profile.turnDuration,
            has_buffet: profile.hasBuffet,
            photos: validUrls,
        };

        const { error: profileError } = await supabase.from('club_profiles').insert(profileToInsert);
        if (profileError) {
             showToast({ text: `Falló la creación del perfil: ${profileError.message}`, type: 'error'});
             // Consider deleting the user if profile creation fails
             return;
        }

        const courtsToInsert = newCourts.map(court => ({
            name: court.name,
            type: court.type,
            location: court.location,
            surface: court.surface,
            club_id: user.id,
            club_name: profile.name
        }));
        const { error: courtsError } = await supabase.from('courts').insert(courtsToInsert);
        if (courtsError) {
             showToast({ text: `Falló la creación de las pistas: ${courtsError.message}`, type: 'error'});
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSlot(null);
        setSelectedCourt(null);
    };

    const handleSlotClick = useCallback((slot: TimeSlotData, court: CourtData) => {
        setSelectedSlot(slot);
        setSelectedCourt(court);
        setIsModalOpen(true);
    }, []);

    const handleConfirmBooking = useCallback(async (
        playerName: string, 
        bookingType: 'single' | 'fixed'
    ) => {
        if (!selectedSlot || !selectedCourt || (!userProfile && !loggedInClub) || !supabase) return;

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const courtId = selectedCourt.id;
        const dateKey = selectedDate.toISOString().split('T')[0];
        const dayOfWeekJs = selectedDate.getDay(); // JS standard: 0=Sun

        const newBookingForDb = {
            court_id: courtId,
            user_id: currentUserId,
            player_name: playerName,
            booking_date: dateKey,
            booking_time: selectedSlot.time,
            booking_type: bookingType,
            day_of_week: bookingType === 'fixed' ? dayOfWeekJs : null,
        };

        const { data, error } = await supabase.from('bookings').insert(newBookingForDb).select().single();

        if (error || !data) {
            showToast({ text: `Error al crear la reserva: ${error?.message}`, type: 'error'});
            return;
        }

        const newBookingForState = {
            playerName: data.player_name,
            id: data.id,
        };

        if (bookingType === 'single') {
            setSingleBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (!newBookings[dateKey]) newBookings[dateKey] = {};
                if (!newBookings[dateKey][courtId]) newBookings[dateKey][courtId] = {};
                newBookings[dateKey][courtId][selectedSlot.time] = newBookingForState;
                return newBookings;
            });
        } else {
            setFixedBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (!newBookings[dayOfWeekJs]) newBookings[dayOfWeekJs] = {};
                if (!newBookings[dayOfWeekJs][courtId]) newBookings[dayOfWeekJs][courtId] = {};
                newBookings[dayOfWeekJs][courtId][selectedSlot.time] = newBookingForState;
                return newBookings;
            });
        }

        const newNotification = {
            type: 'booking' as NotificationType,
            title: 'Reserva Confirmada',
            message: `Tu pista en ${selectedCourt.name} a las ${selectedSlot.time} ha sido reservada.`,
            user_id: userProfile?.id || loggedInClub!.id,
        };

        await supabase.from('notifications').insert(newNotification);
        
        handleCloseModal();
        showToast({ text: "Reserva confirmada con éxito.", type: 'success'});
    }, [selectedSlot, selectedCourt, selectedDate, userProfile, loggedInClub, showToast]);
    
    const handleCancelBooking = useCallback(async (bookingId: string, bookingType: 'single' | 'fixed') => {
        if (!selectedSlot || !selectedCourt || !supabase) return;

        const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
        
        if (error) {
            showToast({ text: `Error al cancelar la reserva: ${error.message}`, type: 'error'});
            return;
        }

        const dateKey = selectedDate.toISOString().split('T')[0];
        const dayOfWeekJs = selectedDate.getDay();
        const courtId = selectedCourt.id;
        const time = selectedSlot.time;

        if (bookingType === 'single') {
             setSingleBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (newBookings[dateKey]?.[courtId]?.[time]) {
                    delete newBookings[dateKey][courtId][time];
                }
                return newBookings;
            });
        } else {
             setFixedBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (newBookings[dayOfWeekJs]?.[courtId]?.[time]) {
                    delete newBookings[dayOfWeekJs][courtId][time];
                }
                return newBookings;
            });
        }

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const cancellationNotification = {
            type: 'booking' as NotificationType,
            title: 'Reserva Cancelada',
            message: `La reserva de la pista ${selectedCourt.name} a las ${time} ha sido cancelada.`,
            user_id: currentUserId,
        };
        await supabase.from('notifications').insert(cancellationNotification);

        handleCloseModal();
        showToast({ text: "Reserva cancelada.", type: 'info'});
    }, [selectedSlot, selectedCourt, selectedDate, userProfile, loggedInClub, showToast]);

    const handleJoinMatch = useCallback(async (matchId: string) => {
        if(!userProfile || !supabase) return;

        const match = publicMatches.find(m => m.id === matchId);
        if(!match) return;

        setPublicMatches(prevMatches =>
            prevMatches.map(m => {
                if (m.id === matchId && m.currentPlayers < m.playersNeeded) {
                    return { ...m, currentPlayers: m.currentPlayers + 1 };
                }
                return m;
            })
        );
        
        await supabase.from('public_matches').update({ current_players: match.currentPlayers + 1 }).eq('id', matchId);

        const newNotification = {
            type: 'match_join' as const,
            title: '¡Te has unido a un partido!',
            message: `Confirmada tu plaza en el partido de las ${match.time} en ${match.courtName}.`,
            user_id: userProfile.id,
        };
        await supabase.from('notifications').insert(newNotification);
        showToast({ text: "Te has unido al partido.", type: 'success' });

    }, [userProfile, publicMatches, showToast]);
    
    const handleSendMessage = useCallback(async (text: string) => {
        if (!selectedConversationId || !supabase || (!userProfile && !loggedInClub)) return;

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const senderName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : loggedInClub!.name;
        const otherUserId = selectedConversationId.replace(currentUserId, '').replace('_', '');
        
        const newMessageForUI: ChatMessage = {
            id: `temp-${Date.now()}`,
            conversationId: selectedConversationId,
            senderId: currentUserId,
            receiverId: otherUserId,
            text,
            timestamp: new Date().toISOString(),
            read: false
        };
        const newMessageForDb = {
            conversation_id: selectedConversationId,
            sender_id: currentUserId,
            receiver_id: otherUserId,
            text,
        };

        setMessages(prev => [...prev, newMessageForUI]);
        await supabase.from('messages').insert(newMessageForDb);

        const notification = {
            type: 'message' as const,
            title: `Nuevo mensaje de ${senderName}`,
            message: text,
            link: { view: 'chat' as const, params: { conversationId: selectedConversationId } },
            user_id: otherUserId,
        };
        await supabase.from('notifications').insert(notification);
        
    }, [selectedConversationId, userProfile, loggedInClub, allPlayers, allClubs]);

    const handleDeleteConversation = useCallback(async (conversationId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación? Esta acción es irreversible.') || !supabase) {
            return;
        }
        setMessages(prev => prev.filter(msg => msg.conversationId !== conversationId));
        await supabase.from('messages').delete().eq('conversation_id', conversationId);
        
        if (selectedConversationId === conversationId) {
            setSelectedConversationId(null);
        }
    }, [selectedConversationId]);

    const handleNotificationClick = useCallback(async (notification: Notification) => {
        if (notification.type === 'friend_request' || !supabase) return;
        
        const markAsRead = (notifications: Notification[]) => notifications.map(n => n.id === notification.id ? { ...n, read: true } : n);

        if (userProfile) setUserProfile(prev => ({ ...prev!, notifications: markAsRead(prev!.notifications) }));
        if (loggedInClub) setLoggedInClub(prev => ({ ...prev!, notifications: markAsRead(prev!.notifications) }));
        
        await supabase.from('notifications').update({ read: true }).eq('id', notification.id);

        setIsNotificationsPanelOpen(false);

        if (notification.link?.view === 'chat' && notification.link.params?.conversationId) {
            handleStartChat(notification.link.params.conversationId.replace(userProfile?.id || loggedInClub!.id, "").replace("_",""));
        } else if (notification.link?.view === 'tournaments' && notification.link.params?.tournamentId) {
             if(loggedInClub) {
                setClubView('tournaments');
                setSelectedTournamentId(notification.link.params.tournamentId);
             } else if (userProfile) {
                setPlayerView('tournaments');
             }
        }

    }, [userProfile, loggedInClub]);

    const handleMarkAllNotificationsAsRead = useCallback(async () => {
        if (!supabase) return;
        const markAllAsRead = (notifications: Notification[]) => notifications.map(n => ({ ...n, read: true }));
        const currentUserId = userProfile?.id || loggedInClub?.id;
        
        if (userProfile) setUserProfile(prev => ({ ...prev!, notifications: markAllAsRead(prev!.notifications) }));
        if (loggedInClub) setLoggedInClub(prev => ({ ...prev!, notifications: markAllAsRead(prev!.notifications) }));

        await supabase.from('notifications').update({ read: true }).eq('user_id', currentUserId).eq('read', false);
    }, [userProfile, loggedInClub]);


    const handleCreateTournament = useCallback(async (tournament: Omit<Tournament, 'id'>) => {
        if (!supabase) return;
        const { clubId, name, category, date, status, format, teams, maxTeams, teamsPerGroup, registrations, data, advancingTeams } = tournament;
        const tournamentToInsert = {
            club_id: clubId, name, category, date, status, format, teams, max_teams: maxTeams, teams_per_group: teamsPerGroup, registrations, data,
            ...(advancingTeams && { advancing_teams: advancingTeams }),
        };

        const { data: dbData, error } = await supabase.from('tournaments').insert(tournamentToInsert).select().single();
        if (error) {
            showToast({ text: `Error al crear el torneo: ${error.message}`, type: 'error'});
        } else if (dbData) {
            setTournaments(prev => [...prev, dbData as unknown as Tournament]);
            showToast({ text: "Torneo creado con éxito.", type: 'success'});
        }
    }, [showToast]);
    
    const handleUpdateTournament = useCallback(async (updatedTournament: Tournament) => {
        if (!supabase) return;
        const { id, clubId, maxTeams, teamsPerGroup, advancingTeams, ...rest } = updatedTournament;
        const tournamentToUpdate = {
            ...rest,
            club_id: clubId,
            max_teams: maxTeams,
            teams_per_group: teamsPerGroup,
            ...(advancingTeams && { advancing_teams: advancingTeams }),
        };

        const { data, error } = await supabase.from('tournaments').update(tournamentToUpdate).eq('id', updatedTournament.id).select().single();
        if (error) {
            showToast({ text: `Error al actualizar el torneo: ${error.message}`, type: 'error'});
        } else if (data) {
             setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? data as unknown as Tournament : t));
        }
    }, [showToast]);

    const handleTournamentRegistrationRequest = useCallback(async (tournamentId: string, teamName: string, partnerEmail: string) => {
        if (!userProfile || !supabase) return;

        const partner = allPlayers.find(p => p.email === partnerEmail);
        if (!partner) {
            showToast({ text: "No se encontró ningún jugador con ese email.", type: 'error'});
            return;
        }
        if (partner.id === userProfile.id) {
            showToast({ text: "No puedes ser tu propio compañero de equipo.", type: 'error'});
            return;
        }

        const newRegistrationForDb = {
            tournament_id: tournamentId,
            team_name: teamName,
            player_ids: [userProfile.id, partner.id],
            player_details: [
                { id: userProfile.id, name: `${userProfile.firstName} ${userProfile.lastName}`, category: userProfile.category },
                { id: partner.id, name: `${partner.firstName} ${partner.lastName}`, category: partner.category },
            ],
            status: 'pending' as 'pending',
        };
        
        const { data, error } = await supabase.from('tournament_registrations').insert(newRegistrationForDb).select().single();

        if (error) {
            showToast({ text: `Error al enviar la inscripción: ${error.message}`, type: 'error'});
            return;
        }

        const tournamentToUpdate = tournaments.find(t => t.id === tournamentId);
        if (!tournamentToUpdate) return;
        
        const clubNotification = {
            type: 'tournament_registration' as const,
            title: 'Nueva inscripción a torneo',
            message: `El equipo '${teamName}' se ha inscrito en '${tournamentToUpdate.name}'.`,
            link: { view: 'tournaments' as const, params: { tournamentId } },
            user_id: tournamentToUpdate.clubId,
        };
        await supabase.from('notifications').insert(clubNotification);
        
        setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, registrations: [...t.registrations, data as TournamentRegistration] } : t));
        showToast({ text: "¡Inscripción enviada! El club revisará tu solicitud.", type: 'success'});

    }, [userProfile, allPlayers, tournaments, showToast]);

    const handleRegistrationAction = useCallback(async (tournamentId: string, registrationId: string, status: 'approved' | 'rejected') => {
        if (!supabase) return;
        
        const { data: updatedReg, error } = await supabase.from('tournament_registrations').update({ status }).eq('id', registrationId).select().single();
        if(error || !updatedReg) {
            showToast({ text: `Error al actualizar la inscripción: ${error?.message}`, type: 'error'});
            return;
        }

        const registrationToNotify = updatedReg as TournamentRegistration;
        let tournamentName = '';
        
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                tournamentName = t.name;
                const updatedRegistrations = t.registrations.map(r => r.id === registrationId ? { ...r, status } : r);
                const newTeams = status === 'approved' ? [...t.teams, { id: registrationToNotify.id, name: registrationToNotify.teamName }] : t.teams;
                return { ...t, registrations: updatedRegistrations, teams: newTeams };
            }
            return t;
        }));
        
        const notificationType: NotificationType = status === 'approved' ? 'tournament_approval' : 'tournament_rejection';
        const playerNotification = {
            type: notificationType,
            title: `Inscripción a '${tournamentName}' ${status === 'approved' ? 'Aprobada' : 'Rechazada'}`,
            message: `Tu inscripción para el equipo '${registrationToNotify.teamName}' ha sido ${status === 'approved' ? 'aprobada' : 'rechazada'}.`,
            link: { view: 'tournaments' as const },
        };

        await supabase.from('notifications').insert([
            { ...playerNotification, user_id: registrationToNotify.playerIds[0] },
            { ...playerNotification, user_id: registrationToNotify.playerIds[1] },
        ]);
        
    }, [showToast]);

    const handleGenerateGroupsForTournament = useCallback(async (tournamentId: string) => {
        if (!supabase) return;
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament) return;

        const groups = createGroups(tournament.teams, tournament.teamsPerGroup);
        const updatedTournamentData = {
            ...tournament,
            data: { ...tournament.data, groups },
            status: 'Fase de Grupos' as 'Fase de Grupos',
        };
        handleUpdateTournament(updatedTournamentData);
    }, [tournaments, handleUpdateTournament]);

    const handleAuthNavigate = (destination: 'player-login' | 'club-login' | 'player-signup' | 'club-signup') => {
        setView(destination);
    };
    
    const handleUpdateClubProfile = useCallback(async (updatedProfile: ClubProfileData) => {
        if (!supabase || !loggedInClub) return;

        // 1. Handle Photo Uploads
        const finalPhotos = await Promise.all(
            updatedProfile.photos.map(async (photo) => {
                if (photo.startsWith('data:image')) {
                    const blob = dataURLtoBlob(photo);
                    if (blob) {
                        const filePath = `gallery/${loggedInClub.id}/${Date.now()}.png`;
                        await supabase.storage.from('club-photos').upload(filePath, blob, { upsert: true });
                        const { data: { publicUrl } } = supabase.storage.from('club-photos').getPublicUrl(filePath);
                        return publicUrl;
                    }
                }
                return photo;
            })
        );
        
        // 2. Prepare profile data for DB
        const profileToUpdate = {
            name: updatedProfile.name,
            country: updatedProfile.country,
            state: updatedProfile.state,
            city: updatedProfile.city,
            opening_time: updatedProfile.openingTime,
            closing_time: updatedProfile.closingTime,
            opening_days: updatedProfile.openingDays,
            status: updatedProfile.status,
            turn_duration: updatedProfile.turnDuration,
            has_buffet: updatedProfile.hasBuffet,
            photos: finalPhotos,
        };

        // 3. Update DB
        const { data, error } = await supabase.from('club_profiles').update(profileToUpdate).eq('id', loggedInClub.id).select().single();

        if (error) {
            showToast({ text: `Error al actualizar el perfil: ${error.message}`, type: 'error'});
        } else if (data) {
            setLoggedInClub(data as ClubProfileData);
            setAllClubs(prev => prev.map(c => c.id === loggedInClub.id ? data as ClubProfileData : c));
            showToast({ text: "Perfil del club actualizado.", type: 'success'});
        }
    }, [loggedInClub, showToast]);

    const handleUpdatePlayerProfile = useCallback(async (updatedProfile: UserProfileData) => {
        if (!supabase || !userProfile) return;
        
        // 1. Handle Avatar Upload
        let finalAvatarUrl = updatedProfile.avatarUrl;
        if (updatedProfile.avatarUrl.startsWith('data:image')) {
            const blob = dataURLtoBlob(updatedProfile.avatarUrl);
            if (blob) {
                const filePath = `avatars/${userProfile.id}/${Date.now()}.png`;
                await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                finalAvatarUrl = publicUrl;
            }
        }
        
        // 2. Handle Gallery Photos Upload
        const finalPhotos = await Promise.all(
            updatedProfile.photos.map(async (photo) => {
                if (photo.startsWith('data:image')) {
                    const blob = dataURLtoBlob(photo);
                    if (blob) {
                        const filePath = `gallery/${userProfile.id}/${Date.now()}.png`;
                         // Player gallery photos can go in the 'avatars' bucket in a 'gallery' subfolder
                        await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
                        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                        return publicUrl;
                    }
                }
                return photo;
            })
        );
        
        // 3. Prepare data for DB
        const profileToUpdate = {
            first_name: updatedProfile.firstName,
            last_name: updatedProfile.lastName,
            sex: updatedProfile.sex,
            country: updatedProfile.country,
            state: updatedProfile.state,
            city: updatedProfile.city,
            availability: updatedProfile.availability,
            category: updatedProfile.category,
            avatar_url: finalAvatarUrl,
            photos: finalPhotos,
        };

        // 4. Update DB
        const { data, error } = await supabase.from('player_profiles').update(profileToUpdate).eq('id', userProfile.id).select('*, notifications(*)').single();

        if (error) {
            showToast({ text: `Error al actualizar el perfil: ${error.message}`, type: 'error'});
        } else if (data) {
            setUserProfile(data as UserProfileData);
            setAllPlayers(prev => prev.map(p => p.id === userProfile.id ? data as UserProfileData : p));
            showToast({ text: "Perfil actualizado con éxito.", type: 'success'});
        }
    }, [userProfile, showToast]);

    const handleDeletePlayerProfile = useCallback(async () => {
        if (!userProfile || !supabase) return;
        showToast({ text: "Función no implementada. Para eliminar tu cuenta, contacta a soporte.", type: 'info'});
    }, [userProfile, showToast]);
    
    const handleStartChat = useCallback((otherUserId: string) => {
        if (!userProfile && !loggedInClub) return;

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const conversationId = [currentUserId, otherUserId].sort().join('_');

        setSelectedConversationId(conversationId);
        if (userProfile) setPlayerView('chat');
        if (loggedInClub) setClubView('chat');

    }, [userProfile, loggedInClub]);

    const handleSendFriendRequest = useCallback(async (toId: string) => {
        if (!userProfile || !supabase) return;
        
        const targetUser = allPlayers.find(p => p.id === toId);
        if (!targetUser) return;
        if (userProfile.friends.includes(toId)) {
            showToast({ text: "Ya sois amigos.", type: 'info'});
            return;
        }
        
        const newNotification = {
            type: 'friend_request' as const,
            title: 'Nueva solicitud de amistad',
            message: `${userProfile.firstName} ${userProfile.lastName} quiere ser tu amigo.`,
            user_id: toId,
            read: false,
            payload: { fromId: userProfile.id }
        };

        const { error } = await supabase.from('notifications').insert(newNotification);
        if (error) {
            showToast({ text: `Error al enviar la solicitud: ${error.message}`, type: 'error'});
        } else {
            showToast({ text: "¡Solicitud de amistad enviada!", type: 'success'});
        }
    }, [userProfile, allPlayers, showToast]);
    
    const handleAcceptFriendRequest = useCallback(async (fromId: string) => {
        if (!userProfile || !supabase) return;

        const updatedFriends = [...userProfile.friends, fromId];
        const { error: userError } = await supabase
            .from('player_profiles')
            .update({ friends: updatedFriends })
            .eq('id', userProfile.id);

        if (userError) {
            showToast({ text: `Error al aceptar solicitud: ${userError.message}`, type: 'error'});
            return;
        }

        const { data: otherUserData } = await supabase.from('player_profiles').select('friends').eq('id', fromId).single();
        if (otherUserData) {
            const updatedOtherUserFriends = [...otherUserData.friends, userProfile.id];
            await supabase.from('player_profiles').update({ friends: updatedOtherUserFriends }).eq('id', fromId);
        }

        const notificationToRemove = userProfile.notifications.find(n => n.type === 'friend_request' && n.payload?.fromId === fromId);
        if (notificationToRemove) {
            await supabase.from('notifications').delete().eq('id', notificationToRemove.id);
        }

        setUserProfile(prev => ({
            ...prev!,
            friends: updatedFriends,
            notifications: prev!.notifications.filter(n => n.id !== notificationToRemove?.id)
        }));

        const fromUser = allPlayers.find(p => p.id === fromId);
        if (fromUser) {
            const acceptNotification = {
                type: 'friend_accept' as const,
                title: '¡Solicitud de amistad aceptada!',
                message: `${userProfile.firstName} ${userProfile.lastName} ha aceptado tu solicitud.`,
                user_id: fromId,
            };
            await supabase.from('notifications').insert(acceptNotification);
        }
    }, [userProfile, allPlayers, showToast]);
    
    const handleDeclineFriendRequest = useCallback(async (fromId: string) => {
        if (!userProfile || !supabase) return;

        const notificationToRemove = userProfile.notifications.find(n => n.type === 'friend_request' && n.payload?.fromId === fromId);
        if (notificationToRemove) {
            await supabase.from('notifications').delete().eq('id', notificationToRemove.id);
            setUserProfile(prev => ({
                ...prev!,
                notifications: prev!.notifications.filter(n => n.id !== notificationToRemove.id)
            }));
        }
    }, [userProfile]);

    const handleRemoveFriend = useCallback(async (friendId: string) => {
        if (!userProfile || !supabase || !window.confirm("¿Seguro que quieres eliminar a este amigo?")) return;

        const updatedFriends = userProfile.friends.filter(id => id !== friendId);
        const { error: userError } = await supabase.from('player_profiles').update({ friends: updatedFriends }).eq('id', userProfile.id);

        if (userError) {
            showToast({ text: `Error al eliminar amigo: ${userError.message}`, type: 'error'});
            return;
        }

        const { data: otherUserData } = await supabase.from('player_profiles').select('friends').eq('id', friendId).single();
        if (otherUserData) {
            const updatedOtherUserFriends = otherUserData.friends.filter((id: string) => id !== userProfile.id);
            await supabase.from('player_profiles').update({ friends: updatedOtherUserFriends }).eq('id', friendId);
        }
        
        setUserProfile(prev => ({...prev!, friends: updatedFriends}));
        showToast({ text: "Amigo eliminado.", type: 'info'});
    }, [userProfile, showToast]);

    const handlePasswordReset = async (email: string) => {
        if (!supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) {
            showToast({ text: `Error: ${error.message}`, type: 'error'});
        } else {
            showToast({ text: "Se ha enviado el enlace de recuperación.", type: 'success'});
        }
    };
    
    // --- Memoized Values ---
    const activeNotifications = useMemo(() => {
        const notifications = userProfile?.notifications || loggedInClub?.notifications || [];
        return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [userProfile, loggedInClub]);

    const courtsForLoggedInClub = useMemo(() => {
        if (!loggedInClub) return [];
        return baseCourts.filter(c => c.clubId === loggedInClub.id).map(c => {
             const dateKey = selectedDate.toISOString().split('T')[0];
             const dayOfWeek = selectedDate.getDay();

             const timeSlots = generateTimeSlots(loggedInClub.openingTime, loggedInClub.closingTime, loggedInClub.turnDuration)
                 .map(slot => {
                    const singleBooking = singleBookings[dateKey]?.[c.id]?.[slot.time];
                    const fixedBooking = fixedBookings[dayOfWeek]?.[c.id]?.[slot.time];
                    const booking = singleBooking || fixedBooking;

                    if (booking) {
                        return { 
                            ...slot, 
                            status: BookingStatus.BOOKED, 
                            bookedBy: booking.playerName, 
                            bookingId: booking.id,
                            bookingType: singleBooking ? 'single' : 'fixed' as 'single' | 'fixed'
                        };
                    }
                    return slot;
                 });

            return { ...c, timeSlots };
        });
    }, [baseCourts, loggedInClub, selectedDate, singleBookings, fixedBookings]);
    
    // --- RENDER LOGIC ---

    if (isLoading) {
        return <GlobalLoader />;
    }

    if (userProfile) {
        let content;
        if (selectedClubIdForPlayerView) {
            const selectedClub = allClubs.find(c => c.id === selectedClubIdForPlayerView);
            const courtsForSelectedClub = baseCourts.filter(court => court.clubId === selectedClubIdForPlayerView).map(c => {
                 const dateKey = selectedDate.toISOString().split('T')[0];
                 const dayOfWeek = selectedDate.getDay();
                 const timeSlots = generateTimeSlots(selectedClub!.openingTime, selectedClub!.closingTime, selectedClub!.turnDuration)
                     .map(slot => {
                         const singleBooking = singleBookings[dateKey]?.[c.id]?.[slot.time];
                         const fixedBooking = fixedBookings[dayOfWeek]?.[c.id]?.[slot.time];
                         const booking = singleBooking || fixedBooking;
                         if (booking) {
                             return { ...slot, status: BookingStatus.BOOKED, bookedBy: booking.playerName, bookingId: booking.id, bookingType: singleBooking ? 'single' : 'fixed' as 'single' | 'fixed' };
                         }
                         return slot;
                     });
                 return { ...c, timeSlots };
            });

            content = selectedClub ? <ClubDetailPage 
                club={selectedClub} 
                courts={courtsForSelectedClub}
                onSlotClick={handleSlotClick}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onBack={() => setSelectedClubIdForPlayerView(null)}
            /> : null;
        } else {
             switch (playerView) {
                case 'home':
                    content = <PlayerHomePage 
                                userProfile={userProfile} 
                                allClubs={allClubs} 
                                onSelectClub={setSelectedClubIdForPlayerView} 
                              />;
                    break;
                case 'tournaments':
                    content = <PlayerTournamentsPage 
                                currentUser={userProfile}
                                tournaments={tournaments} 
                                clubs={allClubs} 
                                allPlayers={allPlayers}
                                onRegister={handleTournamentRegistrationRequest}
                              />;
                    break;
                case 'community':
                    content = <CommunityPage 
                                currentUser={userProfile} 
                                allPlayers={allPlayers} 
                                allClubs={allClubs}
                                onSendFriendRequest={handleSendFriendRequest}
                                onStartChat={handleStartChat}
                              />;
                    break;
                case 'chat':
                     if (selectedConversationId) {
                        content = <ConversationPage 
                                    conversationId={selectedConversationId}
                                    messages={messages}
                                    currentUserId={userProfile.id}
                                    allUsers={[...allPlayers, ...allClubs]}
                                    onSendMessage={handleSendMessage}
                                    onBack={() => setSelectedConversationId(null)}
                                  />;
                    } else {
                        content = <ChatListPage 
                                    messages={messages} 
                                    currentUserId={userProfile.id} 
                                    allUsers={[...allPlayers, ...allClubs]}
                                    onSelectConversation={handleStartChat}
                                    onDeleteConversation={handleDeleteConversation}
                                  />;
                    }
                    break;
                case 'profile':
                    content = <PlayerProfilePage 
                                profile={userProfile} 
                                allPlayers={allPlayers}
                                onUpdateProfile={handleUpdatePlayerProfile}
                                onDeleteProfile={handleDeletePlayerProfile}
                                onStartChat={handleStartChat}
                                onRemoveFriend={handleRemoveFriend}
                              />;
                    break;
                default:
                    content = <PlayerHomePage userProfile={userProfile} allClubs={allClubs} onSelectClub={setSelectedClubIdForPlayerView} />;
            }
        }
        
        return (
            <>
                <Header 
                    onLogout={handleLogout}
                    notifications={activeNotifications}
                    isPanelOpen={isNotificationsPanelOpen}
                    onTogglePanel={() => setIsNotificationsPanelOpen(!isNotificationsPanelOpen)}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                    onAcceptFriendRequest={handleAcceptFriendRequest}
                    onDeclineFriendRequest={handleDeclineFriendRequest}
                />
                <main className="container mx-auto p-4 pb-24">
                    {content}
                </main>
                <BottomNavBar 
                    activeView={playerView} 
                    setView={setPlayerView} 
                    unreadMessageCount={messages.filter(m => m.receiverId === userProfile.id && !m.read).length} 
                />
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
                <Toast message={toast} onClose={() => setToast(null)} />
            </>
        );
    }
    
    if (loggedInClub) {
        let content;
         if (selectedTournamentId) {
             const tournament = tournaments.find(t => t.id === selectedTournamentId);
             content = tournament ? <TournamentDetailPage 
                tournament={tournament}
                onUpdateTournament={handleUpdateTournament}
                onBack={() => setSelectedTournamentId(null)}
                onRegistrationAction={handleRegistrationAction}
                onGenerateGroups={handleGenerateGroupsForTournament}
             /> : <p>Cargando torneo...</p>;
         } else {
              content = <ClubDashboard
                clubProfile={loggedInClub}
                onUpdateProfile={handleUpdateClubProfile}
                onDeleteProfile={async () => {
                    await supabase?.auth.signOut();
                    showToast({text: "Función de eliminar no implementada.", type: 'info'});
                }}
                tournaments={tournaments.filter(t => t.clubId === loggedInClub.id)}
                rankings={rankings}
                onCreateTournament={handleCreateTournament}
                onSelectTournament={setSelectedTournamentId}
                courts={courtsForLoggedInClub}
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
                setView={setClubView}
                onStartChat={handleStartChat}
            />;
         }

        return (
             <>
                <Header 
                    onLogout={handleLogout}
                    notifications={activeNotifications}
                    isPanelOpen={isNotificationsPanelOpen}
                    onTogglePanel={() => setIsNotificationsPanelOpen(!isNotificationsPanelOpen)}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                    onAcceptFriendRequest={() => {}}
                    onDeclineFriendRequest={() => {}}
                />
                <main className="container mx-auto p-4">
                    {content}
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
                <Toast message={toast} onClose={() => setToast(null)} />
            </>
        )
    }

    // Auth screens
    switch (view) {
        case 'player-login':
            return <PlayerLogin onLogin={handlePlayerLogin} onBack={() => setView('auth')} onForgotPassword={() => setView('forgot-password')} />;
        case 'club-login':
            return <ClubLogin onLogin={handleClubLogin} onBack={() => setView('auth')} onForgotPassword={() => setView('forgot-password')}/>;
        case 'player-signup':
            return <PlayerRegistration onRegister={handlePlayerRegister} onBack={() => setView('auth')} />;
        case 'club-signup':
            return <ClubRegistration onRegister={handleClubRegister} onBack={() => setView('auth')} />;
        case 'forgot-password':
            return <ForgotPassword onRequest={handlePasswordReset} onBack={() => setView('auth')} />;
        case 'auth':
        default:
            return <AuthScreen onNavigate={handleAuthNavigate} />;
    }
};