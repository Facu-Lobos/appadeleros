
import { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Tournament, Team, Group, GroupMatch, UserProfileData, NotificationType, TournamentRegistration, ToastMessage, Ranking, Database, PlayerRankingEntry, Json } from '../types';
import { calculateTournamentPoints, updateRankingsWithPoints } from '../services/rankingService';

const createGroups = (teams: Team[], teamsPerGroup: number): Group[] => {
    const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
    const numGroups = Math.ceil(teams.length / teamsPerGroup);
    const groups: Group[] = [];
    
    for (let i = 0; i < numGroups; i++) {
        const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
        if (groupTeams.length === 0) continue;
        const matches: GroupMatch[] = [];
        
        for (let j = 0; j < groupTeams.length; j++) {
            for (let k = j + 1; k < groupTeams.length; k++) {
                matches.push({
                    id: `m-${i}-${j}-${k}-${Date.now()}`,
                    teamA: groupTeams[j],
                    teamB: groupTeams[k],
                    played: false,
                });
            }
        }
        
        groups.push({
            name: `Grupo ${String.fromCharCode(65 + i)}`,
            teams: groupTeams,
            matches,
            standings: groupTeams.map(t => ({ teamId: t.id, name: t.name, points: 0, played: 0, wins: 0, draws: 0, losses: 0 })),
        });
    }
    return groups;
};

type useTournamentManagerProps = {
    showToast: (message: ToastMessage) => void;
    userProfile: UserProfileData | null;
    allPlayers: UserProfileData[];
    initialTournaments: Tournament[];
    rankings: Ranking[];
    setRankings: (rankings: Ranking[]) => void;
};

export const useTournamentManager = ({ showToast, userProfile, allPlayers, initialTournaments, rankings, setRankings }: useTournamentManagerProps) => {
    const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

    const handleCreateTournament = useCallback(async (tournament: Tournament) => {
        if (!supabase) return;
        const tournamentToInsert: Database['public']['Tables']['tournaments']['Insert'] = {
            id: tournament.id,
            club_id: tournament.club_id,
            name: tournament.name,
            category: tournament.category,
            date: tournament.date,
            status: tournament.status,
            format: tournament.format,
            teams: tournament.teams,
            max_teams: tournament.max_teams,
            teams_per_group: tournament.teams_per_group,
            data: tournament.data,
            advancing_teams: tournament.advancing_teams || null,
        };

        const { data: dbData, error } = await supabase.from('tournaments').insert(tournamentToInsert).select('*, tournament_registrations(*)').single();
        if (error) {
            showToast({ text: `Error al crear el torneo: ${error.message}`, type: 'error'});
        } else if (dbData) {
            setTournaments(prev => [...prev, dbData as unknown as Tournament]);
            showToast({ text: "Torneo creado con éxito.", type: 'success'});
        }
    }, [showToast]);
    
    const handleUpdateTournament = useCallback(async (updatedTournament: Tournament) => {
        if (!supabase) return;

        const tournamentToUpdate: Database['public']['Tables']['tournaments']['Update'] = {
            name: updatedTournament.name,
            category: updatedTournament.category,
            date: updatedTournament.date,
            status: updatedTournament.status,
            format: updatedTournament.format,
            teams: updatedTournament.teams,
            data: updatedTournament.data,
            club_id: updatedTournament.club_id,
            max_teams: updatedTournament.max_teams,
            teams_per_group: updatedTournament.teams_per_group,
            advancing_teams: updatedTournament.advancing_teams,
        };

        const { data, error } = await supabase.from('tournaments').update(tournamentToUpdate).eq('id', updatedTournament.id).select('*, tournament_registrations(*)').single();
        if (error) {
            showToast({ text: `Error al actualizar el torneo: ${error.message}`, type: 'error'});
        } else if (data) {
            const newTournament = data as unknown as Tournament;
            setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? newTournament : t));
            
            // --- NEW LOGIC: UPDATE RANKING ON FINISH ---
            if (newTournament.status === 'Finalizado') {
                const points = calculateTournamentPoints(newTournament);
                const newRankings = updateRankingsWithPoints(rankings, points, newTournament.category);

                const rankingsToUpsert: Database['public']['Tables']['rankings']['Insert'][] = newRankings
                    .filter(r => playerPoints.size > 0 && r.category === newTournament.category) // Only upsert the affected category
                    .map(r => ({
                        category: r.category,
                        players: r.players,
                    }));
                
                if (rankingsToUpsert.length > 0) {
                     const { error: rankingError } = await supabase
                        .from('rankings')
                        .upsert(
                            rankingsToUpsert,
                            { onConflict: 'category' }
                        );
            
                    if (rankingError) {
                        showToast({ text: `Error al actualizar el ranking: ${rankingError.message}`, type: 'error'});
                    } else {
                        setRankings(newRankings);
                        showToast({ text: "¡Torneo finalizado y ranking actualizado!", type: 'success' });
                    }
                }
            }
        }
    }, [showToast, rankings, setRankings]);

    const handleTournamentRegistrationRequest = useCallback(async (tournamentId: string, teamName: string, partnerEmail: string) => {
        if (!userProfile || !supabase) return;

        const partner = allPlayers.find(p => p.email === partnerEmail);
        if (!partner) {
            showToast({ text: "No se encontró ningún jugador con ese email.", type: 'error'});
            return;
        }
        if (partner.id === userProfile.id) {
            showToast({ text: "No puedes ser tu propio compañero de equipo.", type: 'error'});
            return;
        }

        const newRegistrationForDb: Database['public']['Tables']['tournament_registrations']['Insert'] = {
            tournament_id: tournamentId,
            team_name: teamName,
            player_ids: [userProfile.id, partner.id],
            player_details: [
                { id: userProfile.id, name: `${userProfile.first_name} ${userProfile.last_name}`, category: userProfile.category },
                { id: partner.id, name: `${partner.first_name} ${partner.last_name}`, category: partner.category },
            ],
            status: 'pending',
        };
        
        const { data, error } = await supabase.from('tournament_registrations').insert(newRegistrationForDb).select().single();

        if (error || !data) {
            showToast({ text: `Error al enviar la inscripción: ${error?.message}`, type: 'error'});
            return;
        }
        
        const registrationData = data as TournamentRegistration;

        const tournamentToUpdate = tournaments.find(t => t.id === tournamentId);
        if (!tournamentToUpdate) return;
        
        const clubNotification: Database['public']['Tables']['notifications']['Insert'] = {
            type: 'tournament_registration' as const,
            title: 'Nueva inscripción a torneo',
            message: `El equipo '${teamName}' se ha inscrito en '${tournamentToUpdate.name}'.`,
            link: { view: 'tournaments' as const, params: { tournamentId } },
            user_id: tournamentToUpdate.club_id,
            payload: null,
        };
        await supabase.from('notifications').insert(clubNotification);
        
        setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, tournament_registrations: [...t.tournament_registrations, registrationData] } : t));
        showToast({ text: "¡Inscripción enviada! El club revisará tu solicitud.", type: 'success'});

    }, [userProfile, allPlayers, tournaments, showToast]);

    const handleRegistrationAction = useCallback(async (tournamentId: string, registrationId: string, status: 'approved' | 'rejected') => {
        if (!supabase) return;
        
        const update: Database['public']['Tables']['tournament_registrations']['Update'] = { status };
        const { data: updatedReg, error } = await supabase.from('tournament_registrations').update(update).eq('id', registrationId).select().single();
        if(error || !updatedReg) {
            showToast({ text: `Error al actualizar la inscripción: ${error?.message}`, type: 'error'});
            return;
        }

        const registrationToNotify = updatedReg as TournamentRegistration;
        let tournamentToUpdateLocally = tournaments.find(t => t.id === tournamentId);
        if(!tournamentToUpdateLocally) return;

        // Update local tournament state
        const updatedRegistrations = tournamentToUpdateLocally.tournament_registrations.map(r => r.id === registrationId ? { ...r, status } : r);
        let updatedTeams = tournamentToUpdateLocally.teams;
        
        if (status === 'approved') {
           updatedTeams = [...tournamentToUpdateLocally.teams, { id: registrationToNotify.id, name: registrationToNotify.team_name, playerIds: registrationToNotify.player_ids }];
           const tournamentUpdate: Database['public']['Tables']['tournaments']['Update'] = { teams: updatedTeams };
           await supabase.from('tournaments').update(tournamentUpdate).eq('id', tournamentId);
        }
        
        setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, tournament_registrations: updatedRegistrations, teams: updatedTeams } : t));
        
        const notificationType: NotificationType = status === 'approved' ? 'tournament_approval' : 'tournament_rejection';
        const playerNotification: Omit<Database['public']['Tables']['notifications']['Insert'], 'user_id'> = {
            type: notificationType,
            title: `Inscripción a '${tournamentToUpdateLocally.name}' ${status === 'approved' ? 'Aprobada' : 'Rechazada'}`,
            message: `Tu inscripción para el equipo '${registrationToNotify.team_name}' ha sido ${status === 'approved' ? 'aprobada' : 'rechazada'}.`,
            link: { view: 'tournaments' as const },
        };

        const notificationsToInsert: Database['public']['Tables']['notifications']['Insert'][] = registrationToNotify.player_ids.map(playerId => ({
             ...playerNotification, user_id: playerId 
        }));

        await supabase.from('notifications').insert(notificationsToInsert);
        
    }, [showToast, tournaments]);

    const handleGenerateGroupsForTournament = useCallback(async (tournamentId: string) => {
        if (!supabase) return;
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament) return;

        const groups = createGroups(tournament.teams, tournament.teams_per_group);
        const updatedTournamentData = {
            ...tournament,
            data: { ...tournament.data, groups },
            status: 'Fase de Grupos' as 'Fase de Grupos',
        };
        handleUpdateTournament(updatedTournamentData);
    }, [tournaments, handleUpdateTournament]);

    return {
        tournaments,
        setTournaments,
        selectedTournamentId,
        setSelectedTournamentId,
        handleCreateTournament,
        handleUpdateTournament,
        handleTournamentRegistrationRequest,
        handleRegistrationAction,
        handleGenerateGroupsForTournament,
    };
}
