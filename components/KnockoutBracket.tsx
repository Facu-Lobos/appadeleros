import React, { useState, useMemo } from 'react';
import { Tournament, KnockoutMatch, Team } from '../types';
import { getWinnerFromScore, generateRandomScore } from '../services/rankingService';

interface KnockoutBracketProps {
    tournament: Tournament;
    onUpdateMatch: (updatedTournament: Tournament) => void;
}

const MatchCard = ({ match, roundName, availableTeams, onUpdate, isFirstRound }: { match: KnockoutMatch, roundName: string, availableTeams: Team[], onUpdate: (match: KnockoutMatch, teamSlot: 'teamA' | 'teamB', team: Team | null, score?: string) => void, isFirstRound: boolean }) => {
    const [score, setScore] = useState(match.score ?? '');
    
    const handleTeamSelect = (teamSlot: 'teamA' | 'teamB', teamId: string) => {
        const team = availableTeams.find(t => t.id === teamId) || null;
        onUpdate(match, teamSlot, team);
    };

    const handleSaveScore = () => {
        onUpdate(match, 'teamA', match.teamA!, score);
    };

    return (
        <div className="bg-dark-secondary rounded-lg p-3 w-64 space-y-2 border border-dark-tertiary">
            {/* Team A */}
            <div className="flex items-center justify-between">
                {isFirstRound && !match.teamA ? (
                    <select onChange={(e) => handleTeamSelect('teamA', e.target.value)} defaultValue="" className="w-full bg-dark-tertiary text-sm p-1 rounded border border-slate-600">
                        <option value="">Seleccionar equipo</option>
                        {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                ) : (
                    <span className={`flex-1 truncate ${match.winner?.id === match.teamA?.id ? 'font-bold text-primary' : 'text-light-primary'}`}>{match.teamA?.name ?? '---'}</span>
                )}
            </div>

            {/* Team B */}
            <div className="flex items-center justify-between">
                {isFirstRound && !match.teamB ? (
                     <select onChange={(e) => handleTeamSelect('teamB', e.target.value)} defaultValue="" className="w-full bg-dark-tertiary text-sm p-1 rounded border border-slate-600">
                        <option value="">Seleccionar equipo</option>
                        {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                ) : (
                     <span className={`flex-1 truncate ${match.winner?.id === match.teamB?.id ? 'font-bold text-primary' : 'text-light-primary'}`}>{match.teamB?.name ?? '---'}</span>
                )}
            </div>
            
            {!match.played && match.teamA && match.teamB ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                    <input 
                        type="text" 
                        value={score} 
                        onChange={e => setScore(e.target.value)} 
                        className="w-full text-center bg-dark-tertiary rounded"
                        placeholder="e.j: 6-2, 6-3"
                    />
                    <button onClick={handleSaveScore} className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 transition-colors">OK</button>
                </div>
            ) : (
                 match.score && <p className="text-center font-bold text-primary pt-1">{match.score}</p>
            )}
        </div>
    )
}


const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ tournament, onUpdateMatch }) => {
    const { data: { knockout }, advancingTeams = [] } = tournament;

    const assignedTeams = useMemo(() => {
        const teamIds = new Set<string>();
        if (!knockout) return teamIds;
        Object.values(knockout).forEach(roundOrMatch => {
            if (!roundOrMatch) return;
            const matches = Array.isArray(roundOrMatch) ? roundOrMatch : [roundOrMatch];
            matches.forEach(match => {
                if (match?.teamA) teamIds.add(match.teamA.id);
                if (match?.teamB) teamIds.add(match.teamB.id);
            });
        });
        return teamIds;
    }, [knockout]);

    const availableTeams = useMemo(() => advancingTeams.filter(t => !assignedTeams.has(t.id)), [advancingTeams, assignedTeams]);

    const handleUpdate = (match: KnockoutMatch, teamSlot: 'teamA' | 'teamB', team: Team | null, scoreStr?: string) => {
        let updatedTournament: Tournament = JSON.parse(JSON.stringify(tournament));
        const knockoutData = updatedTournament.data.knockout;
        
        const updateMatchInRound = (m: KnockoutMatch) => {
            if (team) {
                 m[teamSlot] = team;
            }

            if (scoreStr) {
                const winner = getWinnerFromScore(scoreStr);
                if (winner) {
                    m.score = scoreStr;
                    m.played = true;
                    m.winner = winner === 'A' ? m.teamA : m.teamB;
                    
                    if (m.round === 'final' && m.winner) {
                        updatedTournament.status = 'Finalizado';
                    }

                    // Advance Winner
                    if(m.winner && m.nextMatchId) {
                        Object.keys(knockoutData).forEach(rName => {
                             const round = knockoutData[rName];
                             if (!round) return;
                             const nextMatch = (Array.isArray(round) ? round : [round]).find(nm => nm.id === m.nextMatchId);
                             if (nextMatch) {
                                 const roundMatches = knockoutData[m.round];
                                 const originalMatchIndex = (Array.isArray(roundMatches) ? roundMatches : [roundMatches]).findIndex(om => om.id === m.id);
                                 if (originalMatchIndex % 2 === 0) {
                                     nextMatch.teamA = m.winner;
                                 } else {
                                     nextMatch.teamB = m.winner;
                                 }
                             }
                        });
                    }
                } else {
                    alert("Resultado inválido. Introduce un resultado al mejor de 3 sets (ej: 6-2, 6-3).");
                }
            }
        }
        
        Object.keys(knockoutData).forEach(roundName => {
            const round = knockoutData[roundName];
            if (!round) return;
            const matchToUpdate = (Array.isArray(round) ? round : [round]).find(m => m.id === match.id);
            if(matchToUpdate) {
                updateMatchInRound(matchToUpdate);
            }
        });
        
        onUpdateMatch(updatedTournament);
    };

    const handleSimulateKnockout = () => {
        if (!window.confirm("Esto simulará toda la fase final con resultados aleatorios. ¿Continuar?")) return;
        
        let updatedTournament = JSON.parse(JSON.stringify(tournament));
        let knockoutData = updatedTournament.data.knockout;

        const rounds = ['roundOf32', 'roundOf16', 'quarterFinals', 'semiFinals', 'final'].filter(r => knockoutData[r]);
        
        rounds.forEach(roundName => {
            let round = knockoutData[roundName];
            if (!round) return;
            let matches = Array.isArray(round) ? round : [round];

            matches.forEach(match => {
                if (match.teamA && match.teamB && !match.played) {
                    match.score = generateRandomScore();
                    const winner = getWinnerFromScore(match.score);
                    match.played = true;
                    match.winner = winner === 'A' ? match.teamA : match.teamB;
                    
                    if(match.winner && match.nextMatchId) {
                         Object.keys(knockoutData).forEach(rName => {
                             const nextRound = knockoutData[rName];
                             if (!nextRound) return;
                             const nextMatch = (Array.isArray(nextRound) ? nextRound : [nextRound]).find(nm => nm.id === match.nextMatchId);
                             if (nextMatch) {
                                 const roundMatches = knockoutData[match.round];
                                 const originalMatchIndex = (Array.isArray(roundMatches) ? roundMatches : [roundMatches]).findIndex(om => om.id === match.id);
                                 if (originalMatchIndex % 2 === 0) {
                                     nextMatch.teamA = match.winner;
                                 } else {
                                     nextMatch.teamB = match.winner;
                                 }
                             }
                        });
                    }
                }
            });
        });

        updatedTournament.status = 'Finalizado';
        onUpdateMatch(updatedTournament);
    }

    const rounds = knockout ? [
        { name: 'roundOf32', title: '32avos', data: knockout.roundOf32 },
        { name: 'roundOf16', title: 'Octavos', data: knockout.roundOf16 },
        { name: 'quarterFinals', title: 'Cuartos', data: knockout.quarterFinals },
        { name: 'semiFinals', title: 'Semifinal', data: knockout.semiFinals },
        { name: 'final', title: 'Final', data: knockout.final ? [knockout.final] : undefined },
    ].filter(r => r.data && r.data.length > 0) : [];

    return (
        <div className="p-4 overflow-x-auto">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Cuadro de Fase Final</h3>
                 {tournament.status === 'Fase Final' && (
                     <button onClick={handleSimulateKnockout} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors text-sm">
                        Simular Fase Final
                     </button>
                 )}
             </div>
             { tournament.status === 'Fase Final' && availableTeams.length > 0 && (
                <div className="mb-4 p-3 bg-dark-secondary rounded-lg">
                    <h4 className="font-semibold text-primary">Equipos clasificados por asignar:</h4>
                    <p className="text-sm text-light-secondary">{availableTeams.map(t => t.name).join(', ')}</p>
                </div>
             )}
            <div className="flex space-x-12">
                {rounds.map(({ name, title, data }, roundIndex) => (
                    <div key={name} className="flex flex-col justify-around min-w-max">
                         <h4 className="text-center font-bold text-lg text-white mb-6">{title}</h4>
                        <div className="space-y-12">
                            {(data as KnockoutMatch[]).map((match) => (
                                <MatchCard 
                                    key={match.id}
                                    match={match}
                                    roundName={name}
                                    availableTeams={availableTeams}
                                    onUpdate={handleUpdate}
                                    isFirstRound={roundIndex === 0}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KnockoutBracket;