import { Tournament, Ranking, PlayerCategory, Team } from '../types';

const POINTS = {
    GROUP_MATCH_WIN: 10,
    QUALIFY_GROUP: 25,
    WIN_R32: 30,
    WIN_R16: 40,
    WIN_QF: 60,
    WIN_SF: 90,
    WIN_FINAL: 150,
};

// Function to parse player names from a team name like "Player A / Player B"
export const getPlayersFromTeam = (team: Team): string[] => {
    if (!team || !team.name) return [];
    return team.name.split('/').map(name => name.trim()).filter(Boolean);
};

export const getWinnerFromScore = (score: string): 'A' | 'B' | null => {
    if (!score) return null;
    const sets = score.split(',').map(s => s.trim());
    let setsA = 0;
    let setsB = 0;
    for (const set of sets) {
        const games = set.split('-').map(g => parseInt(g.trim(), 10));
        if (games.length !== 2 || isNaN(games[0]) || isNaN(games[1])) {
            continue; // Invalid set format
        }
        if (games[0] > games[1]) {
            setsA++;
        } else if (games[1] > games[0]) {
            setsB++;
        }
    }
    if (setsA > setsB) return 'A';
    if (setsB > setsA) return 'B';
    return null; // Draw or invalid
};


export const calculateTournamentPoints = (tournament: Tournament): Map<string, number> => {
    const playerPoints = new Map<string, number>();
    const { data: { groups = [], knockout } } = tournament;

    // Helper to add points to players
    const addPoints = (team: Team, points: number) => {
        const players = getPlayersFromTeam(team);
        players.forEach(playerName => {
            playerPoints.set(playerName, (playerPoints.get(playerName) || 0) + points);
        });
    };

    // 1. Group stage points
    groups.forEach(group => {
        // Win points
        group.matches.forEach(match => {
            if (match.played && match.score) {
                const winner = getWinnerFromScore(match.score);
                if (winner === 'A') {
                    addPoints(match.teamA, POINTS.GROUP_MATCH_WIN);
                } else if (winner === 'B') {
                    addPoints(match.teamB, POINTS.GROUP_MATCH_WIN);
                }
            }
        });
        // Qualification points (top 2 from each group)
        const qualifiedTeams = group.standings.slice(0, 2);
        qualifiedTeams.forEach(standing => {
            const team = group.teams.find(t => t.id === standing.teamId);
            if (team) {
                addPoints(team, POINTS.QUALIFY_GROUP);
            }
        });
    });

    // 2. Knockout stage points
    if (knockout) {
        Object.values(knockout).forEach(roundOrMatch => {
            if (!roundOrMatch) return;
            const matches = Array.isArray(roundOrMatch) ? roundOrMatch : [roundOrMatch];
            matches.forEach(match => {
                if (match.played && match.winner) {
                    let points = 0;
                    switch (match.round) {
                        case 'roundOf32': points = POINTS.WIN_R32; break;
                        case 'roundOf16': points = POINTS.WIN_R16; break;
                        case 'quarterFinals': points = POINTS.WIN_QF; break;
                        case 'semiFinals': points = POINTS.WIN_SF; break;
                        case 'final': points = POINTS.WIN_FINAL; break;
                    }
                    addPoints(match.winner, points);
                }
            });
        });
    }

    return playerPoints;
};

export const updateRankingsWithPoints = (currentRankings: Ranking[], playerPoints: Map<string, number>, category: PlayerCategory): Ranking[] => {
    const newRankings: Ranking[] = JSON.parse(JSON.stringify(currentRankings));
    
    let categoryRanking = newRankings.find(r => r.category === category);
    
    if (!categoryRanking) {
        categoryRanking = { category, players: [] };
        newRankings.push(categoryRanking);
    }

    playerPoints.forEach((points, playerName) => {
        let player = categoryRanking!.players.find(p => p.name === playerName);
        if (player) {
            player.points += points;
        } else {
            // Use player name to generate a pseudo-ID
            categoryRanking!.players.push({
                playerId: `player-${playerName.replace(/\s+/g, '-').toLowerCase()}`,
                name: playerName,
                points: points,
            });
        }
    });

    // Sort players by points
    categoryRanking!.players.sort((a, b) => b.points - a.points);

    return newRankings;
};


// --- Test Mode Utils ---

const FAKE_FIRST_NAMES = ["Juan", "Carlos", "Luis", "Miguel", "Javier", "David", "Pedro", "Daniel", "Sergio", "Pablo", "Alejandro", "Andrés", "Santiago", "Ricardo", "Fernando", "Jorge", "Raúl", "Alberto", "Lucía", "Ana", "María", "Sofía", "Laura", "Marta", "Cristina", "Elena", "Isabel", "Carmen"];
const FAKE_LAST_NAMES = ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Romero", "Navarro"];

const generateFakePlayerName = (): string => {
    const firstName = FAKE_FIRST_NAMES[Math.floor(Math.random() * FAKE_FIRST_NAMES.length)];
    const lastName = FAKE_LAST_NAMES[Math.floor(Math.random() * FAKE_LAST_NAMES.length)];
    return `${firstName} ${lastName}`;
};

export const generateFakeTeams = (count: number): string => {
    const teams = new Set<string>();
    const usedNames = new Set<string>();

    while (teams.size < count) {
        let player1 = generateFakePlayerName();
        while(usedNames.has(player1)) {
            player1 = generateFakePlayerName();
        }
        usedNames.add(player1);

        let player2 = generateFakePlayerName();
        while(usedNames.has(player2)) {
            player2 = generateFakePlayerName();
        }
        usedNames.add(player2);
        
        teams.add(`${player1} / ${player2}`);
    }
    return Array.from(teams).join('\n');
};

export const generateRandomScore = (): string => {
    let setsA = 0;
    let setsB = 0;
    const sets: string[] = [];

    while (setsA < 2 && setsB < 2) {
        let gamesA = 0;
        let gamesB = 0;
        
        const isTiebreak = Math.random() < 0.2; // 20% chance of a close set

        if (isTiebreak) {
            const winnerIsA = Math.random() > 0.5;
            if (winnerIsA) {
                gamesA = 7;
                gamesB = Math.random() > 0.5 ? 6 : 5;
            } else {
                gamesB = 7;
                gamesA = Math.random() > 0.5 ? 6 : 5;
            }
        } else {
             const winnerIsA = Math.random() > 0.5;
            if (winnerIsA) {
                gamesA = 6;
                gamesB = Math.floor(Math.random() * 5); // 0-4
            } else {
                gamesB = 6;
                gamesA = Math.floor(Math.random() * 5);
            }
        }
        
        if (gamesA > gamesB) setsA++; else setsB++;
        sets.push(`${gamesA}-${gamesB}`);
    }

    return sets.join(', ');
};