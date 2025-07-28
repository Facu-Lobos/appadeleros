
import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
    message: ToastMessage | null;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    const baseClasses = "fixed bottom-24 sm:bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl text-white font-semibold animate-fade-in z-[101]";
    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[message.type]}`}>
            {message.text}
        </div>
    );
};

export default Toast;