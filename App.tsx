
import React, { useState, useCallback } from 'react';
import { BookingStatus } from './types';
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
import GlobalLoader from './components/GlobalLoader';
import Toast from './components/Toast';
import { useAppCore } from './hooks/useAppCore';
import { useTournamentManager } from './hooks/useTournamentManager';
import { useBookingManager } from './hooks/useBookingManager';

export const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
    }, []);

    const core = useAppCore({ setIsLoading, showToast });
    
    const tournaments = useTournamentManager({
        showToast,
        userProfile: core.userProfile,
        allPlayers: core.allPlayers,
        initialTournaments: core.initialTournaments,
        rankings: core.rankings,
        setRankings: core.setRankings,
    });

    const bookings = useBookingManager({
        showToast,
        userProfile: core.userProfile,
        loggedInClub: core.loggedInClub,
        baseCourts: core.baseCourts
    });

    if (isLoading) {
        return <GlobalLoader />;
    }

    if (core.userProfile) {
        let content;
        if (core.selectedClubIdForPlayerView) {
            const selectedClub = core.allClubs.find(c => c.id === core.selectedClubIdForPlayerView);
            // We need to generate court slots for the selected club on the fly
             const courtsForSelectedClub = core.baseCourts.filter(court => court.clubId === core.selectedClubIdForPlayerView).map(c => bookings.generateCourtTimeSlots(c, selectedClub!));

            content = selectedClub ? <ClubDetailPage
                club={selectedClub}
                courts={courtsForSelectedClub}
                onSlotClick={bookings.handleSlotClick}
                selectedDate={bookings.selectedDate}
                setSelectedDate={bookings.setSelectedDate}
                onBack={() => core.setSelectedClubIdForPlayerView(null)}
            /> : null;
        } else {
             switch (core.playerView) {
                case 'home':
                    content = <PlayerHomePage 
                                userProfile={core.userProfile} 
                                allClubs={core.allClubs} 
                                onSelectClub={core.setSelectedClubIdForPlayerView} 
                              />;
                    break;
                case 'tournaments':
                    content = <PlayerTournamentsPage 
                                currentUser={core.userProfile}
                                tournaments={tournaments.tournaments} 
                                clubs={core.allClubs} 
                                allPlayers={core.allPlayers}
                                onRegister={tournaments.handleTournamentRegistrationRequest}
                              />;
                    break;
                case 'community':
                    content = <CommunityPage 
                                currentUser={core.userProfile} 
                                allPlayers={core.allPlayers} 
                                allClubs={core.allClubs}
                                onSendFriendRequest={core.handleSendFriendRequest}
                                onStartChat={core.handleStartChat}
                              />;
                    break;
                case 'chat':
                     if (core.selectedConversationId) {
                        content = <ConversationPage 
                                    conversationId={core.selectedConversationId}
                                    messages={core.messages}
                                    currentUserId={core.userProfile.id}
                                    allUsers={[...core.allPlayers, ...core.allClubs]}
                                    onSendMessage={core.handleSendMessage}
                                    onBack={() => core.setSelectedConversationId(null)}
                                  />;
                    } else {
                        content = <ChatListPage 
                                    messages={core.messages} 
                                    currentUserId={core.userProfile.id} 
                                    allUsers={[...core.allPlayers, ...core.allClubs]}
                                    onSelectConversation={core.handleStartChat}
                                    onDeleteConversation={core.handleDeleteConversation}
                                  />;
                    }
                    break;
                case 'profile':
                    content = <PlayerProfilePage 
                                profile={core.userProfile} 
                                allPlayers={core.allPlayers}
                                onUpdateProfile={core.handleUpdatePlayerProfile}
                                onDeleteProfile={core.handleDeletePlayerProfile}
                                onStartChat={core.handleStartChat}
                                onRemoveFriend={core.handleRemoveFriend}
                              />;
                    break;
                default:
                    content = <PlayerHomePage userProfile={core.userProfile} allClubs={core.allClubs} onSelectClub={core.setSelectedClubIdForPlayerView} />;
            }
        }
        
        return (
            <>
                <Header 
                    onLogout={core.handleLogout}
                    notifications={core.activeNotifications}
                    isPanelOpen={core.isNotificationsPanelOpen}
                    onTogglePanel={() => core.setIsNotificationsPanelOpen(!core.isNotificationsPanelOpen)}
                    onNotificationClick={core.handleNotificationClick}
                    onMarkAllAsRead={core.handleMarkAllNotificationsAsRead}
                    onAcceptFriendRequest={core.handleAcceptFriendRequest}
                    onDeclineFriendRequest={core.handleDeclineFriendRequest}
                />
                <main className="container mx-auto p-4 pb-24">
                    {content}
                </main>
                <BottomNavBar 
                    activeView={core.playerView} 
                    setView={core.setPlayerView} 
                    unreadMessageCount={core.messages.filter(m => m.receiver_id === core.userProfile?.id && !m.read).length} 
                />
                 {bookings.isModalOpen && bookings.selectedSlot && (
                    <BookingModal 
                        isOpen={bookings.isModalOpen}
                        onClose={bookings.handleCloseModal}
                        onConfirm={bookings.handleConfirmBooking}
                        onCancelBooking={bookings.handleCancelBooking}
                        slotData={bookings.selectedSlot}
                        court={bookings.selectedCourt}
                        userProfile={core.userProfile}
                    />
                )}
                <Toast message={toast} onClose={() => setToast(null)} />
            </>
        );
    }
    
    if (core.loggedInClub) {
        let content;
         if (tournaments.selectedTournamentId) {
             const tournament = tournaments.tournaments.find(t => t.id === tournaments.selectedTournamentId);
             content = tournament ? <TournamentDetailPage 
                tournament={tournament}
                onUpdateTournament={tournaments.handleUpdateTournament}
                onBack={() => tournaments.setSelectedTournamentId(null)}
                onRegistrationAction={tournaments.handleRegistrationAction}
                onGenerateGroups={tournaments.handleGenerateGroupsForTournament}
             /> : <p>Cargando torneo...</p>;
         } else {
              content = <ClubDashboard
                clubProfile={core.loggedInClub}
                onUpdateProfile={core.handleUpdateClubProfile}
                onDeleteProfile={async () => {
                    await core.handleLogout();
                    showToast({text: "Función de eliminar no implementada.", type: 'info'});
                }}
                tournaments={tournaments.tournaments.filter(t => t.club_id === core.loggedInClub?.id)}
                rankings={core.rankings}
                onCreateTournament={tournaments.handleCreateTournament}
                onSelectTournament={tournaments.setSelectedTournamentId}
                courts={bookings.courtsForLoggedInClub}
                onSlotClick={bookings.handleSlotClick}
                selectedDate={bookings.selectedDate}
                setSelectedDate={bookings.setSelectedDate}
                messages={core.messages}
                currentUserId={core.loggedInClub.id}
                allUsers={[...core.allPlayers, ...core.allClubs]}
                onSelectConversation={core.setSelectedConversationId}
                selectedConversationId={core.selectedConversationId}
                onSendMessage={core.handleSendMessage}
                onDeleteConversation={core.handleDeleteConversation}
                activeView={core.clubView}
                setView={core.setClubView}
                onStartChat={core.handleStartChat}
            />;
         }

        return (
             <>
                <Header 
                    onLogout={core.handleLogout}
                    notifications={core.activeNotifications}
                    isPanelOpen={core.isNotificationsPanelOpen}
                    onTogglePanel={() => core.setIsNotificationsPanelOpen(!core.isNotificationsPanelOpen)}
                    onNotificationClick={core.handleNotificationClick}
                    onMarkAllAsRead={core.handleMarkAllNotificationsAsRead}
                    onAcceptFriendRequest={() => {}}
                    onDeclineFriendRequest={() => {}}
                />
                <main className="container mx-auto p-4">
                    {content}
                </main>
                 {bookings.isModalOpen && bookings.selectedSlot && (
                    <BookingModal 
                        isOpen={bookings.isModalOpen}
                        onClose={bookings.handleCloseModal}
                        onConfirm={bookings.handleConfirmBooking}
                        onCancelBooking={bookings.handleCancelBooking}
                        slotData={bookings.selectedSlot}
                        court={bookings.selectedCourt}
                        userProfile={core.userProfile}
                    />
                )}
                <Toast message={toast} onClose={() => setToast(null)} />
            </>
        )
    }

    // Auth screens
    const AuthContent = () => {
        switch (core.view) {
            case 'player-login':
                return <PlayerLogin onLogin={core.handlePlayerLogin} onBack={() => core.setView('auth')} onForgotPassword={() => core.setView('forgot-password')} />;
            case 'club-login':
                return <ClubLogin onLogin={core.handleClubLogin} onBack={() => core.setView('auth')} onForgotPassword={() => core.setView('forgot-password')}/>;
            case 'player-signup':
                return <PlayerRegistration onRegister={core.handlePlayerRegister} onBack={() => core.setView('auth')} />;
            case 'club-signup':
                return <ClubRegistration onRegister={core.handleClubRegister} onBack={() => core.setView('auth')} />;
            case 'forgot-password':
                return <ForgotPassword onRequest={core.handlePasswordReset} onBack={() => core.setView('auth')} />;
            case 'auth':
            default:
                return <AuthScreen onNavigate={core.handleAuthNavigate} />;
        }
    }

    return (
        <>
            <AuthContent />
            <Toast message={toast} onClose={() => setToast(null)} />
        </>
    );
};