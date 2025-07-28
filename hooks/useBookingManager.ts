


import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { TimeSlotData, CourtData, UserProfileData, ClubProfileData, BookingStatus, NotificationType, Booking, ToastMessage, Database } from '../types';
import { generateTimeSlots } from '../constants';

type SingleBookings = Record<string, Record<string, Record<string, { playerName: string; id: string }>>>;
type FixedBookings = Record<number, Record<string, Record<string, { playerName: string; id: string }>>>;

type useBookingManagerProps = {
    showToast: (message: ToastMessage) => void;
    userProfile: UserProfileData | null;
    loggedInClub: ClubProfileData | null;
    baseCourts: CourtData[];
};

export const useBookingManager = ({ showToast, userProfile, loggedInClub, baseCourts }: useBookingManagerProps) => {
    const [selectedSlot, setSelectedSlot] = useState<TimeSlotData | null>(null);
    const [selectedCourt, setSelectedCourt] = useState<CourtData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const [singleBookings, setSingleBookings] = useState<SingleBookings>({});
    const [fixedBookings, setFixedBookings] = useState<FixedBookings>({});

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSlot(null);
        setSelectedCourt(null);
    };

    const handleSlotClick = useCallback((slot: TimeSlotData, court: CourtData) => {
        setSelectedSlot(slot);
        setSelectedCourt(court);
        setIsModalOpen(true);
    }, []);

    const handleConfirmBooking = useCallback(async (
        playerName: string, 
        bookingType: 'single' | 'fixed'
    ) => {
        if (!selectedSlot || !selectedCourt || (!userProfile && !loggedInClub) || !supabase) return;

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const courtId = selectedCourt.id;
        const dateKey = selectedDate.toISOString().split('T')[0];
        const dayOfWeekJs = selectedDate.getDay();

        const newBookingForDb = {
            court_id: courtId,
            user_id: currentUserId,
            player_name: playerName,
            booking_date: dateKey,
            booking_time: selectedSlot.time,
            booking_type: bookingType,
            day_of_week: bookingType === 'fixed' ? dayOfWeekJs : null,
        };

        const { data, error } = await supabase.from('bookings').insert([newBookingForDb]).select().single();

        if (error || !data) {
            showToast({ text: `Error al crear la reserva: ${error?.message}`, type: 'error'});
            return;
        }

        const newBookingForState = {
            playerName: data.player_name,
            id: data.id,
        };

        if (bookingType === 'single') {
            setSingleBookings(prev => {
                const newBookings = { ...prev };
                if (!newBookings[dateKey]) newBookings[dateKey] = {};
                if (!newBookings[dateKey][courtId]) newBookings[dateKey][courtId] = {};
                newBookings[dateKey][courtId][selectedSlot.time] = newBookingForState;
                return newBookings;
            });
        } else {
            setFixedBookings(prev => {
                const newBookings = { ...prev };
                if (!newBookings[dayOfWeekJs]) newBookings[dayOfWeekJs] = {};
                if (!newBookings[dayOfWeekJs][courtId]) newBookings[dayOfWeekJs][courtId] = {};
                newBookings[dayOfWeekJs][courtId][selectedSlot.time] = newBookingForState;
                return newBookings;
            });
        }

        const newNotification = {
            type: 'booking' as NotificationType,
            title: 'Reserva Confirmada',
            message: `Tu pista en ${selectedCourt.name} a las ${selectedSlot.time} ha sido reservada.`,
            user_id: userProfile?.id || loggedInClub!.id,
        };

        await supabase.from('notifications').insert([newNotification]);
        
        handleCloseModal();
        showToast({ text: "Reserva confirmada con éxito.", type: 'success'});
    }, [selectedSlot, selectedCourt, selectedDate, userProfile, loggedInClub, showToast]);
    
    const handleCancelBooking = useCallback(async (bookingId: string, bookingType: 'single' | 'fixed') => {
        if (!selectedSlot || !selectedCourt || !supabase) return;

        const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
        
        if (error) {
            showToast({ text: `Error al cancelar la reserva: ${error.message}`, type: 'error'});
            return;
        }

        const dateKey = selectedDate.toISOString().split('T')[0];
        const dayOfWeekJs = selectedDate.getDay();
        const courtId = selectedCourt.id;
        const time = selectedSlot.time;

        if (bookingType === 'single') {
             setSingleBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (newBookings[dateKey]?.[courtId]?.[time]) {
                    delete newBookings[dateKey][courtId][time];
                }
                return newBookings;
            });
        } else {
             setFixedBookings(prev => {
                const newBookings = JSON.parse(JSON.stringify(prev));
                if (newBookings[dayOfWeekJs]?.[courtId]?.[time]) {
                    delete newBookings[dayOfWeekJs][courtId][time];
                }
                return newBookings;
            });
        }

        const currentUserId = userProfile?.id || loggedInClub!.id;
        const cancellationNotification = {
            type: 'booking' as NotificationType,
            title: 'Reserva Cancelada',
            message: `La reserva de la pista ${selectedCourt.name} a las ${time} ha sido cancelada.`,
            user_id: currentUserId,
        };
        await supabase.from('notifications').insert([cancellationNotification]);

        handleCloseModal();
        showToast({ text: "Reserva cancelada.", type: 'info'});
    }, [selectedSlot, selectedCourt, selectedDate, userProfile, loggedInClub, showToast]);

    const generateCourtTimeSlots = (court: CourtData, club: ClubProfileData) => {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const dayOfWeek = selectedDate.getDay();

        const timeSlots = generateTimeSlots(club.openingTime, club.closingTime, club.turnDuration)
            .map(slot => {
               const singleBooking = singleBookings[dateKey]?.[court.id]?.[slot.time];
               const fixedBooking = fixedBookings[dayOfWeek]?.[court.id]?.[slot.time];
               const booking = singleBooking || fixedBooking;

               if (booking) {
                   return { 
                       ...slot, 
                       status: BookingStatus.BOOKED, 
                       bookedBy: booking.playerName, 
                       bookingId: booking.id,
                       bookingType: singleBooking ? 'single' : 'fixed' as 'single' | 'fixed'
                   };
               }
               return slot;
            });
       return { ...court, timeSlots };
    }

    const courtsForLoggedInClub = useMemo(() => {
        if (!loggedInClub) return [];
        return baseCourts.filter(c => c.clubId === loggedInClub.id).map(c => generateCourtTimeSlots(c, loggedInClub));
    }, [baseCourts, loggedInClub, selectedDate, singleBookings, fixedBookings]);

    return {
        selectedSlot,
        selectedCourt,
        isModalOpen,
        selectedDate,
        setSelectedDate,
        singleBookings,
        fixedBookings,
        handleCloseModal,
        handleSlotClick,
        handleConfirmBooking,
        handleCancelBooking,
        courtsForLoggedInClub,
        generateCourtTimeSlots,
    };
};