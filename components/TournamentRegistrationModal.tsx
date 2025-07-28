import React, { useState, useMemo } from 'react';
import { Tournament, UserProfileData } from '../types';

interface TournamentRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tournamentId: string, teamName: string, partnerEmail: string) => void;
    tournament: Tournament;
    currentUser: UserProfileData;
    allPlayers: UserProfileData[];
}

const TournamentRegistrationModal: React.FC<TournamentRegistrationModalProps> = ({ isOpen, onClose, onConfirm, tournament, currentUser, allPlayers }) => {
    const [teamName, setTeamName] = useState(`${currentUser.lastName} / `);
    const [partnerId, setPartnerId] = useState('');
    const [error, setError] = useState('');

    const friends = useMemo(() => {
        return allPlayers.filter(p => currentUser.friends.includes(p.id));
    }, [allPlayers, currentUser]);
    
    if (!isOpen) return null;

    const handleConfirmClick = () => {
        setError('');
        if (!teamName.trim()) {
            setError('Por favor, introduce un nombre para el equipo.');
            return;
        }
        if (!partnerId) {
            setError('Debes seleccionar un compañero de equipo.');
            return;
        }
        
        const partner = allPlayers.find(p => p.id === partnerId);
        if (!partner) {
            setError('Compañero no válido.');
            return;
        }

        onConfirm(tournament.id, teamName, partner.email);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity">
            <div className="bg-dark-secondary rounded-lg shadow-2xl p-8 w-full max-w-lg m-4 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-2">Inscripción al Torneo</h2>
                <p className="text-light-primary mb-6">{tournament.name} - <span className="font-semibold text-primary">{tournament.category}</span></p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Nombre del Equipo</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Nombre del Equipo"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Tu Compañero/a (de tu lista de amigos)</label>
                         <select
                            value={partnerId}
                            onChange={(e) => {
                                setPartnerId(e.target.value);
                                const p = allPlayers.find(player => player.id === e.target.value);
                                setTeamName(`${currentUser.lastName} / ${p ? p.lastName : ''}`);
                            }}
                            className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                            <option value="">Selecciona un amigo...</option>
                            {friends.map(friend => (
                                <option key={friend.id} value={friend.id}>{friend.firstName} {friend.lastName} ({friend.category})</option>
                            ))}
                        </select>
                         {friends.length === 0 && <p className="text-xs text-yellow-400 mt-1">No tienes amigos para invitar. ¡Añade amigos desde la pestaña Comunidad!</p>}
                    </div>
                    <div>
                        <p className="text-sm text-light-secondary">Tu capitán eres tú: <span className="font-bold text-white">{currentUser.firstName} {currentUser.lastName} ({currentUser.category})</span></p>
                    </div>
                </div>

                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors">Cancelar</button>
                    <button onClick={handleConfirmClick} disabled={!partnerId} className="px-6 py-2 rounded-md bg-primary text-dark-primary font-bold hover:bg-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        Enviar Inscripción
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TournamentRegistrationModal;
