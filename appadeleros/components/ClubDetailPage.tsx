
import React, { useState, useEffect } from 'react';
import { ClubProfileData, CourtData, TimeSlotData, DayOfWeek } from '../types';
import BookingGrid from './BookingGrid';
import PhotoGalleryModal from './PhotoGalleryModal';
import { DAYS_OF_WEEK } from '../constants';

interface ClubDetailPageProps {
    club: ClubProfileData;
    courts: CourtData[];
    onSlotClick: (slot: TimeSlotData, court: CourtData) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    onBack: () => void;
}

const ClubDetailPage: React.FC<ClubDetailPageProps> = ({ club, courts, onSlotClick, selectedDate, setSelectedDate, onBack }) => {
    const [selectedCourtIndex, setSelectedCourtIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const clubCourts = courts.filter(c => c.clubId === club.id);
    
    // getDay() is Sun-indexed (0=Sun, 1=Mon, ...). Our DAYS_OF_WEEK is Mon-indexed.
    // We convert Sun->6, Mon->0, etc.
    const dayIndex = (selectedDate.getDay() + 6) % 7;
    const selectedDayName = DAYS_OF_WEEK[dayIndex];
    const isClubOpenOnSelectedDate = club.status === 'Abierto' && club.openingDays.includes(selectedDayName);


    useEffect(() => {
        if (selectedCourtIndex >= clubCourts.length && clubCourts.length > 0) {
            setSelectedCourtIndex(0);
        }
    }, [clubCourts, selectedCourtIndex]);


    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-primary hover:text-primary-hover font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Volver a la lista de clubes
            </button>

            <div className="bg-dark-secondary rounded-lg shadow-2xl overflow-hidden">
                 {club.photos && club.photos.length > 0 && (
                    <div className="relative">
                        <div className="h-56 bg-cover bg-center" style={{ backgroundImage: `url(${club.photos[0]})` }}>
                           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                        <div className={`absolute top-4 left-4 px-3 py-1 text-sm font-bold text-white rounded-full shadow-lg ${isClubOpenOnSelectedDate ? 'bg-green-600' : 'bg-red-600'}`}>
                           {isClubOpenOnSelectedDate ? 'Abierto' : 'Cerrado'} este día
                        </div>
                        <button 
                            onClick={() => setIsGalleryOpen(true)}
                            className="absolute bottom-4 right-4 bg-black/60 text-white font-semibold py-2 px-4 rounded-lg hover:bg-black/80 backdrop-blur-sm transition-colors"
                        >
                            Ver fotos ({club.photos.length})
                        </button>
                    </div>
                )}
                <div className="p-4">
                    <h2 className="text-3xl font-bold text-white">{club.name}</h2>
                    <p className="text-light-secondary mb-4">{club.city}</p>
                     <div className="space-y-2 text-light-primary border-t border-dark-tertiary pt-4">
                        <p><span className="font-semibold text-white">Horario:</span> {club.openingTime} - {club.closingTime}</p>
                        <p><span className="font-semibold text-white">Días de apertura:</span> {club.openingDays.join(', ')}</p>
                        <p><span className="font-semibold text-white">Buffet:</span> {club.hasBuffet ? 'Sí' : 'No'}</p>
                    </div>
                </div>
            </div>

            <div>
                <BookingGrid
                    courts={clubCourts}
                    onSlotClick={onSlotClick}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedCourtIndex={selectedCourtIndex}
                    setSelectedCourtIndex={setSelectedCourtIndex}
                />
            </div>

            {isGalleryOpen && club.photos.length > 0 && (
                <PhotoGalleryModal 
                    photos={club.photos}
                    onClose={() => setIsGalleryOpen(false)}
                />
            )}
        </div>
    );
};

export default ClubDetailPage;