
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData } from './types';
import { fetchWeatherAndLandmark, generateLandmarkBackground, generateLandmarkVideoBackground, editLandmarkImage } from './services/geminiService';
import WeatherCard from './components/WeatherCard';

const App: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const initData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackgroundImage(null);
    setBackgroundVideo(null);
    
    let lat = 37.7749, lng = -122.4194; // Default SF

    try {
      if ('geolocation' in navigator) {
        const getPos = (): Promise<GeolocationPosition> => 
          new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
              maximumAge: 0 
            });
          });

        try {
          const pos = await getPos();
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          console.warn("Geolocation failed or timed out. Falling back to regional detection.");
        }
      }

      const data = await fetchWeatherAndLandmark(lat, lng);
      setWeatherData(data);
      setLoading(false);

      // 1. Get a fast static background first (Nano Banana)
      const bg = await generateLandmarkBackground(data.landmarkName, data.city);
      if (bg) setBackgroundImage(bg);

      // 2. Try to upgrade to a cinematic video background (Veo)
      try {
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        if (hasKey) {
          const videoUrl = await generateLandmarkVideoBackground(data.landmarkName, data.city);
          if (videoUrl) {
            setBackgroundVideo(videoUrl);
          }
        }
      } catch (veoError) {
        console.error("Veo background generation skipped/failed:", veoError);
      }

    } catch (err) {
      console.error(err);
      setError('Connection timeout or location sync failed. Tap retry below.');
      setLoading(false);
    }
  }, []);

  const handleEditImage = async (prompt: string) => {
    if (!backgroundImage) return;
    setEditing(true);
    // When editing, we should probably hide the video to see the change
    const oldVideo = backgroundVideo;
    setBackgroundVideo(null);
    
    try {
      const newBg = await editLandmarkImage(backgroundImage, prompt);
      if (newBg) {
        setBackgroundImage(newBg);
      } else {
        // Revert video if edit failed
        setBackgroundVideo(oldVideo);
      }
    } catch (e) {
      console.error("Edit failed", e);
      setBackgroundVideo(oldVideo);
    } finally {
      setEditing(false);
    }
  };

  useEffect(() => {
    initData();
  }, [initData]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0f172a'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95))',
    zIndex: 1
  };

  return (
    <div style={containerStyle} className="transition-all duration-1000 ease-in-out">
      {/* Static Background Image Layer */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: backgroundVideo ? 0 : 1,
            zIndex: 0
          }}
        />
      )}

      {/* Video Background Layer */}
      {backgroundVideo && (
        <video
          ref={videoRef}
          src={backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 animate-in fade-in duration-1000"
        />
      )}

      {/* Gradient Overlay */}
      <div style={overlayStyle} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-20 flex flex-col min-h-screen">
        <header className="mb-12 text-center">
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter bg-gradient-to-r from-blue-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-2xl">
            SkySync
          </h1>
          <p className="text-white/70 text-lg font-medium tracking-widest uppercase text-sm">
            {loading ? 'Finding your perspective...' : `${weatherData?.city} • Cinematic Mode`}
          </p>
        </header>

        <main className="flex-grow">
          {error && (
            <div className="glass bg-red-500/10 border-red-500/30 text-red-100 p-8 rounded-3xl mb-8 text-center backdrop-blur-xl animate-in fade-in zoom-in duration-300">
              <i className="fas fa-location-crosshairs mb-4 text-4xl block text-red-400"></i>
              <p className="mb-6 text-xl">{error}</p>
              <button 
                onClick={initData} 
                className="bg-white/20 hover:bg-white/30 px-10 py-3 rounded-full font-bold transition-all border border-white/20 shadow-lg"
              >
                Retry Location Sync
              </button>
            </div>
          )}

          {(loading || weatherData) && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <WeatherCard 
                data={weatherData!} 
                loading={loading} 
                onEditImage={handleEditImage} 
                isEditing={editing}
              />
            </div>
          )}
        </main>

        <footer className="mt-auto py-12 text-center">
            <div className="flex justify-center items-center space-x-2 text-white/30 text-[10px] tracking-[0.4em] uppercase">
                <span>Maps Grounding</span>
                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                <span>Nano Banana</span>
                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                <span>Veo Cinematic</span>
            </div>
            {(backgroundVideo || editing) && (
                <p className="text-blue-400/50 text-[10px] mt-2 uppercase tracking-widest animate-pulse">
                    {editing ? 'Editing Background Image...' : 'Live Cinematic Background Active'}
                </p>
            )}
        </footer>
      </div>
    </div>
  );
};

export default App;
