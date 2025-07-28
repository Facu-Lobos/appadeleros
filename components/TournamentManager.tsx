
import React, { useState } from 'react';
import { Tournament, ClubProfileData } from '../types';
import { TrophyIcon } from '../constants';
import TournamentModal from './TournamentModal';

interface TournamentManagerProps {
    tournaments: Tournament[];
    onCreateTournament: (tournament: Tournament) => void;
    onSelectTournament: (id: string) => void;
    clubId: string;
}

const TournamentManager: React.FC<TournamentManagerProps> = ({ tournaments, onCreateTournament, onSelectTournament, clubId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleCreateTournament = (tournament: Tournament) => {
        onCreateTournament(tournament);
        setIsModalOpen(false);
    };

    const getStatusClass = (status: Tournament['status']) => {
        switch (status) {
            case 'Inscripción Abierta': return 'bg-green-500/20 text-green-300 animate-pulse';
            case 'Próximo': return 'bg-blue-500/20 text-blue-300';
            case 'Fase de Grupos': return 'bg-yellow-500/20 text-yellow-300';
            case 'Fase Final': return 'bg-orange-500/20 text-orange-300';
            case 'Finalizado': return 'bg-slate-500/20 text-light-secondary';
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <TrophyIcon className="h-7 w-7 text-primary"/>
                    Gestión de Torneos
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-dark-primary font-bold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors"
                >
                    + Crear Torneo
                </button>
            </div>
            <div className="space-y-4">
                {tournaments.length > 0 ? tournaments.map((t) => (
                    <div 
                        key={t.id} 
                        className="bg-dark-tertiary/50 p-4 rounded-lg flex justify-between items-center border border-dark-tertiary cursor-pointer hover:border-primary transition-colors"
                        onClick={() => onSelectTournament(t.id)}
                    >
                        <div>
                            <p className="font-bold text-lg text-white">{t.name} <span className="text-sm font-normal text-light-secondary">- {t.category}</span></p>
                            <p className="text-sm text-light-primary">Fecha: {new Date(t.date + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                        </div>
                         <div className="flex flex-col items-end gap-2">
                             <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(t.status)}`}>
                                {t.status}
                            </span>
                            <span className="text-sm text-light-secondary">{t.teams.length} / {t.maxTeams} equipos</span>
                         </div>
                    </div>
                )) : (
                    <p className="text-center text-light-secondary py-8">No hay torneos creados. ¡Crea el primero!</p>
                )}
            </div>
            <TournamentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleCreateTournament}
                clubId={clubId}
            />
        </div>
    );
};

export default TournamentManager;