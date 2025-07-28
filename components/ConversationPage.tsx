import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChatMessage, UserProfileData, ClubProfileData } from '../types';

interface ConversationPageProps {
    conversationId: string;
    messages: ChatMessage[];
    currentUserId: string;
    allUsers: (UserProfileData | ClubProfileData)[];
    onSendMessage: (text: string) => void;
    onBack: () => void;
}

const ConversationPage: React.FC<ConversationPageProps> = ({ conversationId, messages, currentUserId, allUsers, onSendMessage, onBack }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversationMessages = useMemo(() => {
        return messages
            .filter(m => m.conversationId === conversationId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, conversationId]);

    const otherUserId = useMemo(() => {
        // Find a message in the conversation to determine the other user
        const messageInConversation = messages.find(m => m.conversationId === conversationId);
        if (!messageInConversation) {
            // Fallback for new conversations initiated by current user
            return conversationId.replace(currentUserId, '').replace('_', '');
        }
        return messageInConversation.senderId === currentUserId ? messageInConversation.receiverId : messageInConversation.senderId;
    }, [conversationId, messages, currentUserId]);
    
    const otherUser = useMemo(() => {
        return allUsers.find(u => u.id === otherUserId);
    }, [allUsers, otherUserId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversationMessages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    if (!otherUser) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                 <button onClick={onBack} className="text-primary hover:text-primary-hover mb-4">&larr; Volver</button>
                <p className="text-light-secondary">Cargando conversación...</p>
            </div>
        );
    }
    
    const isPlayer = (user: any): user is UserProfileData => 'firstName' in user;
    const name = isPlayer(otherUser) ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.name;
    const avatarUrl = isPlayer(otherUser) ? otherUser.avatarUrl : `https://api.dicebear.com/8.x/initials/svg?seed=${otherUser.name}`;

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-dark-secondary rounded-lg">
            {/* Header */}
            <div className="flex items-center p-3 border-b border-dark-tertiary bg-dark-tertiary/50 rounded-t-lg">
                <button onClick={onBack} className="text-primary hover:text-primary-hover mr-3">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full mr-3" />
                <h2 className="font-bold text-lg text-white">{name}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId !== currentUserId && <img src={avatarUrl} className="w-6 h-6 rounded-full" />}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.senderId === currentUserId ? 'bg-primary text-dark-primary rounded-br-none' : 'bg-dark-tertiary text-white rounded-bl-none'}`}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-dark-tertiary">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-dark-tertiary border-transparent rounded-full py-2 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <button type="submit" className="bg-primary text-dark-primary rounded-full p-3 hover:bg-primary-hover transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConversationPage;