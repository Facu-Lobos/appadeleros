
import React, { useState, useMemo } from 'react';
import { Tournament, ClubProfileData, UserProfileData, PlayerCategory } from '../types';
import TournamentRegistrationModal from './TournamentRegistrationModal';
import { PLAYER_CATEGORIES } from '../constants';

interface PlayerTournamentsPageProps {
    currentUser: UserProfileData;
    tournaments: Tournament[];
    clubs: ClubProfileData[];
    allPlayers: UserProfileData[];
    onRegister: (tournamentId: string, teamName: string, partnerEmail: string) => void;
}

const PlayerTournamentsPage: React.FC<PlayerTournamentsPageProps> = ({ currentUser, tournaments, clubs, allPlayers, onRegister }) => {
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<PlayerCategory | 'All'>('All');
    
    const openTournaments = useMemo(() => {
        return tournaments.filter(t => 
            t.status === 'Inscripción Abierta' &&
            (categoryFilter === 'All' || t.category === categoryFilter)
        );
    }, [tournaments, categoryFilter]);

    const getClubName = (clubId: string) => clubs.find(c => c.id === clubId)?.name || 'Club Desconocido';

    const getRegistrationStatus = (tournament: Tournament) => {
        const registration = tournament.registrations.find(r => r.playerIds.includes(currentUser.id));
        if (!registration) return null;
        
        const statusInfo = {
            pending: { text: "Inscripción Pendiente", color: "text-yellow-400" },
            approved: { text: "¡Inscripción Aprobada!", color: "text-green-400" },
            rejected: { text: "Inscripción Rechazada", color: "text-red-400" }
        };
        return <span className={`text-sm font-bold ${statusInfo[registration.status].color}`}>{statusInfo[registration.status].text}</span>;
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Torneos Disponibles</h1>
                    <p className="text-light-secondary mt-1">Encuentra una competición y apúntate con tu pareja.</p>
                </div>
                 <div className="relative">
                    <select 
                        value={categoryFilter} 
                        onChange={e => setCategoryFilter(e.target.value as PlayerCategory | 'All')}
                        className="appearance-none w-full sm:w-auto bg-dark-secondary border border-dark-tertiary rounded-md py-2 pl-3 pr-10 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="All">Todas las Categorías</option>
                        {PLAYER_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat} Categoría</option>)}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-light-secondary">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {openTournaments.length === 0 ? (
                    <div className="text-center py-12 bg-dark-secondary rounded-lg">
                        <p className="text-light-primary">No hay torneos abiertos en esta categoría.</p>
                    </div>
                ) : (
                    openTournaments.map(t => {
                        const registrationStatus = getRegistrationStatus(t);
                        const isFull = t.teams.length >= t.maxTeams;

                        return (
                             <div key={t.id} className="bg-dark-secondary border border-dark-tertiary rounded-lg p-4 transition-shadow hover:shadow-lg">
                                 <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-white">{t.name}</h3>
                                        <p className="text-sm text-light-secondary">Organizado por: <span className="font-semibold text-light-primary">{getClubName(t.clubId)}</span></p>
                                        <p className="text-sm text-light-secondary">Categoría: <span className="font-semibold text-light-primary">{t.category}</span></p>
                                        <p className="text-sm text-light-secondary">Fecha: <span className="font-semibold text-light-primary">{new Date(t.date + 'T00:00:00').toLocaleDateString()}</span></p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-lg font-bold text-primary">{t.teams.length} / {t.maxTeams} <span className="text-sm font-normal text-light-secondary">equipos</span></span>
                                        {registrationStatus ? (
                                            registrationStatus
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedTournament(t)}
                                                disabled={isFull}
                                                className="px-5 py-2 rounded-md bg-primary text-dark-primary font-bold hover:bg-primary-hover transition-colors disabled:bg-dark-tertiary disabled:text-light-secondary disabled:cursor-not-allowed">
                                                {isFull ? 'Completo' : 'Inscribirse'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                             </div>
                        )
                    })
                )}
            </div>

            {selectedTournament && (
                <TournamentRegistrationModal
                    isOpen={!!selectedTournament}
                    onClose={() => setSelectedTournament(null)}
                    tournament={selectedTournament}
                    currentUser={currentUser}
                    allPlayers={allPlayers}
                    onConfirm={onRegister}
                />
            )}
        </div>
    );
};

export default PlayerTournamentsPage;