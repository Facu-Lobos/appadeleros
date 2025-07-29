import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
    // Carga las variables desde los archivos .env en la raíz del proyecto (para desarrollo local).
    const localEnv = loadEnv(mode, '', '');

    // Prepara las variables que se inyectarán en la aplicación.
    // Se da prioridad a las variables de entorno del proceso de build (ej. Vercel, process.env)
    // y se usa el .env local (localEnv) como alternativa.
    const definedVariables = {
        'process.env.API_KEY': JSON.stringify(process.env.API_KEY || localEnv.API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || localEnv.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || localEnv.SUPABASE_ANON_KEY),
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
