import React, { useState } from 'react';
import { CourtData, TimeSlotData, BookingStatus, PlayerCategory, UserProfileData } from '../types';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (playerName: string, bookingType: 'single' | 'fixed') => void;
    onCancelBooking: (bookingId: string, bookingType: 'single' | 'fixed') => void;
    slotData: TimeSlotData;
    court: CourtData | undefined | null;
    userProfile: UserProfileData | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onConfirm, onCancelBooking, slotData, court, userProfile }) => {
    const [playerName, setPlayerName] = useState(userProfile ? `${userProfile.firstName} ${userProfile.lastName}`: '');
    const [bookingType, setBookingType] = useState<'single' | 'fixed'>('single');
    
    if (!isOpen) return null;

    const handleConfirmClick = () => {
        if (playerName.trim()) {
            onConfirm(playerName, bookingType);
            setPlayerName('');
        }
    };
    
    const handleCancelClick = () => {
        if (slotData.bookingId && slotData.bookingType) {
            onCancelBooking(slotData.bookingId, slotData.bookingType);
        }
    }

    const isBooked = slotData.status === BookingStatus.BOOKED;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity">
            <div className="bg-dark-secondary rounded-lg shadow-2xl p-8 w-full max-w-md m-4 transform transition-all scale-100 max-h-[95vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-2">{isBooked ? 'Detalles de la Reserva' : 'Confirmar Reserva'}</h2>
                <div className="mb-6 text-light-primary">
                    <p><span className="font-semibold">Pista:</span> {court?.name} ({court?.clubName})</p>
                    <p><span className="font-semibold">Hora:</span> {slotData.time}</p>
                </div>

                {isBooked ? (
                    <div className="space-y-6">
                        <p><span className="font-semibold text-light-secondary">Reservado por:</span> <span className="text-white">{slotData.bookedBy}</span></p>
                        <p><span className="font-semibold text-light-secondary">Tipo de Reserva:</span> <span className="text-white">{slotData.bookingType === 'fixed' ? 'Fijo Semanal' : 'Única vez'}</span></p>
                        <div className="flex justify-end space-x-4">
                             <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={handleCancelClick}
                                className="px-6 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
                            >
                                Cancelar Reserva
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <label htmlFor="playerName" className="block text-sm font-medium text-light-secondary mb-2">Nombre del Jugador</label>
                            <input
                                type="text"
                                id="playerName"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Introduce tu nombre"
                                className="w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-light-secondary mb-2">Tipo de Reserva</label>
                            <div className="flex rounded-md bg-dark-tertiary p-1">
                                <button
                                    onClick={() => setBookingType('single')}
                                    className={`w-1/2 py-2 text-sm font-semibold rounded ${bookingType === 'single' ? 'bg-primary text-dark-primary' : 'text-light-primary'}`}
                                >
                                    Única vez
                                </button>
                                <button
                                    onClick={() => setBookingType('fixed')}
                                    className={`w-1/2 py-2 text-sm font-semibold rounded ${bookingType === 'fixed' ? 'bg-primary text-dark-primary' : 'text-light-primary'}`}
                                >
                                    Fijo Semanal
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-8">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmClick}
                                disabled={!playerName.trim()}
                                className="px-6 py-2 rounded-md bg-primary text-dark-primary font-bold hover:bg-primary-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Confirmar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BookingModal;