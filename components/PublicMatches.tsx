import React from 'react';
import { PublicMatch, ClubProfileData } from '../types';
import { UsersIcon, BuildingStorefrontIcon } from '../constants';

interface PublicMatchesProps {
    matches: PublicMatch[];
    clubs: ClubProfileData[];
    onJoinMatch: (matchId: string) => void;
}

const GenderBadge: React.FC<{gender: PublicMatch['gender']}> = ({ gender }) => {
    const genderStyles = {
        'Masculino': 'bg-blue-500/30 text-blue-300',
        'Femenino': 'bg-pink-500/30 text-pink-300',
        'Mixto': 'bg-purple-500/30 text-purple-300',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${genderStyles[gender]}`}>
            {gender}
        </span>
    )
}

const PublicMatches: React.FC<PublicMatchesProps> = ({ matches, clubs, onJoinMatch }) => {
    
    const getClubName = (clubId: string) => {
        return clubs.find(c => c.id === clubId)?.name || 'Club Desconocido';
    }

    return (
        <div className="mt-10">
            <h2 className="text-3xl font-bold text-white mb-6">Partidos Abiertos</h2>
            <div className="space-y-4">
                {matches.length === 0 && (
                    <div className="text-center py-10 bg-dark-secondary rounded-lg">
                        <p className="text-light-secondary">No hay partidos abiertos en este momento.</p>
                        <p className="text-sm text-slate-500 mt-2">¿Por qué no creas uno? Reserva una pista y hazla pública.</p>
                    </div>
                )}
                {matches.map((match) => (
                    <div key={match.id} className="bg-dark-secondary border border-dark-tertiary rounded-lg p-4 transition-shadow hover:shadow-lg flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-1">
                                <p className="font-bold text-lg text-white">{match.courtName} - <span className="text-primary">{match.time}</span></p>
                                <GenderBadge gender={match.gender} />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-light-secondary mt-1">
                                <BuildingStorefrontIcon className="h-4 w-4" />
                                <span>{getClubName(match.clubId)}</span>
                            </div>

                            <p className="text-sm text-light-secondary mt-2">Categoría: <span className="font-semibold text-light-primary">{match.category}</span></p>
                            
                            <div className="flex items-center mt-2 gap-2">
                                <UsersIcon />
                                <p className="text-light-primary">{match.currentPlayers} / {match.playersNeeded} Jugadores</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onJoinMatch(match.id)}
                            disabled={match.currentPlayers >= match.playersNeeded}
                            className="w-full sm:w-auto px-6 py-2 rounded-md bg-primary text-dark-primary font-bold hover:bg-primary-hover transition-colors disabled:bg-dark-tertiary disabled:text-light-secondary disabled:cursor-not-allowed"
                        >
                            {match.currentPlayers >= match.playersNeeded ? 'Completo' : 'Unirse'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PublicMatches;