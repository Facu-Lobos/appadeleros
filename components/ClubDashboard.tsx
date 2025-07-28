import React, { useState, useEffect } from 'react';
import { Tournament, CourtData, TimeSlotData, ClubProfileData, Ranking, ChatMessage, UserProfileData, ClubAppView } from '../types';
import TournamentManager from './TournamentManager';
import { TrophyIcon, BuildingStorefrontIcon, CalendarIcon, ChartBarIcon, ChatBubbleIcon, MagnifyingGlassIcon } from '../constants';
import ClubProfile from './ClubProfile';
import BookingGrid from './BookingGrid';
import RankingPage from './RankingPage';
import ChatListPage from './ChatListPage';
import ConversationPage from './ConversationPage';
import CommunityPage from './CommunityPage';


interface ClubDashboardProps {
    clubProfile: ClubProfileData;
    onUpdateProfile: (updatedProfile: ClubProfileData) => void;
    onDeleteProfile: () => void;
    tournaments: Tournament[];
    rankings: Ranking[];
    onCreateTournament: (tournament: Tournament) => void;
    onSelectTournament: (id: string) => void;
    courts: CourtData[];
    onSlotClick: (slot: TimeSlotData, courtId: CourtData) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    messages: ChatMessage[];
    currentUserId: string;
    allUsers: (UserProfileData | ClubProfileData)[];
    onSelectConversation: (conversationId: string | null) => void;
    selectedConversationId: string | null;
    onSendMessage: (text: string) => void;
    onDeleteConversation: (conversationId: string) => void;
    activeView: ClubAppView;
    setView: (view: ClubAppView) => void;
    onStartChat: (userId: string) => void;
}

type ActiveTab = ClubAppView;

const ClubDashboard: React.FC<ClubDashboardProps> = ({ 
    clubProfile,
    onUpdateProfile,
    onDeleteProfile,
    tournaments, 
    rankings,
    onCreateTournament,
    onSelectTournament,
    courts,
    onSlotClick,
    selectedDate,
    setSelectedDate,
    messages,
    currentUserId,
    allUsers,
    onSelectConversation,
    selectedConversationId,
    onSendMessage,
    onDeleteConversation,
    activeView,
    setView,
    onStartChat
}) => {
    const [selectedCourtIndex, setSelectedCourtIndex] = useState(0);
    
    useEffect(() => {
        if (selectedCourtIndex >= courts.length && courts.length > 0) {
            setSelectedCourtIndex(0);
        }
    }, [courts, selectedCourtIndex]);

    const getTabClass = (tabName: ActiveTab) => {
        return `flex-1 py-3 px-2 text-center border-b-4 font-semibold cursor-pointer transition-colors duration-300 flex items-center justify-center gap-2 text-lg ${
            activeView === tabName
                ? 'border-primary text-white'
                : 'border-transparent text-light-secondary hover:text-white'
        }`;
    };

    return (
        <div className="bg-dark-secondary rounded-lg shadow-2xl p-6 lg:p-8">
            <h2 className="text-4xl font-bold text-white mb-2">{clubProfile.name}</h2>
            <p className="text-light-secondary mb-8">Gestiona aquí toda la actividad de tu club.</p>

            <div className="border-b border-dark-tertiary mb-8">
                <nav className="flex flex-wrap md:flex-nowrap space-x-4" aria-label="Tabs">
                    <button onClick={() => setView('calendar')} className={getTabClass('calendar')} role="tab" aria-selected={activeView === 'calendar'}>
                        <CalendarIcon className="h-6 w-6" /> Calendario
                    </button>
                    <button onClick={() => setView('tournaments')} className={getTabClass('tournaments')} role="tab" aria-selected={activeView === 'tournaments'}>
                        <TrophyIcon className="h-6 w-6" /> Torneos
                    </button>
                     <button onClick={() => setView('ranking')} className={getTabClass('ranking')} role="tab" aria-selected={activeView === 'ranking'}>
                        <ChartBarIcon className="h-6 w-6" /> Ranking
                    </button>
                     <button onClick={() => setView('community')} className={getTabClass('community')} role="tab" aria-selected={activeView === 'community'}>
                        <MagnifyingGlassIcon className="h-6 w-6" /> Comunidad
                    </button>
                    <button onClick={() => setView('chat')} className={getTabClass('chat')} role="tab" aria-selected={activeView === 'chat'}>
                        <ChatBubbleIcon className="h-6 w-6" /> Chat
                    </button>
                    <button onClick={() => setView('profile')} className={getTabClass('profile')} role="tab" aria-selected={activeView === 'profile'}>
                        <BuildingStorefrontIcon className="h-6 w-6" /> Mi Club
                    </button>
                </nav>
            </div>
            
            <div>
                {activeView === 'calendar' && (
                     <BookingGrid 
                        courts={courts} 
                        onSlotClick={(slot, court) => onSlotClick(slot, court)}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedCourtIndex={selectedCourtIndex}
                        setSelectedCourtIndex={setSelectedCourtIndex}
                     />
                )}
                {activeView === 'tournaments' && (
                    <TournamentManager 
                        tournaments={tournaments} 
                        onCreateTournament={onCreateTournament}
                        onSelectTournament={onSelectTournament}
                        clubId={clubProfile.id}
                     />
                )}
                {activeView === 'ranking' && <RankingPage rankings={rankings} />}
                 {activeView === 'community' && (
                    <CommunityPage
                        currentUser={clubProfile}
                        allPlayers={allUsers.filter(u => 'firstName' in u) as UserProfileData[]}
                        allClubs={[]}
                        onStartChat={onStartChat}
                    />
                )}
                {activeView === 'profile' && <ClubProfile profile={clubProfile} onUpdateProfile={onUpdateProfile} onDeleteProfile={onDeleteProfile} />}
                {activeView === 'chat' && (
                     selectedConversationId ? (
                        <ConversationPage
                            conversationId={selectedConversationId}
                            messages={messages}
                            currentUserId={currentUserId}
                            allUsers={allUsers}
                            onSendMessage={onSendMessage}
                            onBack={() => onSelectConversation(null)}
                        />
                    ) : (
                        <ChatListPage
                            messages={messages}
                            currentUserId={currentUserId}
                            allUsers={allUsers}
                            onSelectConversation={onSelectConversation}
                            onDeleteConversation={onDeleteConversation}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default ClubDashboard;