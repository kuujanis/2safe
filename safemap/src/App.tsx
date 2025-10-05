import { useEffect, useRef, useState } from 'react'
import './App.css'
import { useViewport } from './utils'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { Layer, Map, Marker, Source, type MapRef, } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { NavBar } from './NavBar'

export interface ILocation {
  determined: boolean,
  coordinates: IPoint|null
}
export interface IPoint {
  lat: number, 
  lon: number
}
const pinStyle: React.CSSProperties = {
  backgroundColor: '#007AFF',
  color: 'white',
  width: 30,
  height: 30,
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: 18,
  cursor: 'pointer',
  userSelect: 'none',
  boxShadow: '0 0 5px rgba(0,0,0,0.3)',
  position: 'relative',
};

const OPTIONS = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  }

function App() {
  const [currentLoc, setCurrentLoc] = useState<ILocation>({
    determined: false,
    coordinates: null
  });
  const [aLoc, setALoc] = useState<IPoint|null>(null)
  const [bLoc, setBLoc] = useState<IPoint|null>(null)
  const [dark,setDark] = useState<boolean>(true)
  // const [reverseGeocoding, setReverseGeocoding] = useState<boolean>(false)
  
  
  const { vw, vh } = useViewport()
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    const fetchData = async () => {
      const date = new Date()
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      try {
        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${55.54}&lng=${37.55}&date=${dateStr}&formatted=0`
        );
        const data = await response.json();
        if (data.status !== 'OK') throw new Error('API error');
        const sunriseUTC = new Date(data.results.sunrise);
        const sunsetUTC = new Date(data.results.sunset);
        const now = new Date();
        const isCurrentlyDark = now < sunriseUTC || now > sunsetUTC;
        console.log(isCurrentlyDark)
        setDark(isCurrentlyDark);
      } catch (err) {
        console.log(err);
        setDark(false);
      }
    };

    fetchData();
  });


    // const lampLayer = useMemo(() => {
    //   return {
    //     id: 'lamp',
    //         type: 'circle',
    //         source: 'vector',
    //         'source-layer':"light",
    //         paint: {
    //             'circle-color': 'cyan',
    //             'circle-opacity': 0.25
    //         }
    //   }
    // },[])

    const onSuccess = (position: GeolocationPosition) => {
      setCurrentLoc({
        determined: true,
        coordinates: {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }
      });
    };

    const onError = () => {
      setCurrentLoc({
        determined: false,
        coordinates: null
      });
    };

    useEffect(() => {
      if (!navigator.geolocation) {
        alert('Navigation not supported')
        return;
      }
      navigator.geolocation.getCurrentPosition(onSuccess, onError, OPTIONS);
    }, []);





    if (vw > vh) {
      return (
        <div style={{display: 'flex', flexDirection: 'row', width: '100vw', backgroundColor: dark ? '#171717ff' : 'white'}}>
        <div className='column'>
        <NavBar currentLoc={currentLoc} setALoc={setALoc} setBLoc={setBLoc}/> 
        </div>

          <Map
            style={{minWidth: '50%',  height: '100vh', width: 'calc(100vw - 450px)'}}
            mapStyle={dark ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" }
            ref={mapRef}
            initialViewState={{
              longitude: 37.55,
              latitude: 55.538,
              fitBoundsOptions: {minZoom: 9},
              zoom: 12.5,
            }}
          >
            {aLoc && 
              <Marker longitude={aLoc.lon} latitude={aLoc.lat}>
                <div style={pinStyle}>А</div>
              </Marker>
            }
            {bLoc && 
              <Marker longitude={bLoc.lon} latitude={bLoc.lat}>
                <div style={pinStyle}>Б</div>
              </Marker>
            }
            {/* <Source id="vector" type="vector" tiles={['safemap/src/light/{z}/{x}/{y}']}>
              <Layer {...lampLayer}/>
            </Source> */}
          </Map>
        </div>
      )
    }
    if (vh>vw) {
      return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div>

          </div>
          <div>

          </div>
        </div>
      )
    }
}

export default App
