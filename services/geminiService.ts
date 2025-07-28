
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerSuggestion, UserProfileData } from '../types';

const API_KEY = process.env.API_KEY;

// Only initialize GAIA if the key exists to prevent crashes.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!ai) {
    console.warn("API_KEY environment variable not set. AI features will be disabled and will return mock data.");
}

const suggestionSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Nombre y apellido del jugador ficticio.',
        },
        category: {
          type: Type.STRING,
          description: 'Categoría del jugador, similar o complementaria a la del usuario.',
        },
        shortBio: {
          type: Type.STRING,
          description: 'Una breve y creativa biografía que describa el estilo de juego o personalidad del jugador.',
        },
      },
      required: ["name", "category", "shortBio"],
    },
};

export const findMatch = async (userProfile: UserProfileData): Promise<PlayerSuggestion[]> => {
    if (!ai) {
        // Mock response for development when API key is not available
        return new Promise(resolve => setTimeout(() => resolve([
            { name: "Carlos Modelo", category: "4ta", shortBio: "Jugador fiable para las tardes. Buen compañero, gran post-partido." },
            { name: "Lucía Ficticia", category: "3ra", shortBio: "Busca partidos competitivos pero amistosos. Le gusta practicar la volea." },
            { name: "Javier " + "IA" , category: "4ta", shortBio: "Perfecto para partidos matutinos. Siempre trae pelotas nuevas." },
        ]), 1500));
    }

    const prompt = `
        Eres "Padel-GPT", un asistente de IA experto en matchmaking para la app de pádel "APPadeleros".
        Tu misión es encontrar 3 compañeros de pádel ficticios perfectos para nuestro usuario. Sé creativo y dales personalidades únicas.

        Aquí está el perfil de nuestro usuario:
        - Nombre: ${userProfile.firstName}
        - Sexo: ${userProfile.sex}
        - Categoría: ${userProfile.category}
        - Disponibilidad: ${userProfile.availability.join(', ')}
        - Ubicación: ${userProfile.city}, ${userProfile.state}

        Basándote en esto, genera 3 sugerencias de jugadores. La categoría de los jugadores sugeridos debe ser la misma que la del usuario, o una categoría por encima o por debajo.
        Las biografías deben ser breves, atractivas y dar una idea de su estilo de juego o lo que buscan en un partido.

        Devuelve únicamente el array JSON con las 3 sugerencias.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionSchema,
                temperature: 0.9,
            }
        });

        const parsedData = JSON.parse(response.text);

        if (Array.isArray(parsedData)) {
            return parsedData as PlayerSuggestion[];
        } else {
             console.error("Received non-array data from AI:", parsedData);
             throw new Error("Invalid data format received from AI.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("No se pudo contactar al asistente de IA. Inténtalo de nuevo más tarde.");
    }
};