
import React, { useState, useEffect } from 'react';
import { ClubProfileData, CourtData, CourtDetails, DayOfWeek } from '../types';
import { generateTimeSlots, LOCATIONS, DAYS_OF_WEEK } from '../constants';

interface ClubRegistrationProps {
    onRegister: (profile: ClubProfileData, courts: CourtData[]) => void;
    onBack: () => void;
}

const ClubRegistration: React.FC<ClubRegistrationProps> = ({ onRegister, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [memberId, setMemberId] = useState('');
    const [clubName, setClubName] = useState('');
    
    const [country, setCountry] = useState('Argentina');
    const [state, setState] = useState('Buenos Aires');
    const [city, setCity] = useState('');

    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [openingTime, setOpeningTime] = useState('08:00');
    const [closingTime, setClosingTime] = useState('23:00');
    const [turnDuration, setTurnDuration] = useState(90);
    const [hasBuffet, setHasBuffet] = useState(true);
    const [photos, setPhotos] = useState('');
    const [courts, setCourts] = useState<CourtDetails[]>([{ name: 'Pista 1', type: 'Cristal', location: 'Indoor', surface: 'Alfombra' }]);
    const [openingDays, setOpeningDays] = useState<DayOfWeek[]>(DAYS_OF_WEEK);
    const [status, setStatus] = useState<'Abierto' | 'Cerrado'>('Abierto');
    
    useEffect(() => {
        const availableStates = Object.keys(LOCATIONS[country] || {});
        setStates(availableStates);
        if (availableStates.length > 0) {
            setState(availableStates[0]);
        } else {
            setState('');
        }
    }, [country]);

    useEffect(() => {
        if (state) {
            const availableCities = LOCATIONS[country]?.[state] || [];
            setCities(availableCities);
            if (availableCities.length > 0) {
                setCity(availableCities[0]);
            } else {
                setCity('');
            }
        } else {
            setCities([]);
            setCity('');
        }
    }, [state, country]);

    const handleOpeningDaysChange = (day: DayOfWeek) => {
        setOpeningDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleCourtChange = (index: number, field: keyof CourtDetails, value: string) => {
        const newCourts = [...courts];
        (newCourts[index] as any)[field] = value;
        setCourts(newCourts);
    };

    const addCourt = () => {
        setCourts([...courts, { name: `Pista ${courts.length + 1}`, type: 'Cristal', location: 'Indoor', surface: 'Alfombra' }]);
    };
    
    const removeCourt = (index: number) => {
        if(courts.length > 1) {
            const newCourts = courts.filter((_, i) => i !== index);
            setCourts(newCourts);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clubName.trim() && courts.length > 0 && email.trim() && password.trim() && memberId.trim() && country && state && city) {
            const clubId = `club-${Date.now()}`;
            const clubProfile: ClubProfileData = {
                id: clubId,
                country,
                state,
                city,
                email,
                password,
                memberId,
                name: clubName,
                totalCourts: courts.length,
                courtDetails: courts,
                openingTime,
                closingTime,
                turnDuration,
                hasBuffet,
                openingDays,
                status,
                photos: photos.split('\n').filter(url => url.trim() !== ''),
                notifications: [],
            };
            const newCourts: CourtData[] = courts.map((cd, i) => ({
                ...cd,
                id: `court-${clubId}-${i}`,
                clubId,
                clubName: clubProfile.name,
                timeSlots: generateTimeSlots(openingTime, closingTime, turnDuration),
            }));
            onRegister(clubProfile, newCourts);
        }
    };

    return (
       <div className="min-h-screen bg-dark-primary flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-2xl bg-dark-secondary p-8 rounded-lg shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Registro de Club</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Nombre del Club" required />
                        <input type="text" value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Número de Socio" required />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Email de contacto" required />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Contraseña" required />
                    </div>

                    <div className="space-y-4 rounded-md border border-dark-tertiary p-4">
                        <h3 className="text-lg font-medium text-light-primary">Ubicación del Club</h3>
                         <div>
                            <label htmlFor="country" className="block text-sm font-medium text-light-secondary mb-2">País</label>
                            <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                                {Object.keys(LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-light-secondary mb-2">Provincia/Estado</label>
                            <select id="state" value={state} onChange={(e) => setState(e.target.value)} disabled={!country} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50">
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-light-secondary mb-2">Ciudad</label>
                            <select id="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={!state} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50">
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                            <label className="block text-sm font-medium text-light-secondary mb-2">Horario de Apertura</label>
                            <input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-secondary mb-2">Horario de Cierre</label>
                            <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-secondary mb-2">Duración de Turno</label>
                            <select value={turnDuration} onChange={(e) => setTurnDuration(parseInt(e.target.value, 10))} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="60">60 minutos</option>
                                <option value="90">90 minutos</option>
                                <option value="120">120 minutos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-secondary mb-2">Estado del Club</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as 'Abierto' | 'Cerrado')} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="Abierto">Abierto</option>
                                <option value="Cerrado">Cerrado</option>
                            </select>
                        </div>
                         <div className="flex items-center pt-8 md:col-span-2">
                             <input type="checkbox" id="hasBuffet" checked={hasBuffet} onChange={(e) => setHasBuffet(e.target.checked)} className="h-5 w-5 rounded text-primary bg-dark-tertiary border-dark-tertiary focus:ring-primary" />
                             <label htmlFor="hasBuffet" className="ml-3 block text-base font-medium text-light-primary">¿Tiene buffet?</label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Días de Apertura</label>
                        <div className="flex flex-wrap gap-2 bg-dark-primary/50 p-3 rounded-md border border-dark-tertiary">
                            {DAYS_OF_WEEK.map(day => (
                                <button key={day} type="button" onClick={() => handleOpeningDaysChange(day)} className={`px-3 py-1 text-sm rounded-full transition-colors ${openingDays.includes(day) ? 'bg-primary text-dark-primary font-bold' : 'bg-dark-tertiary text-light-primary'}`}>
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Fotos del Club (una URL por línea)</label>
                        <textarea value={photos} onChange={(e) => setPhotos(e.target.value)} rows={3} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"></textarea>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Configuración de Pistas</h3>
                        {courts.map((court, index) => (
                            <div key={index} className="bg-dark-primary/50 p-4 rounded-lg border border-dark-tertiary grid grid-cols-1 md:grid-cols-3 gap-4">
                               <input value={court.name} onChange={e => handleCourtChange(index, 'name', e.target.value)} className="md:col-span-3 w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Nombre de la pista"/>
                               <select value={court.type} onChange={e => handleCourtChange(index, 'type', e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary">
                                   <option>Cristal</option><option>Muro</option>
                               </select>
                               <select value={court.location} onChange={e => handleCourtChange(index, 'location', e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary">
                                   <option>Indoor</option><option>Outdoor</option>
                               </select>
                               <select value={court.surface} onChange={e => handleCourtChange(index, 'surface', e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary">
                                   <option>Alfombra</option><option>Cemento</option>
                               </select>
                                {courts.length > 1 && <button type="button" onClick={() => removeCourt(index)} className="md:col-span-3 bg-red-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-red-500">Eliminar Pista</button>}
                            </div>
                        ))}
                        <button type="button" onClick={addCourt} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500">+ Añadir otra pista</button>
                    </div>

                    <div className="flex flex-col space-y-4 pt-4">
                        <button type="submit" className="w-full bg-primary text-dark-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-gray-500" disabled={!clubName.trim() || !email.trim() || !password.trim() || !memberId.trim() || !city}>
                            Completar Registro
                        </button>
                         <button type="button" onClick={onBack} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-500 transition-colors">
                            Volver
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClubRegistration;