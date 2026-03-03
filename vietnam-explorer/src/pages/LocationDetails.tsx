import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Navigation, Clock, MapPin, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { calculateDistance, estimateWalkingTime, estimateGrabTime } from '../utils';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for current location
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to adjust map bounds
function MapBounds({ currentLoc, destLoc }: { currentLoc: [number, number] | null, destLoc: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (currentLoc && destLoc) {
      const bounds = L.latLngBounds([currentLoc, destLoc]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (destLoc) {
      map.setView(destLoc, 15);
    }
  }, [currentLoc, destLoc, map]);
  return null;
}

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { locations, currentLocation, deleteLocation } = useStore();
  const location = locations.find((loc) => loc.id === id);

  if (!location) {
    return (
      <div className="p-4 text-center mt-20">
        <p className="text-stone-500">Location not found.</p>
        <button onClick={() => navigate('/')} className="text-emerald-600 mt-4 font-medium">Go Back</button>
      </div>
    );
  }

  const distance = (currentLocation && location.lat && location.lng)
    ? calculateDistance(currentLocation.lat, currentLocation.lng, location.lat, location.lng)
    : null;

  const destCoords: [number, number] | null = (location.lat && location.lng) ? [location.lat, location.lng] : null;
  const currentCoords: [number, number] | null = currentLocation ? [currentLocation.lat, currentLocation.lng] : null;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this place?')) {
      deleteLocation(location.id);
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-[1000] relative sticky top-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-600 hover:text-stone-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-stone-900 truncate max-w-[200px]">{location.name}</h2>
        <button onClick={handleDelete} className="p-2 -mr-2 text-red-500 hover:text-red-700 transition-colors cursor-pointer">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Map Area */}
      <div className="h-64 bg-stone-200 relative z-0">
        {destCoords ? (
          <MapContainer center={destCoords} zoom={15} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={destCoords}>
              <Popup>{location.name}</Popup>
            </Marker>
            {currentCoords && (
              <Marker position={currentCoords} icon={currentLocationIcon}>
                <Popup>You are here</Popup>
              </Marker>
            )}
            <MapBounds currentLoc={currentCoords} destLoc={destCoords} />
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-stone-400 flex-col">
            <MapPin size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No GPS coordinates available</p>
          </div>
        )}
      </div>

      {/* Details Area */}
      <div className="flex-1 p-5 space-y-6 bg-white rounded-t-3xl -mt-6 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              {location.category}
            </span>
            {distance !== null && (
              <span className="text-sm font-semibold text-stone-500">
                {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-stone-900 leading-tight mt-2">{location.name}</h1>
          <p className="text-stone-500 text-sm mt-1 flex items-start">
            <MapPin size={16} className="mr-1 mt-0.5 shrink-0" />
            <span>{location.address}</span>
          </p>
        </div>

        {distance !== null && (
          <div className="flex space-x-4">
            <div className="flex-1 bg-stone-50 rounded-2xl p-4 border border-stone-100 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <Navigation size={20} />
              </div>
              <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold mb-1">Walk</span>
              <span className="text-lg font-bold text-stone-900">{estimateWalkingTime(distance)} min</span>
            </div>
            
            <div className="flex-1 bg-stone-50 rounded-2xl p-4 border border-stone-100 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <Clock size={20} />
              </div>
              <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold mb-1">Grab</span>
              <span className="text-lg font-bold text-stone-900">{estimateGrabTime(distance)} min</span>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-3 border-b border-stone-100 pb-2">Why go?</h3>
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{location.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
