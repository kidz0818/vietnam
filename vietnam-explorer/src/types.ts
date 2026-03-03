export type Category = 'Restaurant' | 'Cafe' | 'Bar' | 'Shopping' | 'Attraction' | 'Other';

export interface LocationData {
  id: string;
  name: string;
  category: Category;
  address: string;
  notes: string;
  lat?: number;
  lng?: number;
  createdAt: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
