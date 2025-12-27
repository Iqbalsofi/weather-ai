
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData, GroundingChunk } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateLandmarkBackground = async (landmarkName: string, city: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A professional, cinematic, hyper-realistic artistic rendering of the famous landmark "${landmarkName}" in "${city}". Style: Smooth, dreamlike, atmospheric, wide-angle shot, golden hour lighting, 8k resolution, ethereal vibe. No text, no people, no UI elements. Focus on a breathtaking view of ${landmarkName}.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return '';
};

export const editLandmarkImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAI();
  // Strip prefix if exists
  const data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: 'image/png' // Assuming png or similar
            },
          },
          {
            text: `Modify this image based on the following instruction: ${prompt}. Maintain the original landmark but apply the change smoothly.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image editing failed:", error);
  }
  return '';
};

export const generateLandmarkVideoBackground = async (landmarkName: string, city: string): Promise<string> => {
    const ai = getAI();
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Cinematic drone sweep around ${landmarkName} in ${city}. Golden hour, soft lighting, 1080p, ultra-smooth motion, professional travel documentary style.`,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 8000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Video generation failed:", error);
        return '';
    }
};

export const fetchWeatherAndLandmark = async (lat: number, lng: number): Promise<WeatherData> => {
  const ai = getAI();
  // Note: responseMimeType/responseSchema are NOT allowed with googleMaps tool.
  // We'll use a specific prompt and parse the text manually.
  const prompt = `Identify the specific city and state for the coordinates (lat: ${lat}, lng: ${lng}). 
  Find current weather conditions and identify one EXTREMELY famous, culturally significant landmark within that specific metropolitan area.
  
  Format your response exactly as a JSON string like this:
  {"city": "City Name, State", "temperature": "Degrees", "condition": "Condition", "landmarkName": "Landmark Name", "landmarkDescription": "Short description"}
  
  Do not include markdown markers or anything else. Just the JSON string.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    },
  });

  const rawText = response.text || '{}';
  // Attempt to extract JSON if model adds markers
  const jsonMatch = rawText.match(/\{.*\}/s);
  const data = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: any[] = [];
  
  (groundingChunks as GroundingChunk[]).forEach(chunk => {
    if (chunk.web) {
      sources.push({ uri: chunk.web.uri, title: chunk.web.title, type: 'web' });
    } else if (chunk.maps) {
      sources.push({ uri: chunk.maps.uri, title: chunk.maps.title, type: 'maps' });
    }
  });

  return { ...data, sources };
};
