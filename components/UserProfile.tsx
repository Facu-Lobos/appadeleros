

import React, { useState, useEffect } from 'react';
import { UserProfileData, PlayerCategory } from '../types';
import { PLAYER_CATEGORIES } from '../constants';

interface UserProfileProps {
    profile: UserProfileData;
    onUpdate: (updatedProfile: UserProfileData) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ profile, onUpdate }) => {
    const [editedProfile, setEditedProfile] = useState<UserProfileData>(profile);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setEditedProfile(profile);
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedProfile(prev => ({ ...prev, [name]: value } as UserProfileData));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedProfileWithAvatar = {
            ...editedProfile,
            avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${editedProfile.firstName}+${editedProfile.lastName}`
        };
        onUpdate(updatedProfileWithAvatar);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="text-white">
            <h2 className="text-3xl font-bold text-white mb-6">Mi Perfil</h2>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-4">
                    <img src={editedProfile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full bg-dark-tertiary border-2 border-primary" />
                    <div>
                        <h3 className="text-xl font-bold">{editedProfile.firstName} {editedProfile.lastName}</h3>
                        <p className="text-light-secondary">Categoría: {editedProfile.category}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-light-secondary mb-1">Nombre</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={editedProfile.firstName}
                            onChange={handleInputChange}
                            className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                     <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-light-secondary mb-1">Apellido</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={editedProfile.lastName}
                            onChange={handleInputChange}
                            className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-light-secondary mb-1">Categoría</label>
                     <select 
                        id="category" 
                        name="category"
                        value={editedProfile.category} 
                        onChange={handleInputChange} 
                        className="w-full bg-dark-tertiary border border-dark-tertiary rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none">
                        {PLAYER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                <button
                    type="submit"
                    className="w-full bg-primary text-dark-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors duration-300"
                >
                    Guardar Cambios
                </button>
                {saved && <p className="text-center text-primary mt-2">¡Perfil guardado con éxito!</p>}
            </form>
        </div>
    );
};

export default UserProfile;