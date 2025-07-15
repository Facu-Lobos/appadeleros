
import React, { useState, useMemo } from 'react';
import { ClubProfileData, UserProfileData, DayOfWeek } from '../types';
import { DAYS_OF_WEEK, LOCATIONS } from '../constants';

interface PlayerHomePageProps {
    userProfile: UserProfileData;
    allClubs: ClubProfileData[];
    onSelectClub: (clubId: string) => void;
}

const ClubCard: React.FC<{ club: ClubProfileData, onSelect: () => void }> = ({ club, onSelect }) => {
    const dayIndex = (new Date().getDay() + 6) % 7;
    const todayName = DAYS_OF_WEEK[dayIndex];
    const isCurrentlyOpen = club.status === 'Abierto' && club.openingDays.includes(todayName);

    return (
        <div 
            className="bg-dark-secondary rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
            onClick={onSelect}
        >
            <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${club.photos[0]})` }}>
                 <div className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-bold text-white rounded-full shadow-lg ${isCurrentlyOpen ? 'bg-green-600' : 'bg-red-600'}`}>
                    {isCurrentlyOpen ? 'Abierto Ahora' : 'Cerrado Ahora'}
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-xl font-bold text-white">{club.name}</h3>
                <p className="text-sm text-light-secondary">{club.city}</p>
            </div>
        </div>
    )
};


const PlayerHomePage: React.FC<PlayerHomePageProps> = ({ 
    userProfile,
    allClubs, 
    onSelectClub, 
}) => {
    const [selectedCountry, setSelectedCountry] = useState(userProfile.country);
    const [selectedState, setSelectedState] = useState(userProfile.state);
    const [selectedCity, setSelectedCity] = useState(userProfile.city);

    const availableStates = useMemo(() => {
        return Object.keys(LOCATIONS[selectedCountry] || {});
    }, [selectedCountry]);

    const availableCities = useMemo(() => {
        return LOCATIONS[selectedCountry]?.[selectedState] || [];
    }, [selectedCountry, selectedState]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountry = e.target.value;
        setSelectedCountry(newCountry);
        
        const newStates = Object.keys(LOCATIONS[newCountry] || {});
        const firstState = newStates[0] || '';
        setSelectedState(firstState);

        const newCities = LOCATIONS[newCountry]?.[firstState] || [];
        setSelectedCity(newCities[0] || '');
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = e.target.value;
        setSelectedState(newState);

        const newCities = LOCATIONS[selectedCountry]?.[newState] || [];
        setSelectedCity(newCities[0] || '');
    };

    const filteredClubs = useMemo(() => {
        return allClubs.filter(club => 
            club.country === selectedCountry &&
            club.state === selectedState &&
            club.city === selectedCity
        );
    }, [allClubs, selectedCountry, selectedState, selectedCity]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Hola, {userProfile.firstName}</h1>
                <p className="text-light-secondary mt-1">Explora clubes de pádel donde quieras.</p>
            </div>

            {/* Filter Section */}
            <div className="bg-dark-secondary p-4 rounded-lg space-y-4 border border-dark-tertiary">
                <h2 className="text-xl font-bold text-white">Buscar Clubes Por Ubicación</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="country-filter" className="block text-sm font-medium text-light-secondary mb-1">País</label>
                        <select id="country-filter" value={selectedCountry} onChange={handleCountryChange} className="w-full bg-dark-tertiary border border-slate-600/50 text-white rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none">
                            {Object.keys(LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="state-filter" className="block text-sm font-medium text-light-secondary mb-1">Provincia/Estado</label>
                        <select id="state-filter" value={selectedState} onChange={handleStateChange} disabled={availableStates.length === 0} className="w-full bg-dark-tertiary border border-slate-600/50 text-white rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                             {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="city-filter" className="block text-sm font-medium text-light-secondary mb-1">Ciudad</label>
                        <select id="city-filter" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={availableCities.length === 0} className="w-full bg-dark-tertiary border border-slate-600/50 text-white rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Resultados en: <span className="text-primary">{selectedCity || '...'}</span></h2>
                {filteredClubs.length > 0 ? (
                    filteredClubs.map(club => (
                        <ClubCard key={club.id} club={club} onSelect={() => onSelectClub(club.id)} />
                    ))
                ) : (
                    <div className="text-center py-10 bg-dark-secondary rounded-lg">
                        <p className="text-light-primary">No hemos encontrado clubes en la ubicación seleccionada.</p>
                        <p className="text-sm text-slate-500 mt-2">Intenta con otra ciudad o ¡vuelve pronto!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerHomePage;
