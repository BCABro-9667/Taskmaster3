
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sun, Clock, Calendar } from 'lucide-react';

interface WeatherData {
  city: string;
  temperature: number;
}

export function LiveInfo() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect for updating time and date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(format(now, 'p')); // e.g., 4:30 PM
      setDate(format(now, 'MMMM d, yyyy')); // e.g., July 20, 2025
    };

    updateDateTime(); // Initial call
    const timerId = setInterval(updateDateTime, 1000); // Update every second for a live clock

    return () => clearInterval(timerId);
  }, []);

  // Effect for fetching weather data
  useEffect(() => {
    const fetchWeather = (lat: number, lon: number) => {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

      Promise.all([fetch(weatherUrl), fetch(reverseGeocodeUrl)])
        .then(async ([weatherRes, geoRes]) => {
          if (!weatherRes.ok || !geoRes.ok) {
            throw new Error('Failed to fetch weather or location data.');
          }
          const weatherData = await weatherRes.json();
          const geoData = await geoRes.json();
          
          const city = geoData.address.city || geoData.address.town || geoData.address.village || 'New Delhi';
          
          setWeather({
            city,
            temperature: Math.round(weatherData.current_weather.temperature),
          });
        })
        .catch(() => {
          setError('Could not fetch weather.');
        });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setError('Location access denied.');
          // Fallback to New Delhi weather if location is denied
          fetchWeather(28.6139, 77.2090);
        }
      );
    } else {
      setError('Geolocation not supported.');
       // Fallback to New Delhi weather if geolocation is not supported
      fetchWeather(28.6139, 77.2090);
    }
  }, []);

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {weather ? (
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary" />
          <span>{weather.temperature}°C ({weather.city})</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>{error || 'Loading...'}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <span>{time}</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <span>{date}</span>
      </div>
    </div>
  );
}
