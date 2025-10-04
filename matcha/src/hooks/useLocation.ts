import { useState, useEffect } from 'react';
import api from '../services/api';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function useLocation(autoSave: boolean = false) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!autoSave) return;

    const getLocation = () => {
      setLoading(true);
      setError('');

      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setLocation(locationData);

          // Save to backend
          try {
            const result = await api.updateLocation(
              locationData.latitude,
              locationData.longitude,
              locationData.accuracy
            );

            if (result.error) {
              console.error('Error saving location:', result.error);
              setError(result.error);
            }
          } catch (err) {
            console.error('Error updating location:', err);
            setError('Failed to save location');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setLoading(false);
          if (err.code === err.PERMISSION_DENIED) {
            setError('Location access denied. Please enable location permissions.');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setError('Location information unavailable.');
          } else if (err.code === err.TIMEOUT) {
            setError('Location request timed out.');
          } else {
            setError('An unknown error occurred.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        }
      );
    };

    getLocation();
  }, [autoSave]);

  const updateLocation = async () => {
    setLoading(true);
    setError('');

    return new Promise<LocationData>((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported';
        setError(err);
        setLoading(false);
        reject(err);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setLocation(locationData);

          // Save to backend
          try {
            const result = await api.updateLocation(
              locationData.latitude,
              locationData.longitude,
              locationData.accuracy
            );

            if (result.error) {
              setError(result.error);
              reject(result.error);
            } else {
              resolve(locationData);
            }
          } catch (err) {
            const errorMsg = 'Failed to save location';
            setError(errorMsg);
            reject(err);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setLoading(false);
          let errorMsg = 'An unknown error occurred';
          
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Location access denied';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Location information unavailable';
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'Location request timed out';
          }
          
          setError(errorMsg);
          reject(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        }
      );
    });
  };

  return {
    location,
    loading,
    error,
    updateLocation,
  };
}
