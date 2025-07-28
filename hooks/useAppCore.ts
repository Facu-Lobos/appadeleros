

import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfileData, ClubProfileData, CourtData, PublicMatch, Ranking, ChatMessage, AppView, PlayerAppView, ClubAppView, Notification, NotificationType, ToastMessage, Booking, Database } from '../types';

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
    const [initialTournaments, setInitialTournaments] = useState([]);
    
    const [view, setView] = useState<AppView>('auth');
    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
    const [loggedInClub, setLoggedInClub] = useState<ClubProfileData | null>(null);
    
    const [playerView, setPlayerView] = useState<PlayerAppView>('home');
    const [clubView, setClubView] = useState<ClubAppView>('tournaments');

    const [selectedClubIdForPlayerView, setSelectedClubIdForPlayerView] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

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
                supabase.from('tournaments').select('*'),
                supabase.from('player_profiles').select('*'),
                supabase.from('public_matches').select('*'),
                supabase.from('rankings').select('*'),
            ]);

            if (clubsData) setAllClubs(clubsData as any as ClubProfileData[]);
            if (courtsData) setBaseCourts(courtsData as any as CourtData[]);
            if (tournamentsData) setInitialTournaments(tournamentsData as any);
            if (playersData) setAllPlayers(playersData as any as UserProfileData[]);
            if (publicMatchesData) setPublicMatches(publicMatchesData as PublicMatch[]);
            if (rankingsData) setRankings(rankingsData as Ranking[]);
        };
        
        fetchAllData().finally(() => setIsLoading(false));


        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                // Fetch user-specific data upon login
                const { data: messagesData } = await supabase.from('messages').select('*').or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
                if (messagesData) setMessages(messagesData as any as ChatMessage[]);

                const { data: playerProfile } = await supabase.from('player_profiles').select('*, notifications(*)').eq('id', session.user.id).single();
                if (playerProfile) {
                    setUserProfile(playerProfile as any as UserProfileData);
                    setLoggedInClub(null);
                    setPlayerView('home');
                    setView(undefined as any);
                    return;
                }

                const { data: clubProfile } = await supabase.from('club_profiles').select('*, notifications(*)').eq('id', session.user.id).single();
                if (clubProfile) {
                    setLoggedInClub(clubProfile as any as ClubProfileData);
                    setUserProfile(null);
                    setClubView('tournaments');
                     setView(undefined as any);
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
    }, [showToast, setIsLoading]);

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
                setMessages(prev => [...prev, payload.new as any as ChatMessage]);
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
                const newNotification = payload.new as any as Notification;
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
            email: email!,
            password: password!,
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
            email: email!,
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
        
        const profileToInsert: Database['public']['Tables']['club_profiles']['Insert'] = {
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

        const { error: profileError } = await supabase.from('club_profiles').insert([profileToInsert]);
        if (profileError) {
             showToast({ text: `Falló la creación del perfil: ${profileError.message}`, type: 'error'});
             return;
        }

        const courtsToInsert: Database['public']['Tables']['courts']['Insert'][] = newCourts.map(court => ({
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

        const newNotification: Database['public']['Tables']['notifications']['Insert'] = {
            type: 'match_join' as const,
            title: '¡Te has unido a un partido!',
            message: `Confirmada tu plaza en el partido de las ${match.time} en ${match.courtName}.`,
            user_id: userProfile.id,
        };
        await supabase.from('notifications').insert([newNotification]);
        showToast({ text: "Te has unido al partido.", type: 'success' });

    }, [userProfile, publicMatches, showToast]);
    
    const handleSendMessage = useCallback(async (text: string) => {
        if (!selectedConversationId || !supabase || (!userProfile && !loggedInClub)) return;

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const senderName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : loggedInClub!.name;
        const otherUserId = selectedConversationId.replace(currentUserId, '').replace('_', '');
        
        const newMessageForUI: ChatMessage = {
            id: Date.now(),
            conversationId: selectedConversationId,
            senderId: currentUserId,
            receiverId: otherUserId,
            text,
            timestamp: new Date().toISOString(),
            read: false
        };
        const newMessageForDb: Database['public']['Tables']['messages']['Insert'] = {
            conversation_id: selectedConversationId,
            sender_id: currentUserId,
            receiver_id: otherUserId,
            text,
        };

        setMessages(prev => [...prev, newMessageForUI]);
        await supabase.from('messages').insert([newMessageForDb]);

        const notification: Database['public']['Tables']['notifications']['Insert'] = {
            type: 'message' as const,
            title: `Nuevo mensaje de ${senderName}`,
            message: text,
            link: { view: 'chat' as const, params: { conversationId: selectedConversationId } },
            user_id: otherUserId,
        };
        await supabase.from('notifications').insert([notification]);
        
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
                // setSelectedTournamentId(notification.link.params.tournamentId); This state is in another hook now
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

    const handleAuthNavigate = (destination: 'player-login' | 'club-login' | 'player-signup' | 'club-signup') => {
        setView(destination);
    };
    
    const handleUpdateClubProfile = useCallback(async (updatedProfile: ClubProfileData) => {
        if (!supabase || !loggedInClub) return;

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
        
        const profileToUpdate: Database['public']['Tables']['club_profiles']['Update'] = {
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
            photos: finalPhotos.filter(p => p !== null) as string[],
        };

        const { data, error } = await supabase.from('club_profiles').update(profileToUpdate).eq('id', loggedInClub.id).select().single();

        if (error) {
            showToast({ text: `Error al actualizar el perfil: ${error.message}`, type: 'error'});
        } else if (data) {
            setLoggedInClub(data as any as ClubProfileData);
            setAllClubs(prev => prev.map(c => c.id === loggedInClub.id ? data as any as ClubProfileData : c));
            showToast({ text: "Perfil del club actualizado.", type: 'success'});
        }
    }, [loggedInClub, showToast]);

    const handleUpdatePlayerProfile = useCallback(async (updatedProfile: UserProfileData) => {
        if (!supabase || !userProfile) return;
        
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
        
        const finalPhotos = await Promise.all(
            updatedProfile.photos.map(async (photo) => {
                if (photo.startsWith('data:image')) {
                    const blob = dataURLtoBlob(photo);
                    if (blob) {
                        const filePath = `gallery/${userProfile.id}/${Date.now()}.png`;
                        await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
                        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                        return publicUrl;
                    }
                }
                return photo;
            })
        );
        
        const profileToUpdate: Database['public']['Tables']['player_profiles']['Update'] = {
            first_name: updatedProfile.firstName,
            last_name: updatedProfile.lastName,
            sex: updatedProfile.sex,
            country: updatedProfile.country,
            state: updatedProfile.state,
            city: updatedProfile.city,
            availability: updatedProfile.availability,
            category: updatedProfile.category,
            avatar_url: finalAvatarUrl,
            photos: finalPhotos.filter(p => p !== null) as string[],
        };

        const { data, error } = await supabase.from('player_profiles').update(profileToUpdate).eq('id', userProfile.id).select('*, notifications(*)').single();

        if (error) {
            showToast({ text: `Error al actualizar el perfil: ${error.message}`, type: 'error'});
        } else if (data) {
            setUserProfile(data as any as UserProfileData);
            setAllPlayers(prev => prev.map(p => p.id === userProfile.id ? data as any as UserProfileData : p));
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
        
        const newNotification: Database['public']['Tables']['notifications']['Insert'] = {
            type: 'friend_request' as const,
            title: 'Nueva solicitud de amistad',
            message: `${userProfile.firstName} ${userProfile.lastName} quiere ser tu amigo.`,
            user_id: toId,
            read: false,
            payload: { fromId: userProfile.id }
        };

        const { error } = await supabase.from('notifications').insert([newNotification]);
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
        if (otherUserData && otherUserData.friends) {
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
            const acceptNotification: Database['public']['Tables']['notifications']['Insert'] = {
                type: 'friend_accept' as const,
                title: '¡Solicitud de amistad aceptada!',
                message: `${userProfile.firstName} ${userProfile.lastName} ha aceptado tu solicitud.`,
                user_id: fromId,
            };
            await supabase.from('notifications').insert([acceptNotification]);
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
        const notifications = userProfile?.notifications || loggedInClub?.notifications || [];
        return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [userProfile, loggedInClub]);


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
};