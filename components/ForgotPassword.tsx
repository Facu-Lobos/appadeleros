
import React, { useState } from 'react';

interface ForgotPasswordProps {
    onRequest: (email: string) => void;
    onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onRequest, onBack }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            onRequest(email);
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen bg-dark-primary flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-dark-secondary p-8 rounded-lg shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Recuperar Contraseña</h2>
                {submitted ? (
                    <div className="text-center">
                        <p className="text-light-primary leading-relaxed">Si la dirección de correo electrónico está en nuestra base de datos, te hemos enviado un enlace para restablecer tu contraseña.</p>
                        <button onClick={onBack} className="mt-6 w-full bg-primary text-dark-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors">
                            Volver
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-light-secondary mb-1">Tu Email Registrado</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                        <div className="flex flex-col space-y-4 pt-2">
                            <button
                                type="submit"
                                className="w-full bg-primary text-dark-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors duration-300 disabled:bg-gray-500"
                                disabled={!email}
                            >
                                Enviar Enlace de Recuperación
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-500 transition-colors duration-300"
                            >
                                Volver
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
