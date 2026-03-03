import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocationData, Coordinates } from './types';

interface AppState {
  locations: LocationData[];
  currentLocation: Coordinates | null;
  currentLocationName: string;
  itinerary: string[];
  addLocation: (location: Omit<LocationData, 'id' | 'createdAt'>) => void;
  updateLocation: (id: string, location: Partial<LocationData>) => void;
  deleteLocation: (id: string) => void;
  setCurrentLocation: (coords: Coordinates, name: string) => void;
  addToItinerary: (id: string) => void;
  removeFromItinerary: (id: string) => void;
  moveInItinerary: (index: number, direction: 'up' | 'down') => void;
  clearItinerary: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      locations: [],
      currentLocation: null,
      currentLocationName: '',
      itinerary: [],
      addLocation: (location) =>
        set((state) => ({
          locations: [
            ...state.locations,
            { ...location, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),
      updateLocation: (id, locationUpdate) =>
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, ...locationUpdate } : loc
          ),
        })),
      deleteLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        })),
      setCurrentLocation: (coords, name) =>
        set(() => ({
          currentLocation: coords,
          currentLocationName: name,
        })),
      addToItinerary: (id) =>
        set((state) => ({
          itinerary: state.itinerary.includes(id) ? state.itinerary : [...state.itinerary, id],
        })),
      removeFromItinerary: (id) =>
        set((state) => ({
          itinerary: state.itinerary.filter((itemId) => itemId !== id),
        })),
      moveInItinerary: (index, direction) =>
        set((state) => {
          const newItinerary = [...state.itinerary];
          if (direction === 'up' && index > 0) {
            [newItinerary[index - 1], newItinerary[index]] = [newItinerary[index], newItinerary[index - 1]];
          } else if (direction === 'down' && index < newItinerary.length - 1) {
            [newItinerary[index + 1], newItinerary[index]] = [newItinerary[index], newItinerary[index + 1]];
          }
          return { itinerary: newItinerary };
        }),
      clearItinerary: () => set({ itinerary: [] }),
    }),
    {
      name: 'vn-explorer-storage',
    }
  )
);
