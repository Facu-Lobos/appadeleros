import React, { useState } from 'react';
import { Ranking, PlayerCategory } from '../types';
import { PLAYER_CATEGORIES } from '../constants';

interface RankingPageProps {
    rankings: Ranking[];
}

const RankingPage: React.FC<RankingPageProps> = ({ rankings }) => {
    const [selectedCategory, setSelectedCategory] = useState<PlayerCategory>(PLAYER_CATEGORIES[2]); // Default to 3ra
    
    const categoryRanking = rankings.find(r => r.category === selectedCategory);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Ranking de Jugadores</h3>
                <div className="relative">
                    <select 
                        value={selectedCategory} 
                        onChange={e => setSelectedCategory(e.target.value as PlayerCategory)}
                        className="appearance-none w-full bg-dark-tertiary border border-dark-tertiary rounded-md py-2 pl-3 pr-10 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        {PLAYER_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat} Categoría</option>)}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-light-secondary">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            
            <div className="bg-dark-secondary rounded-lg overflow-hidden border border-dark-tertiary">
                {categoryRanking && categoryRanking.players.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-light-primary">
                            <thead className="text-xs text-light-secondary uppercase bg-dark-primary/40">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-center">Puesto</th>
                                    <th scope="col" className="px-6 py-3">Jugador</th>
                                    <th scope="col" className="px-6 py-3 text-right">Puntos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryRanking.players.map((player, index) => (
                                    <tr key={player.playerId} className="border-b border-dark-tertiary hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-lg text-center">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-yellow-400 text-gray-900' : index === 1 ? 'bg-gray-400 text-gray-900' : index === 2 ? 'bg-yellow-600 text-white' : 'bg-dark-tertiary'}`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium whitespace-nowrap">{player.name}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-xl text-primary">{player.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-light-secondary py-12 px-6">
                        <p className="text-lg">No hay datos de ranking para esta categoría todavía.</p>
                        <p className="mt-2 text-sm">¡Completa un torneo para empezar a sumar puntos!</p>
                    </div>
                )}
            </div>

            <p className="text-center text-slate-500 mt-6 text-sm">
                El ranking se actualiza al finalizar cada torneo. A fin de año, los jugadores mejor posicionados podrán ascender de categoría.
            </p>
        </div>
    );
};

export default RankingPage;