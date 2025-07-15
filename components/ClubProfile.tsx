

import React, { useState, useEffect, useRef } from 'react';
import { ClubProfileData, DayOfWeek, CourtDetails } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface ClubProfileProps {
    profile: ClubProfileData;
    onUpdateProfile?: (updatedProfile: ClubProfileData) => void;
    onDeleteProfile?: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const ClubProfile: React.FC<ClubProfileProps> = ({ profile, onUpdateProfile, onDeleteProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<ClubProfileData>(profile);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditedProfile(profile);
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setEditedProfile(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'turnDuration') {
            setEditedProfile(prev => ({...prev, turnDuration: parseInt(value, 10) }));
        } else if (name === 'status') {
            setEditedProfile(prev => ({...prev, status: value as 'Abierto' | 'Cerrado' }));
        }
        else {
            setEditedProfile(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleOpeningDaysChange = (day: DayOfWeek) => {
        setEditedProfile(prev => ({
            ...prev,
            openingDays: prev.openingDays.includes(day)
                ? prev.openingDays.filter(d => d !== day)
                : [...prev.openingDays, day],
        }));
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

    const handleCourtChange = (index: number, field: keyof CourtDetails, value: string) => {
        setEditedProfile(prev => {
            const newCourtDetails = prev.courtDetails.map((court, i) => {
                if (i !== index) {
                    return court;
                }
                const updatedCourt: CourtDetails = { ...court };
                switch (field) {
                    case 'name':
                        updatedCourt.name = value;
                        break;
                    case 'type':
                        updatedCourt.type = value as 'Muro' | 'Cristal';
                        break;
                    case 'location':
                        updatedCourt.location = value as 'Indoor' | 'Outdoor';
                        break;
                    case 'surface':
                        updatedCourt.surface = value as 'Alfombra' | 'Cemento';
                        break;
                }
                return updatedCourt;
            });

            return { ...prev, courtDetails: newCourtDetails, totalCourts: newCourtDetails.length };
        });
    };

    const addCourt = () => {
        setEditedProfile(prev => {
            const newCourt: CourtDetails = { name: `Pista ${prev.courtDetails.length + 1}`, type: 'Cristal', location: 'Indoor', surface: 'Alfombra' };
            const newCourts = [...prev.courtDetails, newCourt];
            return { ...prev, courtDetails: newCourts, totalCourts: newCourts.length };
        });
    };

    const removeCourt = (index: number) => {
        setEditedProfile(prev => {
            if (prev.courtDetails.length <= 1) {
                alert("Debe haber al menos una pista.");
                return prev;
            }
            const newCourts = prev.courtDetails.filter((_, i) => i !== index);
            return { ...prev, courtDetails: newCourts, totalCourts: newCourts.length };
        });
    };

    const handleSave = () => {
        if (onUpdateProfile) {
            onUpdateProfile(editedProfile);
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar el perfil de este club? Esta acción es irreversible y eliminará todas sus pistas, reservas y datos asociados.')) {
            onDeleteProfile?.();
        }
    };

    if (isEditing) {
        return (
             <div className="pb-8">
                <h2 className="text-3xl font-bold text-white mb-6">Editar Perfil del Club</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Nombre del Club</label>
                        <input type="text" name="name" value={editedProfile.name} onChange={handleInputChange} className="w-full bg-dark-tertiary border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                     <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-light-secondary mb-2">Duración de Turno (minutos)</label>
                            <select name="turnDuration" value={editedProfile.turnDuration} onChange={handleInputChange} className="w-full bg-dark-tertiary border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="60">60 minutos</option>
                                <option value="90">90 minutos</option>
                                <option value="120">120 minutos</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-light-secondary mb-2">Estado del Club</label>
                            <select name="status" value={editedProfile.status} onChange={handleInputChange} className="w-full bg-dark-tertiary border-dark-tertiary rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="Abierto">Abierto</option>
                                <option value="Cerrado">Cerrado</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-8 col-span-2">
                             <input type="checkbox" id="hasBuffet" name="hasBuffet" checked={editedProfile.hasBuffet} onChange={handleInputChange} className="h-5 w-5 rounded text-primary bg-dark-tertiary border-dark-tertiary focus:ring-primary" />
                             <label htmlFor="hasBuffet" className="ml-3 block text-base font-medium text-light-primary">¿Tiene buffet?</label>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Días de Apertura</label>
                        <div className="flex flex-wrap gap-2 bg-dark-secondary p-3 rounded-md border border-dark-tertiary">
                            {DAYS_OF_WEEK.map(day => (
                                <button key={day} type="button" onClick={() => handleOpeningDaysChange(day)} className={`px-3 py-1 text-sm rounded-full transition-colors ${editedProfile.openingDays.includes(day) ? 'bg-primary text-dark-primary font-bold' : 'bg-dark-tertiary text-light-primary'}`}>
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-secondary mb-2">Fotos del Club</label>
                        <div className="p-4 bg-dark-secondary rounded-lg border border-dark-tertiary">
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                {editedProfile.photos.map((photo, index) => (
                                    <div key={index} className="relative aspect-video group">
                                        <img src={photo} alt={`Foto ${index+1}`} className="w-full h-full object-cover rounded-md" />
                                        <button onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                           </div>
                           <input 
                                type="file" 
                                ref={galleryInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                multiple 
                                onChange={handleGalleryFileChange} 
                           />
                           <button onClick={() => galleryInputRef.current?.click()} type="button" className="w-full bg-dark-tertiary text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors">
                               Añadir Fotos
                           </button>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold text-white mt-6 mb-2">Configuración de Pistas</h3>
                        <div className="space-y-4">
                            {editedProfile.courtDetails.map((court, index) => (
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
                                    {editedProfile.courtDetails.length > 1 && <button type="button" onClick={() => removeCourt(index)} className="md:col-span-3 bg-red-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-red-500">Eliminar Pista</button>}
                                </div>
                            ))}
                            <button type="button" onClick={addCourt} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500">+ Añadir otra pista</button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-6 py-2 rounded-md bg-primary text-dark-primary font-bold hover:bg-primary-hover transition-colors">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
                <div className="flex gap-2">
                    {onUpdateProfile && (
                        <button onClick={() => setIsEditing(true)} className="bg-dark-tertiary text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">
                            Editar Perfil
                        </button>
                    )}
                    {onDeleteProfile && (
                        <button onClick={handleDelete} className="bg-red-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                            Eliminar Club
                        </button>
                    )}
                </div>
            </div>
            
             {profile.photos && profile.photos.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-3">Galería</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {profile.photos.map((photo, index) => (
                            <div key={index} className="aspect-video bg-dark-secondary rounded-lg overflow-hidden">
                                <img src={photo} alt={`Foto del club ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4 text-light-secondary">
                <div className="bg-dark-secondary p-4 rounded-lg border border-dark-tertiary">
                    <div className="flex justify-between items-start">
                        <div>
                            <p><span className="font-semibold text-white">Horario:</span> {profile.openingTime} - {profile.closingTime}</p>
                             <p><span className="font-semibold text-white">Días:</span> {profile.openingDays.join(', ')}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${profile.status === 'Abierto' ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>
                            {profile.status}
                        </span>
                    </div>
                    <p className="mt-2"><span className="font-semibold text-white">Duración de Turno:</span> {profile.turnDuration} minutos</p>
                    <p><span className="font-semibold text-white">Buffet:</span> {profile.hasBuffet ? 'Sí, ¡tenemos buffet!' : 'No disponible'}</p>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Nuestras {profile.totalCourts} Pistas:</h3>
                    <div className="space-y-3">
                    {profile.courtDetails.map((court, index) => (
                        <div key={index} className="bg-dark-secondary p-4 rounded-lg border border-dark-tertiary">
                            <h4 className="font-bold text-primary">{court.name}</h4>
                            <ul className="text-sm list-disc list-inside pl-2 mt-1">
                                <li>Tipo: {court.type}</li>
                                <li>Ubicación: {court.location}</li>
                                <li>Superficie: {court.surface}</li>
                            </ul>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubProfile;
