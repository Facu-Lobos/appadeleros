
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfileData, ClubProfileData, CourtData, PublicMatch, Ranking, ChatMessage, AppView, PlayerAppView, ClubAppView, Notification, NotificationType, ToastMessage, Booking, Database, Tournament, Json, TournamentRegistration } from '../types';

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


type useAppCoreProps = {
    setIsLoading: (loading: boolean) => void;
    showToast: (message: ToastMessage) => void;
}
export const useAppCore = ({ setIsLoading, showToast }: useAppCoreProps) => {

    const [allPlayers, setAllPlayers] = useState<UserProfileData[]>([]);
    const [allClubs, setAllClubs] = useState<ClubProfileData[]>([]);
    const [baseCourts, setBaseCourts] = useState<CourtData[]>([]);
    const [publicMatches, setPublicMatches] = useState<PublicMatch[]>([]);
    const [rankings, setRankings] = useState<Ranking[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [initialTournaments, setInitialTournaments] = useState<Tournament[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [view, setView] = useState<AppView>('auth');
    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
    const [loggedInClub, setLoggedInClub] = useState<ClubProfileData | null>(null);
    
    const [playerView, setPlayerView] = useState<PlayerAppView>('home');
    const [clubView, setClubView] = useState<ClubAppView>('tournaments');

    const [selectedClubIdForPlayerView, setSelectedClubIdForPlayerView] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

    const clearUserSession = useCallback(() => {
        setUserProfile(null);
        setLoggedInClub(null);
        setMessages([]);
        setNotifications([]);
        setView('auth');
    }, []);

    // --- Auth and Data Loading ---
    useEffect(() => {
        if (!supabase) {
            showToast({ text: "Error: No se pudo conectar a la base de datos.", type: 'error' });
            setIsLoading(false);
            return;
        }
        
        const loadUser = async (user: any) => {
            if (!user) {
                clearUserSession();
                return;
            }

            // Fetch profile and other data in a safe, sequential manner
            try {
                // Try fetching as a player first
                const { data: playerProfile, error: playerError } = await supabase.from('player_profiles').select('*').eq('id', user.id).single();
                if (playerProfile) {
                    const { data: messagesData } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
                    const { data: notificationsData } = await supabase.from('notifications').select('*').eq('user_id', user.id);
                    
                    setMessages(messagesData || []);
                    setNotifications(notificationsData || []);
                    setUserProfile(playerProfile as unknown as UserProfileData);
                    setLoggedInClub(null);
                    return;
                }

                // If not a player, try fetching as a club
                const { data: clubProfile, error: clubError } = await supabase.from('club_profiles').select('*').eq('id', user.id).single();
                if (clubProfile) {
                    const { data: messagesData } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
                    const { data: notificationsData } = await supabase.from('notifications').select('*').eq('user_id', user.id);
                    
                    setMessages(messagesData || []);
                    setNotifications(notificationsData || []);
                    setLoggedInClub(clubProfile as unknown as ClubProfileData);
                    setUserProfile(null);
                    return;
                }
                
                // If neither profile is found, log out the user.
                // This can happen if the profile creation failed or RLS is incorrect.
                showToast({ text: "No se encontró un perfil para este usuario. Se cerrará la sesión.", type: 'error' });
                await supabase.auth.signOut();

            } catch (error: any) {
                console.error("Error loading user session:", error);
                showToast({ text: `Error al cargar perfil: ${error.message}`, type: 'error' });
                await supabase.auth.signOut();
            }
        };


        const initializeApp = async () => {
            setIsLoading(true);
            try {
                // Step 1: Fetch all public data ONCE.
                const [
                    { data: clubsData, error: clubsError },
                    { data: courtsData, error: courtsError },
                    { data: playersData, error: playersError },
                    { data: rankingsData, error: rankingsError },
                    { data: tournamentsData, error: tournamentsError },
                    { data: registrationsData, error: registrationsError },
                ] = await Promise.all([
                    supabase.from('club_profiles').select('*'),
                    supabase.from('courts').select('*'),
                    supabase.from('player_profiles').select('*'),
                    supabase.from('rankings').select('*'),
                    supabase.from('tournaments').select('*'),
                    supabase.from('tournament_registrations').select('*'),
                ]);

                if (clubsError) throw clubsError;
                setAllClubs((clubsData as any) || []);

                if (courtsError) throw courtsError;
                setBaseCourts((courtsData as any) || []);
                
                if (playersError) throw playersError;
                setAllPlayers((playersData as any) || []);
                
                if (rankingsError) throw rankingsError;
                setRankings((rankingsData as any) || []);
                
                if (tournamentsError || registrationsError) throw new Error(tournamentsError?.message || registrationsError?.message);
                if (tournamentsData && registrationsData) {
                    const tournamentsWithRegistrations = tournamentsData.map(t => ({
                        ...t,
                        tournament_registrations: registrationsData.filter(r => r.tournament_id === t.id) || []
                    }));
                    setInitialTournaments(tournamentsWithRegistrations as any);
                }
                
                // Step 2: Check for an existing session and load user data.
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await loadUser(session.user);
                }
            } catch (error: any) {
                 console.error("Initialization Error:", error);
                 showToast({ text: `Error al iniciar la aplicación: ${error.message}`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();

        // Step 3: Auth listener to handle session changes.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                clearUserSession();
            } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                await loadUser(session.user);
            }
        });
    
        return () => {
            subscription?.unsubscribe();
        };
    
    }, [showToast, clearUserSession]);
    
    // --- Realtime Subscriptions ---
    useEffect(() => {
        if (!supabase) return;
        const currentUserId = userProfile?.id || loggedInClub?.id;
        
        let realtimeChannel = supabase.channel(`app-realtime-channel`);
        supabase.removeAllChannels(); // Clean up previous channels before subscribing

        if (currentUserId) {
            realtimeChannel = supabase.channel(`app-realtime-channel-user-${currentUserId}`)
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages', 
                    filter: `receiver_id=eq.${currentUserId}` 
                }, (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    setMessages(prev => [...prev, newMessage]);
                    const sender = allPlayers.find(p => p.id === newMessage.sender_id) || allClubs.find(c => c.id === newMessage.sender_id);
                    const senderName = sender ? ('first_name' in sender ? `${sender.first_name}` : sender.name) : 'un usuario';
                    showToast({text: `Nuevo mensaje de ${senderName}`, type: 'info'});
                })
                 .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'notifications', 
                    filter: `user_id=eq.${currentUserId}` 
                }, (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                    showToast({text: newNotification.title, type: 'info'});
                })
                 .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'player_profiles' 
                }, (payload) => {
                     setAllPlayers(prev => [...prev, payload.new as UserProfileData]);
                })
                .on('postgres_changes', { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'player_profiles',
                    filter: `id=eq.${currentUserId}`
                }, (payload) => {
                    const updatedProfile = payload.new as UserProfileData;
                    setUserProfile(prev => ({ 
                        ...prev!, 
                        ...updatedProfile,
                        avatar_url: updatedProfile.avatar_url ? `${updatedProfile.avatar_url.split('?')[0]}?t=${new Date().getTime()}` : null
                    }));
                })
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Realtime channel connected!');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('Realtime channel error:', err);
                    }
                });
        }
        
        return () => {
             supabase.removeChannel(realtimeChannel);
        };

    }, [userProfile?.id, loggedInClub?.id, showToast, allPlayers, allClubs]);

    const handleLogout = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            showToast({ text: `Error al cerrar sesión: ${error.message}`, type: 'error'});
        }
        // onAuthStateChange will handle resetting the state
        setIsLoading(false);
    }, [showToast]);
    
    const handlePlayerLogin = useCallback(async ({ email, pass }: { email: string; pass: string }) => {
        if (!supabase) return;
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showToast({ text: error.message, type: 'error'});
        }
        setIsLoading(false);
    }, [showToast]);

    const handleClubLogin = useCallback(async ({ email, pass }: { email: string; pass: string }) => {
         if (!supabase) return;
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showToast({ text: error.message, type: 'error'});
        }
        setIsLoading(false);
    }, [showToast]);

    const handlePlayerRegister = async (profileData: Omit<UserProfileData, 'id' | 'avatar_url' | 'photos' | 'stats' | 'upcoming_matches' | 'match_history' | 'friends' | 'friendRequests' | 'notifications'>) => {
        if (!supabase) return;
        const { email, password } = profileData;

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: password!,
        });

        if (signUpError) {
            showToast({ text: signUpError.message, type: 'error' });
            return;
        }
        if (!authData.user) {
            showToast({ text: "El registro falló, por favor intenta de nuevo.", type: 'error' });
            return;
        }

        const profileToInsert: Database['public']['Tables']['player_profiles']['Insert'] = {
            id: authData.user.id,
            email: profileData.email,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            sex: profileData.sex,
            country: profileData.country,
            state: profileData.state,
            city: profileData.city,
            availability: profileData.availability,
            category: profileData.category,
            avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${profileData.first_name}+${profileData.last_name}`,
            photos: [],
            stats: { matches: 0, wins: 0, losses: 0, winRate: 0, last30DaysTrend: 0 },
            upcoming_matches: [],
            match_history: [],
            friends: [],
        };
        
        try {
            const { error: profileError } = await supabase.from('player_profiles').insert(profileToInsert);
            if (profileError) throw profileError;

            const welcomeNotification: Database['public']['Tables']['notifications']['Insert'] = {
                user_id: authData.user.id,
                type: 'welcome',
                title: '¡Bienvenido/a a APPadeleros!',
                message: 'Explora la app, busca clubes y encuentra tu próximo partido.',
                read: false,
            };
            await supabase.from('notifications').insert(welcomeNotification);

            showToast({ text: "Usuario creado, se ha enviado la confirmacion correspondiente a su mail", type: 'success' });
            setView('auth');

        } catch (error: any) {
            if (error.message && (error.message.includes('row-level security') || error.message.includes('violates row-level security policy'))) {
                console.error('Error de RLS al crear perfil de jugador:', error);
                showToast({ text: 'Error de permisos al crear perfil. Por favor, contacta a soporte.', type: 'error' });
            } else {
                console.error('Error al crear perfil de jugador:', error);
                showToast({ text: `Falló la creación del perfil: ${error.message}`, type: 'error' });
            }
        }
    };

    const handleClubRegister = async (profile: ClubProfileData, newCourts: CourtData[], photoFiles: File[]) => {
        if (!supabase) return;
        
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email: profile.email,
            password: profile.password!,
        });

        if (signUpError) {
            showToast({ text: signUpError.message, type: 'error'});
            return;
        }
        if (!user) {
            showToast({ text: "El registro falló, por favor intenta de nuevo.", type: 'error'});
            return;
        }
        
        try {
            const photoUrls = await Promise.all(
                photoFiles.map(async (file) => {
                    const filePath = `${user.id}/${Date.now()}_${file.name}`;
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
            
            const profileToInsert: Database['public']['Tables']['club_profiles']['Insert'] = {
                id: user.id,
                email: profile.email,
                member_id: profile.member_id,
                name: profile.name,
                country: profile.country,
                state: profile.state,
                city: profile.city,
                total_courts: newCourts.length,
                opening_time: profile.opening_time,
                closing_time: profile.closing_time,
                opening_days: profile.opening_days,
                status: profile.status,
                turn_duration: profile.turn_duration,
                has_buffet: profile.has_buffet,
                photos: validUrls,
            };
    
            const { error: profileError } = await supabase.from('club_profiles').insert(profileToInsert);
             if (profileError) throw profileError;
    
            const courtsToInsert: Database['public']['Tables']['courts']['Insert'][] = newCourts.map(court => ({
                id: court.id,
                name: court.name,
                type: court.type,
                location: court.location,
                surface: court.surface,
                club_id: user.id,
                club_name: profile.name
            }));
            const { error: courtsError } = await supabase.from('courts').insert(courtsToInsert);
            if (courtsError) throw courtsError;
            
            const welcomeNotification: Database['public']['Tables']['notifications']['Insert'] = {
                user_id: user.id,
                type: 'welcome' as const,
                title: `¡Bienvenido ${profile.name}!`,
                message: 'Configura tus torneos, gestiona tus pistas y haz crecer tu comunidad.',
                read: false,
            };
            await supabase.from('notifications').insert(welcomeNotification);
            showToast({ text: "Usuario creado, se ha enviado la confirmacion correspondiente a su mail", type: 'success' });
            setView('auth');
        } catch (error: any) {
             if (error.message && (error.message.includes('row-level security') || error.message.includes('violates row-level security policy'))) {
                console.error('Error de RLS al crear perfil de club:', error);
                showToast({ text: 'Error de permisos al crear perfil. Por favor, contacta a soporte.', type: 'error' });
            } else {
                console.error('Error al crear perfil de club:', error);
                showToast({ text: `Falló la creación del perfil: ${error.message}`, type: 'error' });
            }
        }
    };
    
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
        
        const update: Database['public']['Tables']['public_matches']['Update'] = { current_players: match.currentPlayers + 1 };
        await supabase.from('public_matches').update(update).eq('id', matchId);

        const newNotification: Database['public']['Tables']['notifications']['Insert'] = {
            type: 'match_join' as const,
            title: '¡Te has unido a un partido!',
            message: `Confirmada tu plaza en el partido de las ${match.time} en ${match.courtName}.`,
            user_id: userProfile.id,
            read: false,
        };
        await supabase.from('notifications').insert(newNotification);
        showToast({ text: "Te has unido al partido.", type: 'success' });

    }, [userProfile, publicMatches, showToast]);
    
    const handleSendMessage = useCallback(async (text: string) => {
        if (!selectedConversationId || !supabase || (!userProfile && !loggedInClub)) return;

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const otherUserId = selectedConversationId.replace(currentUserId, '').replace('_', '');
        
        const newMessageForDb: Database['public']['Tables']['messages']['Insert'] = {
            conversation_id: selectedConversationId,
            sender_id: currentUserId,
            receiver_id: otherUserId,
            text,
            read: false,
        };
        
        const { error } = await supabase.from('messages').insert(newMessageForDb);
        if (error) {
            showToast({ text: `Error al enviar mensaje: ${error.message}`, type: 'error' });
        }
    }, [selectedConversationId, userProfile, loggedInClub, showToast]);

    const handleDeleteConversation = useCallback(async (conversationId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación? Esta acción es irreversible.') || !supabase) {
            return;
        }
        const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
        if (error) {
             showToast({ text: `Error al eliminar chat: ${error.message}`, type: 'error' });
             return;
        }
        
        setMessages(prev => prev.filter(msg => msg.conversation_id !== conversationId));
        if (selectedConversationId === conversationId) {
            setSelectedConversationId(null);
        }
    }, [selectedConversationId, showToast]);

    const handleNotificationClick = useCallback(async (notification: Notification) => {
        if (notification.type === 'friend_request' || !supabase) return;
        
        const currentUserId = userProfile?.id || loggedInClub?.id;
        if (!currentUserId) return;

        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        
        await supabase.from('notifications').update({ read: true }).eq('id', notification.id);

        setIsNotificationsPanelOpen(false);

        if (notification.link?.view === 'chat' && notification.link.params?.conversationId) {
            const otherUserId = notification.link.params.conversationId.replace(currentUserId, "").replace("_","");
            handleStartChat(otherUserId);
        } else if (notification.link?.view === 'tournaments' && notification.link.params?.tournamentId) {
             if(loggedInClub) setClubView('tournaments');
             if (userProfile) setPlayerView('tournaments');
        }

    }, [userProfile, loggedInClub]);

    const handleMarkAllNotificationsAsRead = useCallback(async () => {
        if (!supabase) return;
        const currentUserId = userProfile?.id || loggedInClub?.id;
        if (!currentUserId) return;
        
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await supabase.from('notifications').update({ read: true }).eq('user_id', currentUserId).eq('read', false);
    }, [userProfile, loggedInClub]);

    const handleAuthNavigate = (destination: 'player-login' | 'club-login' | 'player-signup' | 'club-signup' | 'forgot-password') => {
        setView(destination);
    };
    
    const handleUpdateClubProfile = useCallback(async (updatedProfile: ClubProfileData) => {
        if (!supabase || !loggedInClub) return;

        const finalPhotos = await Promise.all(
            updatedProfile.photos.map(async (photo) => {
                if (photo.startsWith('data:image')) {
                    const blob = dataURLtoBlob(photo);
                    if (blob) {
                        const filePath = `${loggedInClub.id}/${Date.now()}.png`;
                        const { error } = await supabase.storage.from('club-photos').upload(filePath, blob, { upsert: true });
                         if (error) { console.error(error); return null; }
                        const { data: { publicUrl } } = supabase.storage.from('club-photos').getPublicUrl(filePath);
                        return publicUrl;
                    }
                }
                return photo;
            })
        );
        
        const validFinalPhotos = finalPhotos.filter(p => p !== null) as string[];

        const profileToUpdate: Database['public']['Tables']['club_profiles']['Update'] = {
            name: updatedProfile.name,
            opening_time: updatedProfile.opening_time,
            closing_time: updatedProfile.closing_time,
            opening_days: updatedProfile.opening_days,
            status: updatedProfile.status,
            turn_duration: updatedProfile.turn_duration,
            has_buffet: updatedProfile.has_buffet,
            photos: validFinalPhotos,
        };

        const { error } = await supabase.from('club_profiles').update(profileToUpdate).eq('id', loggedInClub.id);

        if (error) {
            showToast({ text: `Error al actualizar el perfil: ${error.message}`, type: 'error'});
        } else {
            const newProfileState: ClubProfileData = {
                ...loggedInClub,
                ...updatedProfile,
                photos: validFinalPhotos,
            };
            setLoggedInClub(newProfileState);
            setAllClubs(prev => prev.map(c => c.id === loggedInClub.id ? newProfileState : c));
            showToast({ text: "Perfil del club actualizado.", type: 'success'});
        }
    }, [loggedInClub, showToast]);

    const handleUpdatePlayerProfile = useCallback(async (updatedProfile: UserProfileData) => {
        if (!supabase || !userProfile) return;
        
        let finalAvatarUrl = updatedProfile.avatar_url;
        if (updatedProfile.avatar_url && updatedProfile.avatar_url.startsWith('data:image')) {
            const blob = dataURLtoBlob(updatedProfile.avatar_url);
            if (blob) {
                const filePath = `${userProfile.id}/avatar.png`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true, contentType: blob.type });
                 if (uploadError) {
                    showToast({ text: `Error al subir la nueva foto: ${uploadError.message}`, type: 'error' });
                    return; 
                }
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                finalAvatarUrl = publicUrl;
            }
        }
        
        const finalPhotos = await Promise.all(
            (updatedProfile.photos || []).map(async (photo) => {
                if (photo.startsWith('data:image')) {
                    const blob = dataURLtoBlob(photo);
                    if (blob) {
                        const filePath = `${userProfile.id}/gallery_${Date.now()}_${Math.random()}.png`;
                        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true, contentType: blob.type });
                        if (uploadError) {
                            console.error('Error al subir foto de galería:', uploadError);
                            return null;
                        }
                        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                        return publicUrl;
                    }
                }
                return photo;
            })
        );
        
        const validFinalPhotos = finalPhotos.filter(p => p !== null) as string[];

        const profileToUpdate: Database['public']['Tables']['player_profiles']['Update'] = {
            first_name: updatedProfile.first_name,
            last_name: updatedProfile.last_name,
            sex: updatedProfile.sex,
            country: updatedProfile.country,
            state: updatedProfile.state,
            city: updatedProfile.city,
            availability: updatedProfile.availability,
            category: updatedProfile.category,
            avatar_url: finalAvatarUrl?.split('?')[0],
            photos: validFinalPhotos,
        };

        const { data, error } = await supabase.from('player_profiles').update(profileToUpdate).eq('id', userProfile.id).select().single();

        if (error) {
            showToast({ text: `Error al actualizar el perfil: ${error.message}`, type: 'error'});
        } else if (data) {
            const newProfileState: UserProfileData = data as any;
            setUserProfile({
                ...newProfileState,
                // Force a re-render with the new photo by adding a timestamp
                avatar_url: newProfileState.avatar_url ? `${newProfileState.avatar_url}?t=${new Date().getTime()}` : null,
            });
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
        if (userProfile.friends && userProfile.friends.includes(toId)) {
            showToast({ text: "Ya sois amigos.", type: 'info'});
            return;
        }
        
        const newNotification: Database['public']['Tables']['notifications']['Insert'] = {
            type: 'friend_request' as const,
            title: 'Nueva solicitud de amistad',
            message: `${userProfile.first_name} ${userProfile.last_name} quiere ser tu amigo.`,
            user_id: toId,
            payload: { fromId: userProfile.id } as unknown as Json,
            read: false,
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

        const updatedFriends = [...(userProfile.friends || []), fromId];
        const { error: userError } = await supabase.from('player_profiles').update({ friends: updatedFriends }).eq('id', userProfile.id);

        if (userError) {
            showToast({ text: `Error al aceptar solicitud: ${userError.message}`, type: 'error'});
            return;
        }

        const { data: otherUserData } = await supabase.from('player_profiles').select('friends').eq('id', fromId).single();
        if (otherUserData && otherUserData.friends) {
            const updatedOtherUserFriends = [...otherUserData.friends, userProfile.id];
            await supabase.from('player_profiles').update({ friends: updatedOtherUserFriends }).eq('id', fromId);
        }

        const notificationToRemove = notifications.find(n => n.type === 'friend_request' && n.payload?.fromId === fromId);
        if (notificationToRemove) {
            await supabase.from('notifications').update({read: true}).eq('id', notificationToRemove.id);
            setNotifications(prev => prev.filter(n => n.id !== notificationToRemove.id));
        }
        
        setUserProfile(prev => ({ ...prev!, friends: updatedFriends }));
        
        const acceptNotification: Database['public']['Tables']['notifications']['Insert'] = {
            type: 'friend_accept' as const,
            title: '¡Solicitud de amistad aceptada!',
            message: `${userProfile.first_name} ${userProfile.last_name} ha aceptado tu solicitud.`,
            user_id: fromId,
            read: false,
        };
        await supabase.from('notifications').insert(acceptNotification);

    }, [userProfile, showToast, notifications]);
    
    const handleDeclineFriendRequest = useCallback(async (fromId: string) => {
        if (!userProfile || !supabase) return;

        const notificationToRemove = notifications.find(n => n.type === 'friend_request' && n.payload?.fromId === fromId);
        if (notificationToRemove) {
            await supabase.from('notifications').delete().eq('id', notificationToRemove.id);
            setNotifications(prev => prev.filter(n => n.id !== notificationToRemove.id));
        }
    }, [userProfile, notifications]);

    const handleRemoveFriend = useCallback(async (friendId: string) => {
        if (!userProfile || !supabase || !window.confirm("¿Seguro que quieres eliminar a este amigo?")) return;

        const updatedFriends = userProfile.friends ? userProfile.friends.filter(id => id !== friendId) : [];
        const { error: userError } = await supabase.from('player_profiles').update({ friends: updatedFriends }).eq('id', userProfile.id);

        if (userError) {
            showToast({ text: `Error al eliminar amigo: ${userError.message}`, type: 'error'});
            return;
        }

        const { data: otherUserData } = await supabase.from('player_profiles').select('friends').eq('id', friendId).single();
        if (otherUserData && otherUserData.friends) {
            const updatedOtherUserFriends = (otherUserData.friends || []).filter((id: string) => id !== userProfile.id);
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
    
    const activeNotifications = useMemo(() => {
        return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notifications]);


    return {
        allPlayers,
        allClubs,
        baseCourts,
        publicMatches,
        rankings,
        setRankings,
        messages,
        setMessages,
        initialTournaments,
        view,
        setView,
        userProfile,
        setUserProfile,
        loggedInClub,
        setLoggedInClub,
        notifications: activeNotifications, 
        playerView,
        setPlayerView,
        clubView,
        setClubView,
        selectedClubIdForPlayerView,
        setSelectedClubIdForPlayerView,
        selectedConversationId,
        setSelectedConversationId,
        isNotificationsPanelOpen,
        setIsNotificationsPanelOpen,
        handleLogout,
        handlePlayerLogin,
        handleClubLogin,
        handlePlayerRegister,
        handleClubRegister,
        handleJoinMatch,
        handleSendMessage,
        handleDeleteConversation,
        handleNotificationClick,
        handleMarkAllNotificationsAsRead,
        handleAuthNavigate,
        handleUpdateClubProfile,
        handleUpdatePlayerProfile,
        handleDeletePlayerProfile,
        handleStartChat,
        handleSendFriendRequest,
        handleAcceptFriendRequest,
        handleDeclineFriendRequest,
        handleRemoveFriend,
        handlePasswordReset,
        activeNotifications,
    };
}