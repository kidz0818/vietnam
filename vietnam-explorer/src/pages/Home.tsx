import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Navigation, Clock, Search, Coffee, ShoppingBag, Utensils, Wine, Map, HelpCircle, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { calculateDistance, estimateWalkingTime, estimateGrabTime } from '../utils';
import { Category } from '../types';
import LocationAutocomplete from '../components/LocationAutocomplete';

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Restaurant: <Utensils size={18} />,
  Cafe: <Coffee size={18} />,
  Bar: <Wine size={18} />,
  Shopping: <ShoppingBag size={18} />,
  Attraction: <Map size={18} />,
  Other: <HelpCircle size={18} />,
};

export default function Home() {
  const navigate = useNavigate();
  const { locations, currentLocation, currentLocationName, setCurrentLocation, deleteLocation } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [isLocating, setIsLocating] = useState(false);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude }, 'Current GPS Location');
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert('Unable to retrieve your location');
        setIsLocating(false);
      }
    );
  };

  // Filter and sort locations
  const processedLocations = useMemo(() => {
    let filtered = locations;
    
    if (activeCategory !== 'All') {
      filtered = filtered.filter(loc => loc.category === activeCategory);
    }

    if (!currentLocation) return filtered;

    return filtered.map(loc => {
      let distance = null;
      if (loc.lat && loc.lng) {
        distance = calculateDistance(currentLocation.lat, currentLocation.lng, loc.lat, loc.lng);
      }
      return { ...loc, distance };
    }).sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [locations, activeCategory, currentLocation]);

  return (
    <div className="p-4 space-y-6">
      {/* Location Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-emerald-700">
            <MapPin size={20} />
            <h2 className="font-semibold text-sm uppercase tracking-wider">My Location</h2>
          </div>
          <button 
            onClick={handleUseGPS}
            disabled={isLocating}
            className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-medium flex items-center space-x-1 hover:bg-emerald-100 transition-colors"
          >
            <Navigation size={14} />
            <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
          </button>
        </div>
        
        {currentLocationName ? (
          <div className="text-stone-800 font-medium text-lg mb-3">{currentLocationName}</div>
        ) : (
          <div className="text-stone-400 text-sm mb-3 italic">No location set</div>
        )}

        <LocationAutocomplete
          value={searchQuery}
          onChange={setSearchQuery}
          onSelect={(loc) => {
            setCurrentLocation({ lat: loc.lat, lng: loc.lng }, loc.name);
            setSearchQuery('');
          }}
          placeholder="Search Vietnam to set your location..."
        />
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-2 scrollbar-hide">
        {(['All', 'Restaurant', 'Cafe', 'Bar', 'Shopping', 'Attraction', 'Other'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as Category | 'All')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat 
                ? 'bg-stone-800 text-white shadow-md' 
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Places List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-stone-800 text-lg">Recommended Nearby</h3>
        
        {processedLocations.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-stone-100 border-dashed">
            <MapPin size={32} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500 text-sm">No places found.</p>
            <Link to="/add" className="text-emerald-600 font-medium text-sm mt-2 inline-block">Add your first spot</Link>
          </div>
        ) : (
          processedLocations.map((loc) => (
            <div 
              key={loc.id} 
              onClick={() => navigate(`/place/${loc.id}`)}
              className="block bg-white rounded-2xl p-4 shadow-sm border border-stone-100 active:scale-[0.98] transition-transform cursor-pointer relative group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="pr-8">
                  <h4 className="font-semibold text-stone-900 text-lg leading-tight">{loc.name}</h4>
                  <div className="flex items-center space-x-1 text-stone-500 text-xs mt-1">
                    <span className="bg-stone-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      {CATEGORY_ICONS[loc.category]}
                      <span className="ml-1">{loc.category}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this place?')) {
                        deleteLocation(loc.id);
                      }
                    }}
                    className="text-stone-300 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1"
                  >
                    <Trash2 size={18} />
                  </button>
                  {loc.distance !== null && loc.distance !== undefined && (
                    <div className="text-emerald-600 font-bold text-lg">
                      {loc.distance < 1 ? `${Math.round(loc.distance * 1000)}m` : `${loc.distance.toFixed(1)}km`}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-stone-600 text-sm line-clamp-2 mt-2">{loc.notes}</p>
              
              {loc.distance !== null && loc.distance !== undefined && (
                <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 font-medium">
                  <div className="flex items-center space-x-1">
                    <Navigation size={14} className="text-stone-400" />
                    <span>Walk {estimateWalkingTime(loc.distance)} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} className="text-stone-400" />
                    <span>Grab {estimateGrabTime(loc.distance)} min</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
