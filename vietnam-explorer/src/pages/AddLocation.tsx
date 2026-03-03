import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from '@google/genai';
import { Sparkles, Loader2, CheckCircle, MapPin, Tag, AlignLeft, Search } from 'lucide-react';
import { useStore } from '../store';
import { geocodeAddress } from '../utils';
import { Category } from '../types';
import LocationAutocomplete from '../components/LocationAutocomplete';

export default function AddLocation() {
  const navigate = useNavigate();
  const { addLocation } = useStore();
  const [inputText, setInputText] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    name: string;
    category: Category;
    address: string;
    notes: string;
    lat?: number;
    lng?: number;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following text (which might be a review, a Xiaohongshu post, or a recommendation for a place in Vietnam) and extract the details into JSON format.
        
        Text:
        ${inputText}
        
        Requirements:
        - name: The name of the place (restaurant, shop, etc.)
        - category: Must be exactly one of: "Restaurant", "Cafe", "Bar", "Shopping", "Attraction", "Other"
        - address: The physical address in Vietnam (try to be as specific as possible, e.g., "123 Nguyen Hue, District 1, Ho Chi Minh City")
        - notes: A brief summary of why it's recommended, what to order, or key takeaways from the text. Keep it concise.
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              address: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ['name', 'category', 'address', 'notes'],
          },
        },
      });

      const result = JSON.parse(response.text || '{}');
      
      // Validate category
      const validCategories = ['Restaurant', 'Cafe', 'Bar', 'Shopping', 'Attraction', 'Other'];
      if (!validCategories.includes(result.category)) {
        result.category = 'Other';
      }

      setParsedData(result);
    } catch (error) {
      console.error('Error analyzing text:', error);
      alert('Failed to analyze text. Please try again or enter manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;
    
    let coords = { lat: parsedData.lat, lng: parsedData.lng };
    if (!coords.lat || !coords.lng) {
      const geocoded = await geocodeAddress(parsedData.address);
      if (geocoded) {
        coords = geocoded;
      }
    }
    
    addLocation({
      name: parsedData.name,
      category: parsedData.category,
      address: parsedData.address,
      notes: parsedData.notes,
      lat: coords.lat,
      lng: coords.lng,
    });
    
    navigate('/');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Manual Search Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h2 className="font-semibold text-lg text-stone-900 mb-2 flex items-center">
          <Search className="text-emerald-500 mr-2" size={20} />
          Search & Add Place
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Search for any place in Vietnam to add it to your database.
        </p>
        <LocationAutocomplete
          value={manualSearch}
          onChange={setManualSearch}
          onSelect={(loc) => {
            setParsedData({
              name: loc.name,
              address: loc.display_name,
              category: 'Other',
              notes: '',
              lat: loc.lat,
              lng: loc.lng
            });
            setManualSearch('');
          }}
          placeholder="e.g. Liberty Central Saigon..."
        />
      </div>

      <div className="flex items-center justify-center space-x-4">
        <div className="h-px bg-stone-200 flex-1"></div>
        <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">OR</span>
        <div className="h-px bg-stone-200 flex-1"></div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <h2 className="font-semibold text-lg text-stone-900 mb-2 flex items-center">
          <Sparkles className="text-emerald-500 mr-2" size={20} />
          AI Magic Extraction
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Paste a review, Xiaohongshu post, or recommendation here. We'll extract the details for you.
        </p>
        
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste text here..."
          className="w-full h-32 bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none mb-4"
        />
        
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !inputText.trim()}
          className="w-full bg-emerald-600 text-white font-medium py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Extract Details</span>
            </>
          )}
        </button>
      </div>

      {parsedData && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="font-semibold text-lg text-stone-900 mb-4 border-b border-stone-100 pb-2">Extracted Info</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 block">Name</label>
              <input
                type="text"
                value={parsedData.name}
                onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 block">Category</label>
              <select
                value={parsedData.category}
                onChange={(e) => setParsedData({ ...parsedData, category: e.target.value as Category })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Bar">Bar</option>
                <option value="Shopping">Shopping</option>
                <option value="Attraction">Attraction</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 block">Address</label>
              <LocationAutocomplete
                value={parsedData.address}
                onChange={(val) => setParsedData({ ...parsedData, address: val })}
                onSelect={(loc) => setParsedData({ ...parsedData, address: loc.display_name, lat: loc.lat, lng: loc.lng })}
                placeholder="Search to correct address..."
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 block">Notes / Why go?</label>
              <textarea
                value={parsedData.notes}
                onChange={(e) => setParsedData({ ...parsedData, notes: e.target.value })}
                className="w-full h-24 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
          
          <button
            onClick={handleSave}
            className="w-full mt-6 bg-stone-900 text-white font-medium py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-stone-800 transition-colors"
          >
            <CheckCircle size={18} />
            <span>Save to My Places</span>
          </button>
        </div>
      )}
    </div>
  );
}
