
import React, { useState } from 'react';
import { WeatherData } from '../types';

interface WeatherCardProps {
  data: WeatherData | null;
  loading: boolean;
  onEditImage?: (prompt: string) => void;
  isEditing?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ data, loading, onEditImage, isEditing }) => {
  const [editPrompt, setEditPrompt] = useState('');

  if (loading || !data) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="glass p-16 rounded-[3rem] animate-pulse flex flex-col items-center justify-center space-y-8 border border-white/5">
          <div className="w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="h-12 w-3/4 bg-white/5 rounded-2xl"></div>
          <div className="h-6 w-1/2 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPrompt.trim() && onEditImage) {
      onEditImage(editPrompt);
      setEditPrompt('');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Main Weather Hero */}
      <div className="glass p-12 md:p-16 rounded-[3rem] text-center relative overflow-hidden group border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-white/20">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[15rem] group-hover:scale-125 group-hover:rotate-6 transition-all duration-1000 pointer-events-none">
          <i className="fas fa-cloud-bolt"></i>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-white drop-shadow-md">
            {data.city}
          </h2>
          <div className="text-8xl md:text-[10rem] font-black mb-8 leading-none bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent drop-shadow-2xl">
            {data.temperature}
          </div>
          <div className="inline-flex items-center space-x-4 bg-white/5 px-8 py-3 rounded-full border border-white/10 backdrop-blur-2xl shadow-xl">
            <span className="text-2xl font-black text-blue-200 uppercase tracking-[0.2em]">{data.condition}</span>
          </div>
        </div>
      </div>

      {/* Landmark Feature */}
      <div className="glass p-10 rounded-[3rem] space-y-8 border border-white/10 shadow-2xl hover:bg-white/[0.07] transition-colors duration-500">
        <div className="flex items-start space-x-6">
          <div className="bg-blue-500/20 p-5 rounded-3xl border border-blue-400/20 shadow-inner">
            <i className="fas fa-monument text-blue-300 text-4xl"></i>
          </div>
          <div className="flex-grow">
            <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Cinematic Focus</span>
            <h3 className="text-4xl font-black text-white leading-tight">{data.landmarkName}</h3>
          </div>
        </div>
        
        <p className="text-2xl text-white/60 leading-relaxed font-light italic">
          "{data.landmarkDescription}"
        </p>

        {/* Interactive Image Editing */}
        <div className="pt-6 border-t border-white/5">
          <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Interactive Studio</span>
          <form onSubmit={handleSubmitEdit} className="relative group">
            <input 
              type="text" 
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Prompt: 'Add a retro filter', 'Make it sunset'..."
              disabled={isEditing}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-all text-lg"
            />
            <button 
              type="submit" 
              disabled={isEditing || !editPrompt.trim()}
              className="absolute right-3 top-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white p-3 rounded-xl transition-all shadow-lg"
            >
              {isEditing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-magic"></i>}
            </button>
          </form>
          <p className="mt-2 text-[10px] text-white/20 italic">Powered by Gemini 2.5 Flash Image (Nano Banana)</p>
        </div>
        
        {data.sources.length > 0 && (
          <div className="pt-8 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-6">Verified Grounding</h4>
            <div className="flex flex-wrap gap-4">
              {data.sources.map((source, i) => (
                <a 
                  key={i} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-white/5 hover:bg-white/10 text-white/50 hover:text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all border border-white/5 hover:border-white/20 flex items-center"
                >
                  {source.type === 'maps' && <i className="fas fa-map-marker-alt mr-2 text-red-400/70"></i>}
                  {source.title} 
                  <i className="fas fa-external-link-alt ml-3 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 group-hover:-translate-y-1"></i>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;
