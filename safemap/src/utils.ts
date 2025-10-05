import { useEffect, useState } from "react";

interface ViewportSize {
  vw: number;
  vh: number;
}

interface ILOcation {
    determined: boolean,
    coordinates: {lat: number|null, lng: number|null}
}

export const useViewport = (): ViewportSize => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    vw: window.innerWidth,
    vh: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewportSize;
};

export const useGeolocation = (options:PositionOptions = {}) => {
  const [location, setLocation] = useState<ILOcation>({
    determined: false,
    coordinates: { lat: null, lng: null}
  });

  const onSuccess = (position: GeolocationPosition) => {
    setLocation({
      determined: true,
      coordinates: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
    });
  };

  const onError = () => {
    setLocation({
      determined: false,
      coordinates: { lat: null, lng: null }
    });
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      alert('Navigation not supported')
      return;
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, [options]);

  return location;
};

export const API_KEY = '285d3b2b-96ab-4fe5-a700-12ef370d7085'
