import React from 'react';
import { PlayerAppView } from '../types';
import { HouseIcon, TrophyIcon, UserIconFill, ChatBubbleIcon, MagnifyingGlassIcon } from '../constants';

interface BottomNavBarProps {
    activeView: PlayerAppView;
    setView: (view: PlayerAppView) => void;
    unreadMessageCount?: number;
}

const NavButton = ({ icon, label, isActive, onClick, badgeCount }: { icon: JSX.Element; label: string; isActive: boolean; onClick: () => void; badgeCount?: number; }) => {
    const activeClass = 'text-primary';
    const inactiveClass = 'text-light-secondary hover:text-white';
    return (
        <button onClick={onClick} className={`relative flex flex-1 flex-col items-center justify-end gap-1 transition-colors ${isActive ? activeClass : inactiveClass}`}>
             {badgeCount && badgeCount > 0 && (
                <span className="absolute top-0 right-[calc(50%-22px)] flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-dark-secondary">{badgeCount}</span>
            )}
            <div className="flex h-7 items-center justify-center">
                {icon}
            </div>
            <p className="text-xs font-medium tracking-tight">{label}</p>
        </button>
    )
};


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setView, unreadMessageCount }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40">
            <div className="container mx-auto max-w-lg">
                 <div className="flex gap-2 border-t border-dark-tertiary bg-dark-secondary px-4 pb-2 pt-2 rounded-t-2xl shadow-2xl">
                    <NavButton
                        icon={<HouseIcon />}
                        label="Inicio"
                        isActive={activeView === 'home'}
                        onClick={() => setView('home')}
                    />
                     <NavButton
                        icon={<TrophyIcon className="w-7 h-7" />}
                        label="Torneos"
                        isActive={activeView === 'tournaments'}
                        onClick={() => setView('tournaments')}
                    />
                     <NavButton
                        icon={<MagnifyingGlassIcon />}
                        label="Comunidad"
                        isActive={activeView === 'community'}
                        onClick={() => setView('community')}
                    />
                     <NavButton
                        icon={<ChatBubbleIcon />}
                        label="Chat"
                        isActive={activeView === 'chat'}
                        onClick={() => setView('chat')}
                        badgeCount={unreadMessageCount}
                    />
                     <NavButton
                        icon={<UserIconFill />}
                        label="Perfil"
                        isActive={activeView === 'profile'}
                        onClick={() => setView('profile')}
                    />
                </div>
            </div>
        </div>
    );
};

export default BottomNavBar;