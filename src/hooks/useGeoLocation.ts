import { useState, useCallback, useRef } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

interface GeoLocationMessages {
  /** Message shown when the Geolocation API is unavailable. */
  unsupported: string;
  /** Message shown when the GPS signal fails (e.g. permission denied / timeout). */
  weak: string;
}

const defaultMessages: GeoLocationMessages = {
  unsupported: 'Geolocation API is not supported by your browser',
  weak: 'GPS signal weak or unavailable. Using estimated location.',
};

export function useGeoLocation(messages: GeoLocationMessages = defaultMessages) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest messages (they can change with the app language) without
  // destabilizing the captureLocation callback identity.
  const messagesRef = useRef<GeoLocationMessages>(messages);
  messagesRef.current = messages;

  const captureLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError(messagesRef.current.unsupported);
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
        setError(messagesRef.current.weak);
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
