
import React, { useState, useMemo } from 'react';
import { Tournament, Group, GroupMatch, Team, KnockoutMatch, TournamentRegistration } from '../types';
import KnockoutBracket from './KnockoutBracket';
import { getWinnerFromScore, generateRandomScore } from '../services/rankingService';

interface TournamentDetailPageProps {
    tournament: Tournament;
    onUpdateTournament: (updatedTournament: Tournament) => void;
    onBack: () => void;
    onRegistrationAction: (tournamentId: string, registrationId: string, status: 'approved' | 'rejected') => void;
    onGenerateGroups: (tournamentId: string) => void;
}

type ActiveTab = 'groups' | 'knockout' | 'registrations';

const RegistrationCard: React.FC<{
    registration: TournamentRegistration;
    onAction: (regId: string, status: 'approved' | 'rejected') => void;
    isFull: boolean;
}> = ({ registration, onAction, isFull }) => {
    const statusClasses = {
        pending: 'border-yellow-500/50',
        approved: 'border-green-500/50',
        rejected: 'border-red-500/50'
    };
    const statusText = {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado'
    }

    return (
        <div className={`bg-dark-tertiary p-4 rounded-lg border-l-4 ${statusClasses[registration.status]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-white">{registration.teamName}</p>
                    <div className="text-sm text-light-secondary mt-1">
                        {registration.playerDetails.map(p => (
                            <p key={p.id}>{p.name} ({p.category})</p>
                        ))}
                    </div>
                </div>
                <span className="text-xs font-semibold text-light-secondary">{statusText[registration.status]}</span>
            </div>
            {registration.status === 'pending' && (
                <div className="flex gap-2 mt-3 justify-end">
                    <button onClick={() => onAction(registration.id, 'rejected')} className="bg-red-600 text-white font-bold text-xs py-1 px-3 rounded hover:bg-red-500">Rechazar</button>
                    <button onClick={() => onAction(registration.id, 'approved')} disabled={isFull} className="bg-green-600 text-white font-bold text-xs py-1 px-3 rounded hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isFull ? 'Lleno' : 'Aceptar'}
                    </button>
                </div>
            )}
        </div>
    );
};


const TournamentDetailPage: React.FC<TournamentDetailPageProps> = ({ tournament, onUpdateTournament, onBack, onRegistrationAction, onGenerateGroups }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('registrations');
    const [scores, setScores] = useState<{ [matchId: string]: string }>({});

    const handleScoreChange = (matchId: string, value: string) => {
        setScores(prev => ({ ...prev, [matchId]: value }));
    };

    const calculateStandings = (group: Group): Group['standings'] => {
        const standingsMap = new Map(group.teams.map(t => [t.id, { teamId: t.id, name: t.name, points: 0, played: 0, wins: 0, draws: 0, losses: 0 }]));
        
        group.matches.forEach(m => {
            if (!m.played || !m.score) return;
            const teamAStanding = standingsMap.get(m.teamA.id)!;
            const teamBStanding = standingsMap.get(m.teamB.id)!;
            
            teamAStanding.played += 1;
            teamBStanding.played += 1;

            const winner = getWinnerFromScore(m.score);
            if (winner === 'A') {
                teamAStanding.wins += 1;
                teamAStanding.points += 3;
                teamBStanding.losses += 1;
            } else if (winner === 'B') {
                teamBStanding.wins += 1;
                teamBStanding.points += 3;
                teamAStanding.losses += 1;
            }
        });

        return Array.from(standingsMap.values()).sort((a, b) => b.points - a.points);
    };

    const handleSaveGroupResult = (groupIndex: number, matchIndex: number) => {
        const match = tournament.data.groups![groupIndex].matches[matchIndex];
        const score = scores[match.id];
        const winner = getWinnerFromScore(score);

        if (!score || !winner) {
            alert("Introduce un resultado válido al mejor de 3 sets (ej: 6-2, 6-3).");
            return;
        }

        let updatedTournament: Tournament = JSON.parse(JSON.stringify(tournament));
        let updatedGroup = updatedTournament.data.groups![groupIndex];
        
        updatedGroup.matches[matchIndex] = { ...match, score, played: true };
        updatedGroup.standings = calculateStandings(updatedGroup);
        
        updatedTournament.data.groups![groupIndex] = updatedGroup;

        onUpdateTournament(updatedTournament);

        setScores(prev => {
            const newScores = {...prev};
            delete newScores[match.id];
            return newScores;
        });
    };

    const allGroupsPlayed = useMemo(() => 
        tournament.data.groups?.every(g => g.matches.every(m => m.played)),
    [tournament.data.groups]);
    
    const handleGenerateKnockout = () => {
        if (!allGroupsPlayed) {
            alert("Deben jugarse todos los partidos de la fase de grupos para generar la fase final.");
            return;
        }
        
        const advancingTeams: Team[] = [];
        tournament.data.groups!.forEach(group => {
            advancingTeams.push(group.teams.find(t => t.id === group.standings[0].teamId)!);
            advancingTeams.push(group.teams.find(t => t.id === group.standings[1].teamId)!);
        });

        const numTeams = advancingTeams.length;
        const knockout: { [key: string]: KnockoutMatch[] } = {};
        const rounds = [];

        if (numTeams >= 32) rounds.push({ name: 'roundOf32', size: 16 });
        if (numTeams >= 16) rounds.push({ name: 'roundOf16', size: 8 });
        if (numTeams >= 8) rounds.push({ name: 'quarterFinals', size: 4 });
        if (numTeams >= 4) rounds.push({ name: 'semiFinals', size: 2 });
        if (numTeams >= 2) rounds.push({ name: 'final', size: 1 });

        let lastRoundMatches: KnockoutMatch[] = [];

        for (let i = rounds.length - 1; i >= 0; i--) {
            const round = rounds[i];
            const currentRoundMatches: KnockoutMatch[] = [];
            
            for (let j = 0; j < round.size; j++) {
                const nextMatchId = lastRoundMatches.length > 0 ? lastRoundMatches[Math.floor(j/2)].id : null;
                const match: KnockoutMatch = {
                    id: `${round.name}-match-${j}`,
                    round: round.name,
                    played: false,
                    nextMatchId,
                };
                currentRoundMatches.push(match);
            }
            knockout[round.name] = currentRoundMatches;
            lastRoundMatches = currentRoundMatches;
        }


        const updatedTournament = {
            ...tournament,
            status: 'Fase Final' as 'Fase Final',
            advancingTeams,
            data: {
                ...tournament.data,
                knockout: {
                    ...(knockout.roundOf32 && { roundOf32: knockout.roundOf32 }),
                    ...(knockout.roundOf16 && { roundOf16: knockout.roundOf16 }),
                    ...(knockout.quarterFinals && { quarterFinals: knockout.quarterFinals }),
                    ...(knockout.semiFinals && { semiFinals: knockout.semiFinals }),
                    ...(knockout.final && { final: knockout.final[0] }),
                }
            }
        };

        onUpdateTournament(updatedTournament);
    };

    const handleGenerateGroupResults = () => {
        if (!window.confirm("Esto generará resultados aleatorios para todos los partidos de grupo no jugados. ¿Continuar?")) {
            return;
        }
    
        const updatedTournament = JSON.parse(JSON.stringify(tournament));
        const updatedGroups = updatedTournament.data.groups.map(group => {
            const updatedMatches = group.matches.map(match => {
                if (match.played) {
                    return match;
                }
                return {
                    ...match,
                    played: true,
                    score: generateRandomScore(),
                };
            });
            const groupWithUpdatedMatches = { ...group, matches: updatedMatches };
            const newStandings = calculateStandings(groupWithUpdatedMatches);
            return {
                ...group,
                matches: updatedMatches,
                standings: newStandings,
            };
        });
        updatedTournament.data.groups = updatedGroups;
        onUpdateTournament(updatedTournament);
    };

    const getTabClass = (tabName: ActiveTab) => `flex-1 py-2 px-1 text-center border-b-2 font-medium cursor-pointer ${activeTab === tabName ? 'border-primary text-primary' : 'border-transparent text-light-secondary hover:text-light-primary'}`;

    const isTournamentFull = tournament.teams.length >= tournament.maxTeams;

    return (
        <div className="bg-dark-secondary p-6 rounded-lg">
            <button onClick={onBack} className="mb-4 text-primary hover:text-primary-hover">&larr; Volver a todos los torneos</button>
            <h2 className="text-3xl font-bold text-white">{tournament.name}</h2>
            <p className="text-light-secondary mb-6">{tournament.category} - {new Date(tournament.date + 'T00:00:00').toLocaleDateString()}</p>

            <div className="border-b border-dark-tertiary mb-6">
                <nav className="flex space-x-4">
                    <button onClick={() => setActiveTab('registrations')} className={getTabClass('registrations')}>Inscripciones</button>
                    <button onClick={() => setActiveTab('groups')} className={getTabClass('groups')}>Fase de Grupos</button>
                    <button onClick={() => setActiveTab('knockout')} className={getTabClass('knockout')}>Fase Final</button>
                </nav>
            </div>
            
            {activeTab === 'registrations' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Solicitudes de Inscripción</h3>
                        <span className="text-lg font-semibold text-primary">{tournament.teams.length} / {tournament.maxTeams} <span className="text-sm text-light-secondary">equipos</span></span>
                    </div>
                    <div className="space-y-3">
                        {tournament.registrations.length === 0 ? (
                             <p className="text-light-secondary text-center py-8">Aún no hay inscripciones.</p>
                        ) : tournament.registrations.map(reg => (
                            <RegistrationCard 
                                key={reg.id} 
                                registration={reg} 
                                onAction={(regId, status) => onRegistrationAction(tournament.id, regId, status)}
                                isFull={isTournamentFull && status === 'approved'}
                            />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'groups' && (
                <>
                   {(!tournament.data.groups || tournament.data.groups.length === 0) ? (
                        <div className="text-center p-8">
                             <h3 className="text-xl text-white">Fase de Grupos</h3>
                             <p className="text-light-secondary mt-2 mb-4">Una vez que tengas todos los equipos aprobados, puedes generar los grupos.</p>
                             <button onClick={() => onGenerateGroups(tournament.id)} disabled={tournament.teams.length < 2} className="bg-primary text-dark-primary font-bold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-gray-500">
                                 Generar Grupos
                             </button>
                        </div>
                   ) : (
                     <>
                        <div className="text-right mb-4">
                            <button onClick={handleGenerateGroupResults} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors text-sm">
                               Generar Resultados (Grupos)
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tournament.data.groups?.map((group, gIndex) => (
                                <div key={group.name} className="bg-dark-primary/50 p-4 rounded-lg">
                                    <h3 className="text-xl font-bold text-primary mb-3">{group.name}</h3>
                                    <table className="w-full text-sm text-left text-light-primary">
                                        <thead className="text-xs text-light-secondary uppercase bg-dark-tertiary">
                                            <tr>
                                                <th scope="col" className="px-4 py-2">Equipo</th>
                                                <th scope="col" className="px-2 py-2 text-center">PJ</th>
                                                <th scope="col" className="px-2 py-2 text-center">Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.standings.map(s => (
                                                <tr key={s.teamId} className="border-b border-dark-tertiary">
                                                    <td className="px-4 py-2 font-medium">{group.teams.find(t => t.id === s.teamId)?.name}</td>
                                                    <td className="px-2 py-2 text-center">{s.played}</td>
                                                    <td className="px-2 py-2 text-center font-bold">{s.points}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-4 space-y-2">
                                        {group.matches.map((match, mIndex) => (
                                            <div key={match.id} className="text-xs bg-dark-tertiary/60 p-2 rounded">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="truncate pr-2 flex-1">{match.teamA.name} vs {match.teamB.name}</span>
                                                    {match.played ? (
                                                        <span className="font-bold text-primary">{match.score}</span>
                                                    ) : (
                                                        <div className="flex gap-1 items-center">
                                                            <input 
                                                                type="text" 
                                                                value={scores[match.id] || ''} 
                                                                onChange={(e) => handleScoreChange(match.id, e.target.value)} 
                                                                className="w-24 text-center bg-dark-tertiary rounded"
                                                                placeholder="e.j: 6-2, 6-3"
                                                            />
                                                            <button onClick={() => handleSaveGroupResult(gIndex, mIndex)} className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500">OK</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                   )}
                </>
            )}

            {activeTab === 'knockout' && (
                 <div>
                    {!tournament.data.knockout || Object.keys(tournament.data.knockout).length === 0 ? (
                        <div className="text-center p-8">
                           <h3 className="text-xl text-white">Fase de Eliminatorias</h3>
                           {allGroupsPlayed ? (
                               <div>
                                   <p className="text-light-secondary mt-2 mb-4">¡Todos los partidos de grupo han finalizado! Es hora de generar el cuadro de la fase final.</p>
                                   <button onClick={handleGenerateKnockout} className="bg-primary text-dark-primary font-bold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors">
                                       Generar Fase Final
                                   </button>
                               </div>
                           ) : (
                               <p className="text-light-secondary mt-2">Completa todos los partidos de la fase de grupos para generar el cuadro de eliminatorias.</p>
                           )}
                        </div>
                    ) : (
                        <KnockoutBracket 
                            tournament={tournament}
                            onUpdateMatch={onUpdateTournament}
                        />
                    )}
                 </div>
            )}
        </div>
    );
};

export default TournamentDetailPage;