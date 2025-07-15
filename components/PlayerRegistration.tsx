
import React, { useState, useEffect } from 'react';
import { UserProfileData, PlayerCategory, PlayerSex, PlayerAvailability } from '../types';
import { PLAYER_CATEGORIES, LOCATIONS } from '../constants';

interface PlayerRegistrationProps {
    onRegister: (profile: Omit<UserProfileData, 'id' | 'avatarUrl' | 'photos' | 'stats' | 'upcomingMatches' | 'matchHistory' | 'friends' | 'friendRequests' | 'notifications'>) => void;
    onBack: () => void;
}

const PlayerRegistration: React.FC<PlayerRegistrationProps> = ({ onRegister, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [sex, setSex] = useState<PlayerSex>('Masculino');
    const [category, setCategory] = useState<PlayerCategory>('4ta');
    
    const [country, setCountry] = useState('Argentina');
    const [state, setState] = useState('Buenos Aires');
    const [city, setCity] = useState('');
    
    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    
    const [availability, setAvailability] = useState<PlayerAvailability[]>([]);

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

    const sexes: PlayerSex[] = ['Masculino', 'Femenino', 'Otro'];
    const availabilities: PlayerAvailability[] = ['Mañanas', 'Tardes', 'Noches', 'Fines de semana', 'Cualquiera'];

    const handleAvailabilityChange = (item: PlayerAvailability) => {
        setAvailability(prev => 
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim() && password.trim() && firstName.trim() && lastName.trim() && country && state && city) {
            onRegister({
                email,
                password,
                firstName,
                lastName,
                sex,
                category,
                country,
                state,
                city,
                availability,
            });
        }
    };

    return (
        <div className="min-h-screen bg-dark-primary flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg bg-dark-secondary p-8 rounded-lg shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Registro de Jugador</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Email" required />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Contraseña" required />
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Nombre" required />
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Apellido" required />
                        <select value={sex} onChange={(e) => setSex(e.target.value as PlayerSex)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                            {sexes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={category} onChange={(e) => setCategory(e.target.value as PlayerCategory)} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                            {PLAYER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-4 rounded-md border border-dark-tertiary p-4">
                        <h3 className="text-lg font-medium text-light-primary">Ubicación</h3>
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

                    <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Disponibilidad</label>
                        <div className="flex flex-wrap gap-2">
                            {availabilities.map(item => (
                                <button key={item} type="button" onClick={() => handleAvailabilityChange(item)} className={`px-3 py-1 text-sm rounded-full transition-colors ${availability.includes(item) ? 'bg-primary text-dark-primary font-bold' : 'bg-dark-tertiary text-light-primary'}`}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col space-y-4 pt-4">
                        <button type="submit" className="w-full bg-primary text-dark-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-gray-500" disabled={!email || !password || !firstName || !lastName || !city}>
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

export default PlayerRegistration;