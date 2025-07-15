import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfileData, ClubProfileData } from '../types';
import { TrashIcon, EllipsisVerticalIcon } from '../constants';

interface ChatListPageProps {
    messages: ChatMessage[];
    currentUserId: string;
    allUsers: (UserProfileData | ClubProfileData)[];
    onSelectConversation: (conversationId: string) => void;
    onDeleteConversation: (conversationId: string) => void;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ messages, currentUserId, allUsers, onSelectConversation, onDeleteConversation }) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const conversations = useMemo(() => {
        const convos: { [key: string]: ChatMessage } = {};

        messages.forEach(msg => {
            const lastMessage = convos[msg.conversationId];
            if (!lastMessage || new Date(msg.timestamp) > new Date(lastMessage.timestamp)) {
                convos[msg.conversationId] = msg;
            }
        });

        return Object.values(convos).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [messages]);

    const getUserDetails = (userId: string) => {
        return allUsers.find(u => u.id === userId);
    };

    const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation();
        onDeleteConversation(conversationId);
        setOpenMenuId(null);
    };

    return (
        <div className="space-y-4">
             <h2 className="text-3xl font-bold text-white mb-6">Mensajes</h2>
            {conversations.length === 0 ? (
                <div className="text-center py-10 bg-dark-primary/50 rounded-lg">
                    <p className="text-light-secondary">No tienes conversaciones activas.</p>
                </div>
            ) : (
                conversations.map(lastMessage => {
                    const otherUserId = lastMessage.senderId === currentUserId ? lastMessage.receiverId : lastMessage.senderId;
                    const otherUser = getUserDetails(otherUserId);
                    const isPlayer = (user: any): user is UserProfileData => 'firstName' in user;

                    const name = otherUser ? (isPlayer(otherUser) ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.name) : 'Usuario desconocido';
                    const avatarUrl = otherUser ? (isPlayer(otherUser) ? otherUser.avatarUrl : `https://api.dicebear.com/8.x/initials/svg?seed=${otherUser.name}`) : '';

                    return (
                        <div 
                            key={lastMessage.conversationId} 
                            className="flex items-center gap-4 bg-dark-secondary p-3 rounded-lg group"
                        >
                           <div 
                                className="flex-1 flex items-center gap-4 overflow-hidden cursor-pointer"
                                onClick={() => onSelectConversation(lastMessage.conversationId)}
                            >
                                <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full bg-dark-primary object-cover" />
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-bold text-white truncate">{name}</h3>
                                    <p className="text-sm text-light-secondary truncate">{lastMessage.text}</p>
                                </div>
                           </div>
                            <div className="relative" ref={openMenuId === lastMessage.conversationId ? menuRef : null}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === lastMessage.conversationId ? null : lastMessage.conversationId);
                                    }}
                                    className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"
                                    aria-label="Opciones de conversación"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>

                                {openMenuId === lastMessage.conversationId && (
                                    <div className="absolute right-0 bottom-full mb-1 w-48 bg-dark-tertiary rounded-md shadow-lg z-20 border border-slate-700/50">
                                        <div className="py-1">
                                            <button
                                                onClick={(e) => handleDeleteClick(e, lastMessage.conversationId)}
                                                className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700/30 transition-colors"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                              Eliminar Chat
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ChatListPage;