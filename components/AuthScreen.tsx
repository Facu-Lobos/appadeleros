import React from 'react';
import { PadelBallIcon, PadelRacketIcon } from '../constants';
import Logo from './Logo';
interface AuthScreenProps {
  onNavigate: (destination: 'player-login' | 'club-login' | 'player-signup' | 'club-signup') => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const textStyle = {
    fontFamily: "'Poppins', sans-serif",
    color: '#000000',
    fontWeight: '900',
    WebkitTextStroke: '0.75px #E2E8F0',
    textStroke: '0.75px #E2E8F0'
  };

       return (
    <div className="relative flex size-full min-h-screen flex-col bg-dark-primary justify-between overflow-x-hidden">
      <div>
        <div className="@container">
          <div className="@[480px]:px-4 @[480px]:py-3">
            <div
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden @[480px]:rounded-lg min-h-80"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCIT3aSHOM49iISSPuHzsWsstUfG2VtnNLIZXxGaeeJrxdBghvfON74xcY7U4Z-h7P6CxGteABp1ICB4c-EIMZVhOulS5aUI9X8LxnNPezmhZqaa-S2Y9VBnjYNVGnxuKavd08RfnhpBlZzUisu1Tq_i27GlAaFeBgeHwIs9J8Y-D1A7_66V3_VcoZEteVzk-84fm2JS0m8W8VmxqeHQMFD0FCA-domKxHHtW2QDRw8aBqVW93UsqNFZPEPZ9VBkZw36B_Km0CK7pOJ")' }}
            ></div>
          </div>
        </div>
        <div className="flex items-center justify-center text-[35px] font-black tracking-wider leading-tight px-4 text-center pb-3 pt-5">
            {/* Static 'A', highest z-index */}
            <span style={{...textStyle, position: 'relative', zIndex: 11 }}>A</span>

            {/* Animated P, tucked behind A */}
            <div className="letter-container" style={{ marginLeft: '-8px' }}>
                <span className="animate-slide-in" style={{ ...textStyle, animationDelay: '0.1s', transform: 'translateY(-7px)', position: 'relative', zIndex: 10 }}>
                    P
                </span>
            </div>

            {/* Racket Icon, tucked behind P */}
            <div className="letter-container" style={{ marginLeft: '-19px' }}>
                <div className="animate-slide-in" style={{ animationDelay: '0.2s', position: 'relative', zIndex: 9 }}>
                    <PadelRacketIcon className="h-16 w-12 translate-y-[-3px]" />
                </div>
            </div>
            

            {/* "adeler", each letter tucked behind the previous element */}
            {"adeler".split('').map((char, index) => {
                // The first letter 'a' tucks behind the wide racket, the rest tuck behind the previous letter.
                const charMarginLeft = index === 0 ? '-20px' : '-8px';
                return (
                    <div key={index} className="letter-container" style={{ marginLeft: charMarginLeft }}>
                        <span className="animate-slide-in" style={{ ...textStyle, animationDelay: `${0.3 + index * 0.05}s`, position: 'relative', zIndex: 8 - index }}>
                            {char}
                        </span>
                    </div>
                );
            })}
            
            {/* Ball Icon, tucked behind 'r' */}
            <div className="letter-container" style={{ marginLeft: '-8px' }}>
                <div className="animate-slide-in" style={{ animationDelay: '0.9s', position: 'relative', zIndex: 2 }}>
                    <PadelBallIcon className="h-6 w-6" />
                </div>
            </div>

            {/* 's', tucked behind the ball */}
            <div className="letter-container" style={{ marginLeft: '-8px' }}>
                <span className="animate-slide-in" style={{ ...textStyle, animationDelay: '1.0s', position: 'relative', zIndex: 1 }}>s</span>
            </div>
        </div>
        <p className="text-light-secondary text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">Gestiona tus reservas, partidos y torneos con facilidad.</p>
        <div className="flex justify-center">
          <div className="flex flex-1 gap-3 max-w-[480px] flex-col items-stretch px-4 py-3">
            <button
              onClick={() => onNavigate('player-login')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-dark-primary text-base font-bold leading-normal tracking-[0.015em] w-full hover:bg-primary-hover transition-colors"
            >
              <span className="truncate">Iniciar Sesión como Jugador</span>
            </button>
            <button
              onClick={() => onNavigate('club-login')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-dark-secondary text-light-primary text-base font-bold leading-normal tracking-[0.015em] w-full hover:bg-dark-tertiary transition-colors"
            >
              <span className="truncate">Iniciar Sesión como Club</span>
            </button>
             <button
              onClick={() => onNavigate('player-signup')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-accent text-dark-primary text-base font-bold leading-normal tracking-[0.015em] w-full hover:opacity-90 transition-colors"
            >
              <span className="truncate">Registrarse como Jugador</span>
            </button>
            <button
              onClick={() => onNavigate('club-signup')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-accent text-dark-primary text-base font-bold leading-normal tracking-[0.015em] w-full hover:opacity-90 transition-colors"
            >
              <span className="truncate">Registrarse como Club</span>
            </button>
          </div>
        </div>
         <div className="px-4 pt-6 pb-4 text-center">
            <div className="flex justify-center items-center gap-4">
                <Logo className="h-7 w-28" />
            </div>
        </div>
      </div>
      <div>
        <p className="text-light-secondary text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
        <div className="h-5"></div>
      </div>
    </div>
  );
};

export default AuthScreen;