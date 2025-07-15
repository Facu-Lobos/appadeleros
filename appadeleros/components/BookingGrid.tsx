


import React from 'react';
import { CourtData, TimeSlotData } from '../types';
import TimeSlot from './TimeSlot';
import { CalendarIcon } from '../constants';

interface BookingGridProps {
    courts: CourtData[];
    onSlotClick: (slot: TimeSlotData, court: CourtData) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    selectedCourtIndex: number;
    setSelectedCourtIndex: (index: number) => void;
}

const BookingGrid: React.FC<BookingGridProps> = ({ courts, onSlotClick, selectedDate, setSelectedDate, selectedCourtIndex, setSelectedCourtIndex }) => {
    
    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const prevCourt = () => {
        setSelectedCourtIndex(selectedCourtIndex === 0 ? courts.length - 1 : selectedCourtIndex - 1);
    };

    const nextCourt = () => {
        setSelectedCourtIndex(selectedCourtIndex === courts.length - 1 ? 0 : selectedCourtIndex + 1);
    };

    const currentCourt = courts[selectedCourtIndex];
    if (!courts || courts.length === 0) {
        return <p className="text-center text-light-secondary py-8">No hay pistas configuradas para esta vista.</p>
    }
     if (!currentCourt) {
        return <p className="text-center text-light-secondary">Cargando información de la pista...</p>
    }


    return (
        <div className="w-full">
            {/* Court Switcher */}
            <div className="flex items-center justify-between bg-dark-secondary p-3 rounded-lg mb-4">
                <button 
                    onClick={prevCourt} 
                    disabled={courts.length <= 1} 
                    className="px-4 py-2 bg-dark-tertiary rounded-md hover:bg-primary hover:text-dark-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    &lt;
                </button>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white">{currentCourt.name}</h3>
                    <p className="text-xs text-light-secondary">{currentCourt.type} / {currentCourt.surface}</p>
                </div>
                <button 
                    onClick={nextCourt} 
                    disabled={courts.length <= 1} 
                    className="px-4 py-2 bg-dark-tertiary rounded-md hover:bg-primary hover:text-dark-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    &gt;
                </button>
            </div>

             {/* Date Switcher */}
            <div className="flex justify-between items-center mb-6 bg-dark-secondary p-2 rounded-lg">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Fecha
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeDate(-1)} className="px-3 py-1 bg-dark-tertiary rounded-md hover:bg-primary hover:text-dark-primary transition-colors">&lt;</button>
                    <span className="font-bold text-white w-28 text-center">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                    <button onClick={() => changeDate(1)} className="px-3 py-1 bg-dark-tertiary rounded-md hover:bg-primary hover:text-dark-primary transition-colors">&gt;</button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentCourt.timeSlots.map(slot => (
                    <TimeSlot
                        key={slot.id}
                        slotData={slot}
                        onClick={() => onSlotClick(slot, currentCourt)}
                    />
                ))}
            </div>
        </div>
    );
};

export default BookingGrid;