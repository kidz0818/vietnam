import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { calculateDistance, estimateWalkingTime, estimateGrabTime } from '../utils';
import { MapPin, Plus, Trash2, ArrowUp, ArrowDown, Navigation, Clock, Route as RouteIcon, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
function MapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [points, map]);
  return null;
}

export default function Plan() {
  const { locations, currentLocation, currentLocationName, itinerary, addToItinerary, removeFromItinerary, moveInItinerary, clearItinerary } = useStore();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const itineraryLocations = itinerary.map(id => locations.find(loc => loc.id === id)).filter(Boolean) as typeof locations;
  const availableLocations = locations.filter(loc => !itinerary.includes(loc.id));

  let totalDistance = 0;
  const routePoints = [];
  
  if (currentLocation) {
    routePoints.push({ name: currentLocationName || 'Current Location', lat: currentLocation.lat, lng: currentLocation.lng, isCurrent: true });
  }
  
  itineraryLocations.forEach(loc => {
    if (loc.lat && loc.lng) {
      routePoints.push({ name: loc.name, lat: loc.lat, lng: loc.lng, isCurrent: false });
    }
  });

  const legs = [];
  for (let i = 0; i < routePoints.length - 1; i++) {
    const p1 = routePoints[i];
    const p2 = routePoints[i+1];
    const dist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    totalDistance += dist;
    legs.push({ from: p1.name, to: p2.name, distance: dist });
  }

  const mapPoints: [number, number][] = routePoints.map(p => [p.lat, p.lng]);

  return (
    <div className="p-4 space-y-6">
      {/* Map Section */}
      {mapPoints.length > 0 && (
        <div className="h-64 bg-stone-200 rounded-2xl overflow-hidden shadow-sm border border-stone-100 relative z-0">
          <MapContainer center={mapPoints[0]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routePoints.map((p, idx) => (
              <Marker key={idx} position={[p.lat, p.lng]} icon={p.isCurrent ? currentLocationIcon : new L.Icon.Default()}>
                <Popup>{p.name}</Popup>
              </Marker>
            ))}
            {mapPoints.length > 1 && (
              <Polyline positions={mapPoints} color="#10b981" weight={4} dashArray="10, 10" />
            )}
            <MapBounds points={mapPoints} />
          </MapContainer>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg text-stone-900 flex items-center">
            <RouteIcon className="text-emerald-500 mr-2" size={20} />
            My Trip Itinerary
          </h2>
          {itinerary.length > 0 && (
            <button onClick={clearItinerary} className="text-xs text-red-500 font-medium hover:text-red-600">
              Clear All
            </button>
          )}
        </div>
        <p className="text-sm text-stone-500 mb-4">
          Plan your route from your current location. Data is safely stored on your device.
        </p>

        {/* Start Point */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="mt-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-500 z-10">
              <MapPin size={12} className="text-emerald-600" />
            </div>
            {itineraryLocations.length > 0 && <div className="w-0.5 h-8 bg-stone-200 -mt-1"></div>}
          </div>
          <div className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-200">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Start Point</div>
            <div className="font-medium text-stone-900">
              {currentLocation ? (currentLocationName || 'Current GPS Location') : 'No location set (Go to Explore)'}
            </div>
          </div>
        </div>

        {/* Itinerary Items */}
        {itineraryLocations.map((loc, index) => (
          <div key={loc.id} className="flex items-start space-x-3 mb-4">
            <div className="mt-1 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-stone-800 text-white flex items-center justify-center text-xs font-bold z-10">
                {index + 1}
              </div>
              {index < itineraryLocations.length - 1 && <div className="w-0.5 h-16 bg-stone-200 -mt-1"></div>}
            </div>
            
            <div className="flex-1 bg-white rounded-xl p-3 border border-stone-200 shadow-sm relative group">
              <div className="font-medium text-stone-900 pr-16">{loc.name}</div>
              <div className="text-xs text-stone-500 truncate mt-0.5">{loc.address}</div>
              
              <div className="absolute top-3 right-3 flex items-center space-x-1">
                <div className="flex flex-col space-y-1 mr-2">
                  <button 
                    disabled={index === 0}
                    onClick={() => moveInItinerary(index, 'up')}
                    className="text-stone-400 hover:text-stone-700 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    disabled={index === itineraryLocations.length - 1}
                    onClick={() => moveInItinerary(index, 'down')}
                    className="text-stone-400 hover:text-stone-700 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromItinerary(loc.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Button */}
        <div className="flex items-start space-x-3 mt-2">
          <div className="mt-2 flex flex-col items-center w-6">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
          </div>
          <div className="flex-1 relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-500 font-medium flex items-center justify-center space-x-2 hover:bg-stone-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
            >
              <Plus size={18} />
              <span>Add Destination</span>
            </button>

            {showAddMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-xl shadow-lg overflow-hidden z-20 max-h-60 overflow-y-auto">
                {availableLocations.length === 0 ? (
                  <div className="p-4 text-center text-sm text-stone-500">
                    No available places. <Link to="/add" className="text-emerald-600">Add more places</Link> first!
                  </div>
                ) : (
                  availableLocations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        addToItinerary(loc.id);
                        setShowAddMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-50 last:border-0"
                    >
                      <div className="text-sm font-medium text-stone-900">{loc.name}</div>
                      <div className="text-xs text-stone-500 truncate">{loc.address}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {legs.length > 0 && (
        <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <MapIcon className="text-emerald-400 mr-2" size={20} />
            Route Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-stone-800 rounded-xl p-3">
              <div className="text-stone-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Distance</div>
              <div className="text-xl font-bold">{totalDistance < 1 ? `${Math.round(totalDistance * 1000)}m` : `${totalDistance.toFixed(1)}km`}</div>
            </div>
            <div className="bg-stone-800 rounded-xl p-3">
              <div className="text-stone-400 text-xs uppercase tracking-wider font-semibold mb-1">Est. Grab Time</div>
              <div className="text-xl font-bold">{estimateGrabTime(totalDistance)} min</div>
            </div>
          </div>

          <div className="space-y-0 mt-6">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Step-by-Step Route</div>
            {routePoints.map((point, i) => (
              <React.Fragment key={i}>
                {/* The Point */}
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${point.isCurrent ? 'bg-emerald-400' : 'bg-white border-2 border-stone-900'}`}></div>
                  <div className={`font-medium ${point.isCurrent ? 'text-emerald-400' : 'text-white'} truncate`}>
                    {point.name}
                  </div>
                </div>
                
                {/* The Leg (Travel Info) */}
                {i < routePoints.length - 1 && (
                  <div className="flex items-stretch space-x-3 my-1">
                    <div className="w-3 flex justify-center">
                      <div className="w-0.5 bg-stone-700 my-1"></div>
                    </div>
                    <div className="flex-1 bg-stone-800/50 rounded-lg p-3 my-2 flex items-center justify-between text-sm border border-stone-800">
                      <div className="flex items-center space-x-3 text-stone-300">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} className="text-stone-500" />
                          <span>{estimateGrabTime(legs[i].distance)} min <span className="text-stone-500 text-xs">Grab</span></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Navigation size={14} className="text-stone-500" />
                          <span>{estimateWalkingTime(legs[i].distance)} min <span className="text-stone-500 text-xs">Walk</span></span>
                        </div>
                      </div>
                      <div className="text-emerald-400 font-medium text-xs bg-emerald-400/10 px-2 py-1 rounded">
                        {legs[i].distance < 1 ? `${Math.round(legs[i].distance * 1000)}m` : `${legs[i].distance.toFixed(1)}km`}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
