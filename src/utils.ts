import { GoogleGenAI, Type } from '@google/genai';

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function estimateWalkingTime(distanceKm: number): number {
  // Average walking speed ~5 km/h
  return Math.round((distanceKm / 5) * 60);
}

export function estimateGrabTime(distanceKm: number): number {
  // Average city driving speed ~20 km/h, plus 3 mins wait time
  return Math.round((distanceKm / 20) * 60) + 3;
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the exact latitude and longitude for the following address/place in Vietnam: "${address}". Return JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["lat", "lng"]
        }
      }
    });
    const cleanText = (response.text || '{}').replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);
    if (data.lat && data.lng) return data;
    return null;
  } catch (error) {
    console.error("AI Geocoding error:", error);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Vietnam')}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (e) {}
    return null;
  }
}

export async function searchVietnamLocations(query: string) {
  if (!query) return [];
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the location or address "${query}" in Vietnam. It could be a specific shop (like Lsoul), restaurant, hotel, street, or a raw street address. Use Google Search to find the real place. Return a JSON array of up to 5 best matches. Provide the exact latitude and longitude.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              display_name: { type: Type.STRING, description: "Full address" },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            },
            required: ["name", "display_name", "lat", "lng"]
          }
        }
      }
    });
    const cleanText = (response.text || '[]').replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);
    if (data.length > 0) return data;
    throw new Error("No AI results");
  } catch (error) {
    console.error("AI Search error, falling back to Nominatim:", error);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&addressdetails=1&limit=5`);
      const data = await response.json();
      return data.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    } catch (e) {
      return [];
    }
  }
}
