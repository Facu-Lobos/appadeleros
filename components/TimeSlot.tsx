


import React from 'react';
import { TimeSlotData, BookingStatus } from '../types';

interface TimeSlotProps {
    slotData: TimeSlotData;
    onClick: () => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slotData, onClick }) => {
    const isBooked = slotData.status === BookingStatus.BOOKED;
    const isUnavailable = slotData.status === BookingStatus.UNAVAILABLE;

    const baseClasses = "relative w-full aspect-[4/3] rounded-lg border-2 p-1 overflow-hidden transition-all duration-300 transform flex flex-col items-center justify-center text-center";
    
    let statusClasses;
    if (isBooked) {
        statusClasses = 'bg-red-900/50 border-red-700 text-white cursor-pointer hover:-translate-y-1 hover:shadow-xl';
    } else if (isUnavailable) {
        statusClasses = 'bg-red-900/80 border-red-800 text-white cursor-not-allowed opacity-70';
    } else {
        statusClasses = 'bg-dark-secondary border-primary cursor-pointer hover:border-accent hover:-translate-y-1 hover:shadow-xl';
    }

    return (
        <div
            onClick={!isUnavailable ? onClick : undefined}
            className={`${baseClasses} ${statusClasses}`}
            title={isBooked ? `Reservado por ${slotData.bookedBy}` : isUnavailable ? (slotData.bookedBy || 'No disponible') : `Disponible a las ${slotData.time}`}
        >
            {/* Court Lines Representation */}
            <div className="absolute inset-0 opacity-20">
                {/* Outer box */}
                <div className="absolute inset-[10%] border border-current"></div>
                {/* Service boxes */}
                <div className="absolute top-[10%] left-[10%] right-[10%] h-[35%] border-b border-current"></div>
                <div className="absolute bottom-[10%] left-[10%] right-[10%] h-[35%] border-t border-current"></div>
                {/* Center line */}
                <div className="absolute top-[10%] bottom-[10%] left-1/2 -ml-px w-px bg-current"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full bg-black/20 p-1 rounded-md">
                {isBooked ? (
                    <>
                        <span className="font-bold text-sm leading-tight">{slotData.time}</span>
                        <span className="text-[11px] font-semibold mt-0.5 text-red-300 uppercase">Reservado</span>
                        <span className="text-[10px] font-light truncate w-full px-1">{slotData.bookedBy}</span>
                    </>
                ) : isUnavailable ? (
                     <>
                        <span className="font-bold text-sm leading-tight opacity-80">{slotData.time}</span>
                        <span className="text-xs font-semibold mt-0.5 text-red-200 uppercase">{slotData.bookedBy || 'Cerrado'}</span>
                    </>
                ) : (
                    <span className="font-bold text-base">{slotData.time}</span>
                )}
            </div>
        </div>
    );
};

export default TimeSlot;