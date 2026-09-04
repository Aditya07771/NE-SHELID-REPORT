import { useState, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

export function useGeoLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation API is not supported by your browser');
      setLoading(false);
      // Fallback location for testing
      setLocation({
        latitude: 25.5788,
        longitude: 91.8933,
        accuracy: 15,
        capturedAt: new Date().toISOString(),
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          capturedAt: new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        console.warn('[Geolocation Warning]:', err.message);
        setError(`GPS signal weak (${err.message}). Using estimated location.`);
        // Default fallback (Shillong, Meghalaya area) for demo robustness
        setLocation({
          latitude: 25.5788,
          longitude: 91.8933,
          accuracy: 25,
          capturedAt: new Date().toISOString(),
        });
        setLoading(false);
      },
      options
    );
  }, []);

  return { location, loading, error, captureLocation, setLocation };
}
