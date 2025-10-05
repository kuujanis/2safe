import { useEffect, useState } from "react";
import type { IPoint } from "./App";

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

export const useDebounce = (value: IPoint|null, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};


export const API_KEY = '15eb8b38-5b8d-4d23-ae9e-1551d0b95c3e'
export const OLD_KEY = '285d3b2b-96ab-4fe5-a700-12ef370d7085'
