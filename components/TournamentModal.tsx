
import React, { useState } from 'react';
import { Tournament, TournamentFormat, PlayerCategory, ClubProfileData } from '../types';
import { PLAYER_CATEGORIES } from '../constants';

interface TournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tournament: Tournament) => void;
    clubId: string;
}

const TournamentModal: React.FC<TournamentModalProps> = ({ isOpen, onClose, onConfirm, clubId }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<PlayerCategory>('4ta');
    const [date, setDate] = useState('');
    const [format, setFormat] = useState<TournamentFormat>('Copa del Mundo');
    const [maxTeams, setMaxTeams] = useState(16);
    const [teamsPerGroup, setTeamsPerGroup] = useState(4);
    const [error, setError] = useState('');

    if (!isOpen) return null;
    
    const handleConfirmClick = () => {
        setError('');
       
        if (maxTeams < 4 || maxTeams > 64) {
            setError("El número de equipos debe estar entre 4 y 64.");
            return;
        }

        if (maxTeams % teamsPerGroup !== 0) {
            setError(`El número de equipos (${maxTeams}) debe ser un múltiplo de los equipos por grupo (${teamsPerGroup}).`);
            return;
        }
        
        const numGroups = maxTeams / teamsPerGroup;
        const advancingTeamsCount = numGroups * 2; // Assuming 2 teams advance per group

        if (advancingTeamsCount < 2 || ![2, 4, 8, 16, 32].includes(advancingTeamsCount)) {
            setError(`Con esta configuración, clasificarían ${advancingTeamsCount} equipos. El número de clasificados a la fase final debe ser 2, 4, 8, 16 o 32. Ajusta el número de equipos o el tamaño de los grupos.`);
            return;
        }

        if (name.trim() && category.trim() && date) {
            const newTournament: Tournament = {
                id: `t-${Date.now()}`,
                clubId,
                name,
                category,
                date,
                status: 'Inscripción Abierta',
                format,
                teams: [],
                maxTeams,
                teamsPerGroup,
                registrations: [],
                data: {
                    groups: [],
                    knockout: {}
                }
            };

            onConfirm(newTournament);
            // Reset state
            setName('');
            setCategory('4ta');
            setDate('');
            setError('');
            setMaxTeams(16);
            setTeamsPerGroup(4);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity">
            <div className="bg-dark-secondary rounded-lg shadow-2xl p-8 w-full max-w-lg m-4 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Crear Nuevo Torneo</h2>
                
                <div className="space-y-4">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del Torneo" className="w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"/>
                     <div className="grid grid-cols-2 gap-4">
                        <select value={category} onChange={(e) => setCategory(e.target.value as PlayerCategory)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                           {PLAYER_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                           ))}
                        </select>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"/>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-light-secondary mb-2">Formato</label>
                             <select value={format} onChange={(e) => setFormat(e.target.value as TournamentFormat)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                                 <option value="Copa del Mundo">Grupos + Eliminatoria</option>
                             </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-light-secondary mb-2">Equipos por Grupo</label>
                            <select value={teamsPerGroup} onChange={e => setTeamsPerGroup(parseInt(e.target.value, 10))} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                            </select>
                        </div>
                     </div>
                      <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Número Máximo de Equipos</label>
                        <select value={maxTeams} onChange={e => setMaxTeams(parseInt(e.target.value, 10))} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="8">8</option>
                            <option value="16">16</option>
                            <option value="32">32</option>
                        </select>
                    </div>
                </div>
                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors">Cancelar</button>
                    <button onClick={handleConfirmClick} disabled={!name.trim() || !category.trim() || !date} className="px-6 py-2 rounded-md bg-primary text-dark-primary font-bold hover:bg-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        Crear Torneo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TournamentModal;
