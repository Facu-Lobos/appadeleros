import React from 'react';
import { PadelBallIcon, PadelRacketIcon, NotificationBellIcon } from '../constants';
import { Notification } from '../types';

interface HeaderProps {
    onLogout: () => void;
    notifications: Notification[];
    isPanelOpen: boolean;
    onTogglePanel: () => void;
    onNotificationClick: (notification: Notification) => void;
    onMarkAllAsRead: () => void;
    onAcceptFriendRequest: (fromId: string) => void;
    onDeclineFriendRequest: (fromId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onLogout, 
    notifications, 
    isPanelOpen, 
    onTogglePanel, 
    onNotificationClick, 
    onMarkAllAsRead,
    onAcceptFriendRequest,
    onDeclineFriendRequest
}) => {
    const textStyle = {
        fontFamily: "'Poppins', sans-serif",
        color: '#000000',
        fontWeight: '900',
        WebkitTextStroke: '0.75px #E2E8F0',
        textStroke: '0.75px #E2E8F0'
    };
    
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="bg-dark-secondary shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center text-3xl font-black tracking-wider">
                    <span style={{ ...textStyle, transform: 'translateY(1px)', position: 'relative', zIndex: 11 }}>A</span>

                    <div className="letter-container" style={{ marginLeft: '-6px' }}>
                        <span className="animate-slide-in" style={{ ...textStyle, animationDelay: '0.1s', position: 'relative', zIndex: 10 }}>P</span>
                    </div>

                    <div className="letter-container" style={{ marginLeft: '-19px' }}>
                        <div className="animate-slide-in" style={{ animationDelay: '0.2s', position: 'relative', zIndex: 9 }}>
                            <PadelRacketIcon className="h-16 w-11" />
                        </div>
                    </div>

                    {"adeler".split('').map((char, index) => {
                        const charMarginLeft = index === 0 ? '-20px' : '-5px';
                        return (
                            <div key={index} className="letter-container" style={{ marginLeft: charMarginLeft }}>
                                <span className="animate-slide-in" style={{ ...textStyle, animationDelay: `${0.3 + index * 0.05}s`, position: 'relative', zIndex: 8 - index }}>{char}</span>
                            </div>
                        );
                    })}

                    <div className="letter-container" style={{ marginLeft: '-6px' }}>
                        <div className="animate-slide-in" style={{ animationDelay: '0.9s', position: 'relative', zIndex: 2 }}>
                            <PadelBallIcon className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="letter-container" style={{ marginLeft: '-6px' }}>
                        <span className="animate-slide-in" style={{ ...textStyle, animationDelay: '1.0s', position: 'relative', zIndex: 1 }}>s</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button onClick={onTogglePanel} className="text-light-secondary hover:text-white transition-colors relative">
                            <NotificationBellIcon className="h-7 w-7" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{unreadCount}</span>
                            )}
                        </button>
                        {isPanelOpen && (
                             <div className="absolute right-0 mt-2 w-80 bg-dark-tertiary rounded-lg shadow-2xl border border-slate-700/50">
                                <div className="p-3 flex justify-between items-center border-b border-slate-700">
                                    <h3 className="font-bold text-white">Notificaciones</h3>
                                    <button onClick={onMarkAllAsRead} className="text-xs text-primary hover:underline">Marcar todas como leídas</button>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="text-light-secondary text-sm text-center p-4">No tienes notificaciones.</p>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} onClick={() => onNotificationClick(n)} className={`p-3 border-b border-slate-700/50 ${n.type !== 'friend_request' ? 'cursor-pointer hover:bg-slate-700/30' : ''} ${n.read ? 'opacity-60' : ''}`}>
                                            <p className="font-semibold text-white">{n.title}</p>
                                            <p className="text-sm text-light-secondary">{n.message}</p>
                                            <p className="text-xs text-slate-500 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                            {n.type === 'friend_request' && n.payload?.fromId && !n.read && (
                                                <div className="mt-2 flex gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onAcceptFriendRequest(n.payload!.fromId!); }} 
                                                        className="flex-1 bg-green-600 text-white text-xs font-bold py-1 px-2 rounded hover:bg-green-500 transition-colors"
                                                    >
                                                        Aceptar
                                                    </button>
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeclineFriendRequest(n.payload!.fromId!); }} 
                                                        className="flex-1 bg-slate-600 text-white text-xs font-bold py-1 px-2 rounded hover:bg-slate-500 transition-colors"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onLogout}
                        className="px-4 py-2 text-sm font-semibold rounded-md bg-dark-tertiary text-white hover:bg-red-600 transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;