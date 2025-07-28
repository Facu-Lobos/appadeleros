
import React from 'react';
import { PadelBallIcon } from '../constants';

const GlobalLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-dark-primary flex flex-col justify-center items-center z-[100]">
            <div className="relative flex items-center justify-center">
                <PadelBallIcon className="h-24 w-24 text-primary" />
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping"></div>
            </div>
            <p className="text-light-secondary mt-6 text-lg tracking-widest animate-pulse">CARGANDO...</p>
        </div>
    );
};

export default GlobalLoader;
