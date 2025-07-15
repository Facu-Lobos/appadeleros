import React, { useState, useMemo } from 'react';
import { UserProfileData, ClubProfileData } from '../types';
import { MagnifyingGlassIcon, BuildingStorefrontIcon } from '../constants';
import AIAssistant from './AIAssistant';

interface CommunityPageProps {
    currentUser: UserProfileData | ClubProfileData;
    allPlayers: UserProfileData[];
    allClubs: ClubProfileData[];
    onSendFriendRequest?: (toId: string) => void;
    onStartChat?: (userId: string) => void;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ currentUser, allPlayers, allClubs, onSendFriendRequest, onStartChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const isClubView = 'memberId' in currentUser;
    const isPlayerView = !isClubView;

    const filteredPlayers = useMemo(() => {
        if (!searchTerm) return [];
        return allPlayers.filter(p =>
            p.id !== currentUser.id &&
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allPlayers, currentUser.id]);

    const filteredClubs = useMemo(() => {
        if (!searchTerm || isClubView) return [];
        return allClubs.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allClubs, isClubView]);

    const getFriendshipStatus = (player: UserProfileData) => {
        if (!('friends' in currentUser)) return 'none';

        if (currentUser.friends.includes(player.id)) {
            return 'friends';
        }
        if (player.friendRequests.some(req => req.fromId === currentUser.id)) {
            return 'sent';
        }
        if (currentUser.friendRequests.some(req => req.fromId === player.id)) {
            return 'received';
        }
        return 'none';
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Comunidad</h1>
                <p className="text-light-secondary mt-1">
                    {isClubView ? 'Busca jugadores para contactar.' : 'Encuentra nuevos compañeros o busca perfiles específicos.'}
                </p>
            </div>

            {isPlayerView && <AIAssistant userProfile={currentUser as UserProfileData} />}

            <div className="space-y-4">
                 <h2 className="text-2xl font-bold text-white mt-8">{isClubView ? 'Buscador de Jugadores' : 'Buscador Manual'}</h2>
                 <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-light-secondary" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={isClubView ? 'Buscar jugadores por nombre...' : 'Buscar jugadores o clubes por nombre...'}
                        className="w-full bg-dark-secondary border border-dark-tertiary rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
            </div>

            {searchTerm ? (
                <div className="space-y-6">
                    {/* Players Results */}
                    {filteredPlayers.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Jugadores</h3>
                            <div className="space-y-3">
                                {filteredPlayers.map(player => {
                                    const status = getFriendshipStatus(player);
                                    return (
                                        <div key={player.id} className="flex items-center gap-4 bg-dark-secondary p-3 rounded-lg">
                                            <img src={player.avatarUrl} alt={player.firstName} className="w-12 h-12 rounded-full object-cover" />
                                            <div className="flex-1">
                                                <p className="font-bold text-white">{player.firstName} {player.lastName}</p>
                                                <p className="text-sm text-light-secondary">Categoría: {player.category}</p>
                                            </div>
                                            {isClubView ? (
                                                <button onClick={() => onStartChat?.(player.id)} className="bg-primary text-dark-primary font-bold text-sm py-1 px-3 rounded-md hover:bg-primary-hover">
                                                    Enviar Mensaje
                                                </button>
                                            ) : (
                                                <>
                                                    {status === 'friends' && <span className="text-sm font-semibold text-green-400">Amigos</span>}
                                                    {status === 'sent' && <span className="text-sm font-semibold text-yellow-400">Solicitud Enviada</span>}
                                                    {status === 'received' && <span className="text-sm font-semibold text-blue-400">Solicitud Recibida</span>}
                                                    {status === 'none' && (
                                                        <button onClick={() => onSendFriendRequest?.(player.id)} className="bg-primary text-dark-primary font-bold text-sm py-1 px-3 rounded-md hover:bg-primary-hover">
                                                            + Añadir
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Clubs Results */}
                    {isPlayerView && filteredClubs.length > 0 && (
                         <div>
                            <h3 className="text-xl font-bold text-white mb-4">Clubes</h3>
                            <div className="space-y-3">
                                {filteredClubs.map(club => (
                                    <div key={club.id} className="flex items-center gap-4 bg-dark-secondary p-3 rounded-lg">
                                        <div className="w-12 h-12 rounded-full bg-dark-primary flex items-center justify-center">
                                            <BuildingStorefrontIcon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{club.name}</p>
                                            <p className="text-sm text-light-secondary">{club.city}, {club.state}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {filteredPlayers.length === 0 && (!isPlayerView || filteredClubs.length === 0) && (
                        <div className="text-center py-10 bg-dark-secondary rounded-lg">
                            <p className="text-light-primary">No se encontraron resultados para "{searchTerm}".</p>
                        </div>
                    )}

                </div>
            ) : (
                <div className="text-center py-10 bg-dark-secondary/50 rounded-lg">
                    <p className="text-light-secondary">Usa la barra de búsqueda para encontrar personas o clubes.</p>
                </div>
            )}

        </div>
    );
};

export default CommunityPage;