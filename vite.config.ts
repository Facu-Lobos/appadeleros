

import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
    // Carga las variables desde los archivos .env en la raíz del proyecto.
    const fileEnv = loadEnv(mode, '', '');

    // Prepara las variables que se inyectarán en la aplicación.
    // Se da prioridad a las variables de entorno del proceso de build (ej. Vercel)
    // y se usa el .env local como alternativa para desarrollo.
    const apiKey = process.env.API_KEY || fileEnv.API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || fileEnv.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || fileEnv.SUPABASE_ANON_KEY;
    
    const definedVariables = {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    };

    return {
      define: definedVariables,
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('.', import.meta.url)),
        }
      }
    };
});
