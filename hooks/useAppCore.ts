
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfileData, ClubProfileData, CourtData, PublicMatch, Ranking, ChatMessage, AppView, PlayerAppView, ClubAppView, Notification, ToastMessage, Database, Tournament, Json } from '../types';

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

    // Global state
    const [allPlayers, setAllPlayers] = useState<UserProfileData[]>([]);
    const [allClubs, setAllClubs] = useState<ClubProfileData[]>([]);
    const [baseCourts, setBaseCourts] = useState<CourtData[]>([]);
    const [publicMatches, setPublicMatches] = useState<PublicMatch[]>([]);
    const [rankings, setRankings] = useState<Ranking[]>([]);
    const [initialTournaments, setInitialTournaments] = useState<Tournament[]>([]);
    
    // User-specific state
    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
    const [loggedInClub, setLoggedInClub] = useState<ClubProfileData | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // View state
    const [view, setView] = useState<AppView>('auth');
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
        setSelectedConversationId(null);
        setView('auth');
        setPlayerView('home');
        setClubView('tournaments');
    }, []);
    
    // --- AUTH ACTIONS ---
    const handleLogout = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) showToast({ text: `Error al cerrar sesión: ${error.message}`, type: 'error'});
        clearUserSession();
        setIsLoading(false);
    }, [showToast, clearUserSession]);

    // --- Main Initialization and Auth Listener ---
    useEffect(() => {
        if (!supabase) {
            showToast({ text: "Error: No se pudo conectar a la base de datos.", type: 'error' });
            setIsLoading(false);
            return;
        }

        const fetchAllData = async () => {
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

            if (clubsError || courtsError || playersError || rankingsError || tournamentsError || registrationsError) {
                console.error("Error fetching public data", { clubsError, courtsError, playersError, rankingsError, tournamentsError, registrationsError });
                throw new Error("Error al cargar los datos públicos.");
            }
            
            setAllClubs((clubsData as any[]) || []);
            setBaseCourts((courtsData as any[]) || []);
            setAllPlayers((playersData as any[]) || []);
            setRankings((rankingsData as any[]) || []);

            const tournamentsWithRegistrations = (tournamentsData || []).map(t => ({
                ...t,
                tournament_registrations: (registrationsData || []).filter(r => r.tournament_id === t.id)
            }));
            setInitialTournaments(tournamentsWithRegistrations as any[]);
        };

        const loadUserSession = async (user: any) => {
            if (!supabase || !user) return;
            
            // Fetch profile
            const { data: playerProfile, error: playerError } = await supabase.from('player_profiles').select('*').eq('id', user.id).single();

            if (playerProfile) {
                const { data: notificationsData, error: notificationsError } = await supabase.from('notifications').select('*').eq('user_id', user.id);
                const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

                if (playerError || notificationsError || messagesError) {
                   throw new Error('Failed to load player data.');
                }
                
                setUserProfile({ ...playerProfile, notifications: notificationsData || [] } as unknown as UserProfileData);
                setMessages(messagesData || []);
                setNotifications(notificationsData || []);
                setLoggedInClub(null);
                return;
            }

            const { data: clubProfile, error: clubError } = await supabase.from('club_profiles').select('*').eq('id', user.id).single();
            if (clubProfile) {
                 const { data: notificationsData, error: notificationsError } = await supabase.from('notifications').select('*').eq('user_id', user.id);
                 const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
                
                 if (clubError || notificationsError || messagesError) {
                    throw new Error('Failed to load club data.');
                 }

                setLoggedInClub({ ...clubProfile, notifications: notificationsData || [] } as unknown as ClubProfileData);
                setMessages(messagesData || []);
                setNotifications(notificationsData || []);
                setUserProfile(null);
                return;
            }
            
            showToast({ text: "No se encontró un perfil para este usuario. Se cerrará la sesión.", type: 'error' });
            await handleLogout();
        };

        const initializeApp = async () => {
            try {
                await fetchAllData();
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) throw sessionError;
                
                if (session?.user) {
                    await loadUserSession(session.user);
                }
            } catch (error: any) {
                 if (error.message.includes("Invalid Refresh Token")) {
                    console.warn("Invalid refresh token. Signing out.");
                    await handleLogout();
                } else {
                    console.error("Error de inicialización:", error);
                    showToast({ text: `Error al iniciar: ${error.message}`, type: 'error' });
                }
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeApp();
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setIsLoading(true);
            if (event === 'SIGNED_OUT') {
                clearUserSession();
            } else if (session?.user) {
                await loadUserSession(session.user);
            }
            setIsLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []); // Run only once on mount

    // --- Realtime Subscriptions ---
    useEffect(() => {
        if (!supabase) return;
        const currentUserId = userProfile?.id || loggedInClub?.id;
        
        if (!currentUserId) {
            supabase.removeAllChannels();
            return;
        }

        const userChannel = supabase.channel(`user-${currentUserId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUserId}` }, (payload) => {
                const newMessage = payload.new as ChatMessage;
                setMessages(prev => [...prev, newMessage]);
                const sender = allPlayers.find(p => p.id === newMessage.sender_id) || allClubs.find(c => c.id === newMessage.sender_id);
                const senderName = sender ? ('first_name' in sender ? `${sender.first_name}` : sender.name) : 'un usuario';
                showToast({text: `Nuevo mensaje de ${senderName}`, type: 'info'});
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` }, (payload) => {
                const newNotification = payload.new as Notification;
                setNotifications(prev => [newNotification, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                showToast({text: newNotification.title, type: 'info'});
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player_profiles' }, payload => {
                const updatedProfile = payload.new as UserProfileData;
                setAllPlayers(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
                if (userProfile?.id === updatedProfile.id) {
                    setUserProfile(prev => ({...prev!, ...updatedProfile}));
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_profiles' }, payload => {
                setAllPlayers(prev => [...prev, payload.new as UserProfileData]);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  console.log(`Subscribed to user channel: ${currentUserId}`);
                }
              });

        return () => {
            supabase.removeChannel(userChannel);
        }
    }, [userProfile?.id, loggedInClub?.id, allPlayers, allClubs, showToast]);

    const handlePlayerLogin = useCallback(async ({ email, pass }: { email: string; pass: string }) => {
        if (!supabase) return;
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showToast({ text: error.message, type: 'error'});
            setIsLoading(false);
        }
    }, [showToast]);

    const handleClubLogin = useCallback(async ({ email, pass }: { email: string; pass: string }) => {
         if (!supabase) return;
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            showToast({ text: error.message, type: 'error'});
            setIsLoading(false);
        }
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

            showToast({ text: "Usuario creado, se ha enviado la confirmacion correspondiente a su mail", type: 'success' });
            setView('auth');

        } catch (error: any) {
             if (error.message?.includes('row-level security')) {
                console.error('RLS Error creating player profile:', error);
                showToast({ text: 'Error de permisos al crear perfil. Contacta a soporte.', type: 'error' });
            } else {
                console.error('Error creating player profile:', error);
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
                photoFiles.map(async (file, index) => {
                    const filePath = `${user.id}/gallery/${Date.now()}_${index}.png`;
                    const { error: uploadError } = await supabase.storage.from('club-photos').upload(filePath, file);
                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('club-photos').getPublicUrl(filePath);
                    return publicUrl;
                })
            );
            
            const profileToInsert: Database['public']['Tables']['club_profiles']['Insert'] = {
                id: user.id, email: profile.email, member_id: profile.member_id, name: profile.name,
                country: profile.country, state: profile.state, city: profile.city,
                total_courts: newCourts.length, opening_time: profile.opening_time,
                closing_time: profile.closing_time, opening_days: profile.opening_days,
                status: profile.status, turn_duration: profile.turn_duration,
                has_buffet: profile.has_buffet, photos: photoUrls,
            };
    
            const { error: profileError } = await supabase.from('club_profiles').insert(profileToInsert);
             if (profileError) throw profileError;
    
            const courtsToInsert: Database['public']['Tables']['courts']['Insert'][] = newCourts.map((court, i) => ({
                id: `court-${user.id}-${i}`, name: court.name, type: court.type, location: court.location,
                surface: court.surface, club_id: user.id, club_name: profile.name
            }));
            const { error: courtsError } = await supabase.from('courts').insert(courtsToInsert);
            if (courtsError) throw courtsError;
            
            showToast({ text: "Usuario creado, se ha enviado la confirmacion correspondiente a su mail", type: 'success' });
            setView('auth');
        } catch (error: any) {
             if (error.message?.includes('row-level security')) {
                console.error('RLS Error creating club profile:', error);
                showToast({ text: 'Error de permisos al crear perfil. Contacta a soporte.', type: 'error' });
            } else {
                console.error('Error creating club profile:', error);
                showToast({ text: `Falló la creación del perfil: ${error.message}`, type: 'error' });
            }
        }
    };
    
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
                finalAvatarUrl = publicUrl ? `${publicUrl}?t=${new Date().getTime()}` : null;
            }
        }
        
        const profileToUpdate: Database['public']['Tables']['player_profiles']['Update'] = {
            first_name: updatedProfile.first_name, last_name: updatedProfile.last_name,
            sex: updatedProfile.sex, country: updatedProfile.country, state: updatedProfile.state,
            city: updatedProfile.city, availability: updatedProfile.availability,
            category: updatedProfile.category, avatar_url: finalAvatarUrl
        };

        const { data, error } = await supabase.from('player_profiles').update(profileToUpdate).eq('id', userProfile.id).select().single();

        if (error) {
            showToast({ text: `Error al actualizar el perfil: ${error.message}`, type: 'error'});
        } else if (data) {
            setUserProfile(data as any);
            showToast({ text: "Perfil actualizado con éxito.", type: 'success'});
        }
    }, [userProfile, showToast]);

    const handleStartChat = useCallback((otherUserId: string) => {
        const currentUserId = userProfile?.id || loggedInClub?.id;
        if (!currentUserId) return;
        const conversationId = [currentUserId, otherUserId].sort().join('_');
        setSelectedConversationId(conversationId);
        if (userProfile) setPlayerView('chat');
        if (loggedInClub) setClubView('chat');
    }, [userProfile, loggedInClub]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (!selectedConversationId || !supabase) return;
        const currentUserId = userProfile?.id || loggedInClub?.id;
        if (!currentUserId) return;

        const otherUserId = selectedConversationId.split('_').find(id => id !== currentUserId);
        if (!otherUserId) {
            showToast({ text: 'Error: No se pudo determinar el destinatario.', type: 'error'});
            return;
        }

        const { error } = await supabase.from('messages').insert({
            conversation_id: selectedConversationId,
            sender_id: currentUserId,
            receiver_id: otherUserId,
            text,
        });
        if (error) showToast({ text: `Error al enviar mensaje: ${error.message}`, type: 'error' });
    }, [selectedConversationId, userProfile, loggedInClub, showToast]);
    
    const handleSendFriendRequest = useCallback(async (toId: string) => {
        if (!userProfile || !supabase) return;
        if (userProfile.friends?.includes(toId)) {
            showToast({ text: "Ya sois amigos.", type: 'info'});
            return;
        }
        
        const { error } = await supabase.from('notifications').insert({
            type: 'friend_request', title: 'Nueva solicitud de amistad',
            message: `${userProfile.first_name} ${userProfile.last_name} quiere ser tu amigo.`,
            user_id: toId, payload: { fromId: userProfile.id } as unknown as Json,
        });

        if (error) {
            showToast({ text: `Error al enviar la solicitud: ${error.message}`, type: 'error'});
        } else {
            showToast({ text: "¡Solicitud de amistad enviada!", type: 'success'});
        }
    }, [userProfile, showToast]);

    const handleAcceptFriendRequest = useCallback(async (fromId: string) => {
        if (!userProfile || !supabase) return;

        // Add to current user's friends
        const updatedUserFriends = [...(userProfile.friends || []), fromId];
        const { error: userError } = await supabase.from('player_profiles').update({ friends: updatedUserFriends }).eq('id', userProfile.id);
        
        // Add to the other user's friends
        const { data: otherUserData } = await supabase.from('player_profiles').select('friends').eq('id', fromId).single();
        const updatedOtherUserFriends = [...(otherUserData?.friends || []), userProfile.id];
        const { error: otherUserError } = await supabase.from('player_profiles').update({ friends: updatedOtherUserFriends }).eq('id', fromId);

        if (userError || otherUserError) {
             showToast({ text: `Error al aceptar la amistad.`, type: 'error'});
             return;
        }

        setUserProfile(prev => ({ ...prev!, friends: updatedUserFriends }));

        // Mark original notification as read/handled and remove it
        const notificationToRemove = notifications.find(n => n.type === 'friend_request' && n.payload?.fromId === fromId);
        if (notificationToRemove) {
            await supabase.from('notifications').delete().eq('id', notificationToRemove.id);
            setNotifications(prev => prev.filter(n => n.id !== notificationToRemove.id));
        }
        
        await supabase.from('notifications').insert({
            type: 'friend_accept', title: '¡Solicitud de amistad aceptada!',
            message: `${userProfile.first_name} ${userProfile.last_name} ha aceptado tu solicitud.`,
            user_id: fromId,
        });

    }, [userProfile, showToast, notifications]);

    const handleDeclineFriendRequest = useCallback(async (fromId: string) => {
        if (!userProfile || !supabase) return;
        const notificationToRemove = notifications.find(n => n.type === 'friend_request' && n.payload?.fromId === fromId);
        if (notificationToRemove) {
            await supabase.from('notifications').delete().eq('id', notificationToRemove.id);
            setNotifications(prev => prev.filter(n => n.id !== notificationToRemove.id));
        }
    }, [userProfile, notifications]);

    const handleNotificationClick = useCallback(async (notification: Notification) => {
        if (!supabase) return;
        if (!notification.read) {
            await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read: true} : n));
        }
        if (notification.link?.view) {
            if (notification.link.params?.conversationId) {
                setSelectedConversationId(notification.link.params.conversationId);
            }
            if (notification.link.params?.tournamentId && loggedInClub) {
                // This logic is in useTournamentManager, which is fine
            }
            if (userProfile) setPlayerView(notification.link.view as PlayerAppView);
            if (loggedInClub) setClubView(notification.link.view as ClubAppView);
        }
        setIsNotificationsPanelOpen(false);
    }, [userProfile, loggedInClub]);

    const handleMarkAllNotificationsAsRead = useCallback(async () => {
        if (!supabase) return;
        const currentUserId = userProfile?.id || loggedInClub?.id;
        if (!currentUserId) return;
        
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if(unreadIds.length === 0) return;

        const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
        if (error) {
            showToast({text: 'Error al marcar las notificaciones.', type: 'error'});
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    }, [notifications, userProfile, loggedInClub, showToast]);

    const handleAuthNavigate = (destination: AppView) => setView(destination);
    const handleUpdateClubProfile = useCallback(async (updatedProfile: ClubProfileData) => {
        if (!supabase || !loggedInClub) return;
        // Simplified version for now
        const { error } = await supabase.from('club_profiles').update(updatedProfile).eq('id', loggedInClub.id);
        if (error) {
            showToast({ text: 'Error al actualizar perfil del club', type: 'error'});
        } else {
            setLoggedInClub(updatedProfile);
            showToast({ text: 'Perfil del club actualizado', type: 'success'});
        }
    }, [loggedInClub, showToast]);
    
    const handleDeletePlayerProfile = useCallback(async () => {
        // This would need a Supabase Edge Function to delete auth user and profile together securely.
        showToast({ text: 'Función de eliminar no implementada.', type: 'info'});
    }, [showToast]);

    const handleRemoveFriend = useCallback(async (friendId: string) => {
        if (!userProfile || !supabase || !userProfile.friends) return;
        
        const newFriends = userProfile.friends.filter(id => id !== friendId);
        const { error: userError } = await supabase.from('player_profiles').update({ friends: newFriends }).eq('id', userProfile.id);
        
        const { data: otherUserData } = await supabase.from('player_profiles').select('friends').eq('id', friendId).single();
        const newOtherUserFriends = (otherUserData?.friends || []).filter(id => id !== userProfile.id);
        const { error: otherUserError } = await supabase.from('player_profiles').update({ friends: newOtherUserFriends }).eq('id', friendId);

        if (userError || otherUserError) {
             showToast({ text: 'Error al eliminar amigo.', type: 'error'});
        } else {
            setUserProfile(prev => ({...prev!, friends: newFriends}));
            showToast({ text: 'Amigo eliminado.', type: 'success'});
        }
    }, [userProfile, showToast]);

    const handlePasswordReset = async (email: string) => {
        if(!supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) {
            showToast({ text: error.message, type: 'error'});
        } else {
            showToast({ text: 'Se ha enviado un correo de recuperación.', type: 'info'});
        }
    };
    
    return {
        allPlayers, allClubs, baseCourts, publicMatches, rankings, setRankings,
        messages, initialTournaments, view, setView, userProfile,
        loggedInClub, notifications, playerView, setPlayerView, clubView, setClubView,
        selectedClubIdForPlayerView, setSelectedClubIdForPlayerView,
        selectedConversationId, setSelectedConversationId, isNotificationsPanelOpen,
        setIsNotificationsPanelOpen, handleLogout, handlePlayerLogin, handleClubLogin,
        handlePlayerRegister, handleClubRegister, handleSendMessage, handleNotificationClick,
        handleMarkAllNotificationsAsRead, handleAuthNavigate, handleUpdateClubProfile,
        handleUpdatePlayerProfile, handleDeletePlayerProfile, handleStartChat,
        handleSendFriendRequest, handleAcceptFriendRequest, handleDeclineFriendRequest,
        handleRemoveFriend, handlePasswordReset,
        activeNotifications: notifications, // For prop drilling
        handleDeleteConversation: () => showToast({text: "Función no implementada", type: "info"}),
    };
}