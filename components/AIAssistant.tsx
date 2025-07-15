

import React, { useState, useCallback } from 'react';
import { PlayerSuggestion, UserProfileData } from '../types';
import { findMatch } from '../services/geminiService';
import Spinner from './Spinner';
import { SparklesIcon } from '../constants';

interface AIAssistantProps {
    userProfile: UserProfileData;
}

const SuggestionCard: React.FC<{ player: PlayerSuggestion }> = ({ player }) => (
    <div className="bg-dark-tertiary/60 p-4 rounded-lg border border-primary/20 transform hover:scale-105 transition-transform duration-300 flex items-start gap-4">
        <img 
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${player.name}`} 
            alt={player.name} 
            className="w-16 h-16 rounded-full bg-dark-primary border-2 border-primary/50"
        />
        <div className="flex-1">
            <h4 className="font-bold text-primary">{player.name}</h4>
            <p className="text-sm text-light-primary">Categoría: {player.category}</p>
            <p className="text-sm text-light-secondary mt-1">{player.shortBio}</p>
        </div>
    </div>
);


const AIAssistant: React.FC<AIAssistantProps> = ({ userProfile }) => {
    const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleFindMatch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        setSearched(true);
        try {
            const result = await findMatch(userProfile);
            setSuggestions(result);
        } catch (e: any) {
            setError(e.message || 'No se pudo contactar al asistente de IA. Inténtalo de nuevo más tarde.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile]);

    return (
        <div className="bg-dark-secondary p-6 rounded-2xl border border-dark-tertiary shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
                <SparklesIcon className="h-8 w-8 text-accent" />
                <div>
                    <h2 className="text-2xl font-bold text-white">Matchmaker con IA</h2>
                    <p className="text-light-secondary">¿Buscas compañero/a para un partido? Deja que la IA te ayude.</p>
                </div>
            </div>

            <button
                onClick={handleFindMatch}
                disabled={isLoading}
                className="w-full bg-accent text-dark-primary font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 disabled:bg-gray-500 flex items-center justify-center gap-2 shadow-lg"
            >
                {isLoading ? <Spinner /> : <SparklesIcon className="h-5 w-5" />}
                Encontrar mi pareja de pádel ideal
            </button>

            <div className="mt-6 min-h-[100px]">
                {isLoading && (
                    <div className="flex justify-center items-center py-8">
                        <Spinner />
                    </div>
                )}
                {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
                {!isLoading && !error && searched && (
                    suggestions.length > 0 ? (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-semibold text-white">Compañeros sugeridos para ti:</h3>
                            {suggestions.map((player, index) => (
                                <SuggestionCard key={index} player={player} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-light-secondary py-8">
                            <p>No se encontraron sugerencias esta vez. ¡Inténtalo de nuevo!</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default AIAssistant;