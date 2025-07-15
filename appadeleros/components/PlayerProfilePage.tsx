





import React, { useState, useEffect, useRef } from 'react';
import { UserProfileData, PlayerCategory, PlayerAvailability } from '../types';
import { PLAYER_CATEGORIES, LOCATIONS, EllipsisVerticalIcon, ChatBubbleIcon, TrashIcon } from '../constants';

interface PlayerProfilePageProps {
  profile: UserProfileData;
  allPlayers: UserProfileData[];
  onUpdateProfile: (updatedProfile: UserProfileData) => void;
  onDeleteProfile: () => void;
  onStartChat: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
}

const StatCard: React.FC<{ value: number | string; label: string }> = ({ value, label }) => (
    <div className="flex min-w-[100px] flex-1 basis-[fit-content] flex-col gap-2 rounded-lg border border-dark-tertiary bg-dark-secondary p-3 items-center text-center">
        <p className="text-white tracking-light text-2xl font-bold leading-tight">{value}</p>
        <div className="flex items-center gap-2">
            <p className="text-light-secondary text-sm font-normal leading-normal">{label}</p>
        </div>
    </div>
);

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({ profile, allPlayers, onUpdateProfile, onDeleteProfile, onStartChat, onRemoveFriend }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<UserProfileData>(profile);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setEditedProfile(profile);
    }, [profile]);
    
    // Location dropdown logic
    useEffect(() => {
        if(isEditing) {
            const availableStates = Object.keys(LOCATIONS[editedProfile.country] || {});
            setStates(availableStates);
        }
    }, [editedProfile.country, isEditing]);

    useEffect(() => {
        if(isEditing) {
            const availableCities = LOCATIONS[editedProfile.country]?.[editedProfile.state] || [];
            setCities(availableCities);
        }
    }, [editedProfile.state, editedProfile.country, isEditing]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedProfile(prev => ({ ...prev, [name]: value }));
    };
    
    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'country') {
            const availableStates = Object.keys(LOCATIONS[value] || {});
            const newState = availableStates[0] || '';
            const availableCities = LOCATIONS[value]?.[newState] || [];
            const newCity = availableCities[0] || '';
            setEditedProfile(prev => ({...prev, country: value, state: newState, city: newCity}));
        } else if (name === 'state') {
            const availableCities = LOCATIONS[editedProfile.country]?.[value] || [];
            const newCity = availableCities[0] || '';
            setEditedProfile(prev => ({...prev, state: value, city: newCity}));
        } else {
             setEditedProfile(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAvailabilityChange = (item: PlayerAvailability) => {
        setEditedProfile(prev => ({
            ...prev,
            availability: prev.availability.includes(item)
                ? prev.availability.filter(i => i !== item)
                : [...prev.availability, item],
        }));
    };
    
    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToBase64(file);
            setEditedProfile(prev => ({...prev, avatarUrl: base64}));
        }
    };
    
    const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const base64Promises = files.map(file => fileToBase64(file));
            const base64Strings = await Promise.all(base64Promises);
            setEditedProfile(prev => ({...prev, photos: [...prev.photos, ...base64Strings]}));
        }
    };
    
    const removePhoto = (index: number) => {
        setEditedProfile(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    };

    const handleSave = () => {
        onUpdateProfile(editedProfile);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedProfile(profile);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar tu perfil? Esta acción es irreversible y eliminará todos tus datos.')) {
            onDeleteProfile();
        }
    };
    
    if (isEditing) {
        return (
            <div className="relative flex size-full flex-col text-white pb-10 space-y-6">
                <h2 className="text-3xl font-bold">Editar Perfil</h2>
                
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                       <img src={editedProfile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full bg-dark-tertiary border-2 border-primary object-cover" />
                       <input type="file" ref={avatarInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />
                       <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-dark-primary rounded-full p-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                       </button>
                    </div>
                     <div className="flex-1 space-y-2">
                        <input type="text" name="firstName" value={editedProfile.firstName} onChange={handleInputChange} placeholder="Nombre" className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                        <input type="text" name="lastName" value={editedProfile.lastName} onChange={handleInputChange} placeholder="Apellido" className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                </div>

                {/* Category and Location */}
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-light-secondary mb-1">Categoría</label>
                        <select name="category" value={editedProfile.category} onChange={handleInputChange} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none">
                            {PLAYER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div className="space-y-2">
                        <label className="block text-sm font-medium text-light-secondary">Ubicación</label>
                        <select name="country" value={editedProfile.country} onChange={handleLocationChange} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none">
                             {Object.keys(LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                         <select name="state" value={editedProfile.state} onChange={handleLocationChange} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none">
                             {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                         <select name="city" value={editedProfile.city} onChange={handleLocationChange} className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none">
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                
                 {/* Availability */}
                 <div>
                    <label className="block text-sm font-medium text-light-secondary mb-2">Disponibilidad</label>
                    <div className="flex flex-wrap gap-2">
                        {(['Mañanas', 'Tardes', 'Noches', 'Fines de semana', 'Cualquiera'] as PlayerAvailability[]).map(item => (
                            <button key={item} type="button" onClick={() => handleAvailabilityChange(item)} className={`px-3 py-1 text-sm rounded-full transition-colors ${editedProfile.availability.includes(item) ? 'bg-primary text-dark-primary font-bold' : 'bg-dark-tertiary text-light-primary'}`}>
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
                
                 {/* Photo Gallery */}
                 <div>
                    <label className="block text-sm font-medium text-light-secondary mb-2">Mis Fotos</label>
                    <div className="p-4 bg-dark-secondary rounded-lg border border-dark-tertiary">
                       <div className="grid grid-cols-3 gap-4 mb-4">
                           {(editedProfile.photos || []).map((photo, index) => (
                                <div key={index} className="relative aspect-video group">
                                    <img src={photo} alt={`Foto ${index+1}`} className="w-full h-full object-cover rounded-md" />
                                    <button onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                       </div>
                       <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryFileChange} />
                       <button onClick={() => galleryInputRef.current?.click()} type="button" className="w-full bg-dark-tertiary text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors">
                           Añadir Fotos
                       </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                    <button onClick={handleCancel} className="flex-1 bg-slate-600 text-white font-bold py-3 rounded-lg hover:bg-slate-500">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 bg-primary text-dark-primary font-bold py-3 rounded-lg hover:bg-primary-hover">Guardar Cambios</button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex size-full flex-col text-white pb-10">
            {/* User Info */}
            <div className="flex p-4 @container">
                <div className="flex w-full flex-col gap-4 items-center">
                    <div className="flex gap-4 flex-col items-center">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 border-2 border-primary"
                            style={{ backgroundImage: `url("${profile.avatarUrl}")` }}
                        ></div>
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">{profile.firstName} {profile.lastName}</p>
                            <p className="text-light-secondary text-base font-normal leading-normal text-center">Categoría: {profile.category} | {profile.city}, {profile.state}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full max-w-[480px] justify-center">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-dark-tertiary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-600 transition-colors"
                        >
                            <span className="truncate">Editar Perfil</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-800 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-red-700 transition-colors"
                        >
                            <span className="truncate">Eliminar Perfil</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 px-4 py-3">
                <StatCard value={profile.stats.matches} label="Partidos" />
                <StatCard value={profile.stats.wins} label="Victorias" />
                <StatCard value={profile.stats.losses} label="Derrotas" />
            </div>

            {/* Friends List */}
            {profile.friends && profile.friends.length > 0 && (
                 <div className="px-4 py-6">
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">Amigos</h2>
                     <div className="space-y-3">
                        {profile.friends.map(friendId => {
                            const friend = allPlayers.find(p => p.id === friendId);
                            if (!friend) return null;
                            return (
                                <div key={friendId} className="flex items-center gap-4 bg-dark-secondary p-3 rounded-lg">
                                    <img src={friend.avatarUrl} alt={friend.firstName} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{friend.firstName} {friend.lastName}</p>
                                        <p className="text-sm text-light-secondary">Categoría: {friend.category}</p>
                                    </div>
                                    <div className="relative" ref={openMenu === friendId ? menuRef : null}>
                                        <button onClick={() => setOpenMenu(openMenu === friendId ? null : friendId)} className="p-1 text-light-secondary hover:text-white rounded-full transition-colors">
                                            <EllipsisVerticalIcon className="h-6 w-6" />
                                        </button>
                                        {openMenu === friendId && (
                                            <div className="absolute right-0 mt-2 w-48 bg-dark-tertiary rounded-md shadow-lg z-20 border border-slate-700/50">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => { onStartChat(friendId); setOpenMenu(null); }}
                                                        className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-light-primary hover:bg-slate-700/30"
                                                    >
                                                      <ChatBubbleIcon className="h-4 w-4" />
                                                      Enviar Mensaje
                                                    </button>
                                                    <button
                                                        onClick={() => { onRemoveFriend(friendId); setOpenMenu(null); }}
                                                        className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700/30"
                                                    >
                                                      <TrashIcon className="h-4 w-4" />
                                                      Eliminar Amigo
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Player Photos */}
            {profile.photos && profile.photos.length > 0 && (
                 <div className="px-4 py-6">
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">Mis Fotos</h2>
                     <div className="grid grid-cols-3 gap-2">
                        {profile.photos.map((photo, index) => (
                            <div key={index} className="aspect-square bg-dark-secondary rounded-lg overflow-hidden">
                                <img src={photo} alt={`Foto del jugador ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Match History */}
            <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Historial de Partidos</h2>
            {profile.matchHistory.map((match, index) => (
                 <div key={index} className="flex items-center gap-4 bg-dark-secondary p-3 mx-4 rounded-lg mb-2">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14"
                        style={{ backgroundImage: `url("${match.imageUrl}")` }}
                    ></div>
                    <div className="flex flex-col justify-center">
                        <p className="text-white text-base font-medium leading-normal line-clamp-1">{match.club}</p>
                        <p className="text-light-secondary text-sm font-normal leading-normal line-clamp-2">
                            <span className={match.result === 'Victoria' ? 'text-green-400' : 'text-red-400'}>{match.result}</span> contra {match.opponent}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PlayerProfilePage;