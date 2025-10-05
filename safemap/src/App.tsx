import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { API_KEY, useDebounce, useViewport } from './utils'
import type { GeoJSONFeature } from 'maplibre-gl'
import { Layer, Map, Marker, Source, type LayerProps, type MapRef, type MarkerDragEvent, } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Checkbox, Switch } from "antd";
import { NavBar } from './NavBar'
import { InfoCard } from './InfoCard'
interface GeoJSON {
  type: "FeatureCollection",
  features: GeoJSONFeature[]
}

const emptyGeoJSON:GeoJSON = {
  type: 'FeatureCollection', 
  features: []
}


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
  const [aValue, setAValue] = useState<string>('')
  const [bValue, setBValue] = useState<string>('')

  const [naturalCycle, setNaturalCycle] = useState(true)
  const [dark,setDark] = useState<boolean>(false)
  const [route,setRoute] = useState<GeoJSON|null>()
  // const [reverseGeocoding, setReverseGeocoding] = useState<boolean>(false)
  
  
  const { vw, vh } = useViewport()
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    if (naturalCycle) {const fetchData = async () => {
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
    }
  });


    const lampLayer:LayerProps = useMemo(() => {
      return {
        id: 'lamp',
        source: 'light',
        type: 'circle',
        'source-layer':'mbtiles',
        paint: {
          'circle-color': 'red',
          // 'circle-opacity': 0.25,
          'circle-radius': 2
        }
      }
    },[])

    const routeLayer: LayerProps = useMemo(() => {
      return {
        id: 'route',
        type: 'line',
        paint: {
          'line-color': 'red',
          'line-width': 2
        }
      }
    },[])

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

    const debALoc: IPoint|null = useDebounce(aLoc, 30)
    const debBLoc: IPoint|null = useDebounce(bLoc, 30)

    useEffect(() => {
      const fetchRoute = async (
        lon_start:number, 
        lat_start:number,
        lon_end:number,
        lat_end:number
      ) => {
        setRoute(emptyGeoJSON)
        const res = await fetch(`http://89.232.188.156:5000/api/coords=${lon_start},${lat_start};${lon_end},${lat_end}`)
        .then(res => res.json())
        setRoute(res)
        console.log(res)
      }
      if (debALoc && debBLoc) {
        console.log('ablock')
        fetchRoute(debALoc.lon,debALoc.lat,debBLoc.lon,debBLoc.lat)
      }
    },[debALoc, debBLoc])

    useEffect(() => {
      if (!navigator.geolocation) {
        alert('Navigation not supported')
        return;
      }
      navigator.geolocation.getCurrentPosition(onSuccess, onError, OPTIONS);
    }, []);

    const handleDragA = useCallback((e: MarkerDragEvent) => {
      setAValue('')
      const fetchLabel = async () => {
        const res = await fetch(`https://catalog.api.2gis.com/3.0/items/geocode?lon=${e.lngLat.lng}&lat=${e.lngLat.lat}124&radius=50&fields=items.name&key=${API_KEY}`)
        .then((res) => res.json())
        console.log(res)
        const t = res.result.items && res.result.items[0]
        setAValue(t.addrss_name ?? t.full_name)
      }
      fetchLabel()
      setALoc({lon: e.lngLat.lng, lat: e.lngLat.lat})
    },[])

    const handleDragB = useCallback((e: MarkerDragEvent) => {
      setBValue('')
      const fetchLabel = async () => {
        const res = await fetch(`https://catalog.api.2gis.com/3.0/items/geocode?lon=${e.lngLat.lng}&lat=${e.lngLat.lat}124&radius=50&fields=items.name&key=${API_KEY}`)
        .then((res) => res.json())
        console.log(res)
        const t = res.result.items && res.result.items[0]
        setBValue(t.addrss_name ?? t.full_name)
      }
      fetchLabel()
      setBLoc({lon: e.lngLat.lng, lat: e.lngLat.lat})
    },[])


    if (vw > vh) {
      return (
        <div style={{display: 'flex', flexDirection: 'row', width: '100vw', backgroundColor: dark ? '#171717ff' : 'white'}}>
        <div className='column'>
        <NavBar 
          currentLoc={currentLoc} dark={dark}
          setALoc={setALoc} 
          setBLoc={setBLoc} 
          vw={vw} vh={vh} 
          setAValue={setAValue}
          setBValue={setBValue}
          aValue={aValue} bValue={bValue}
        /> 
        {route && <InfoCard pathLength={1000} pathTime={12} safetyCategory={{score: 120, mark: 'High'}} dark={dark}/>}
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
              <Marker longitude={aLoc.lon} latitude={aLoc.lat} draggable onDragEnd={(e) => handleDragA(e)}>
                <div style={pinStyle}>А</div>
              </Marker>
            }
            {bLoc && 
              <Marker longitude={bLoc.lon} latitude={bLoc.lat} draggable onDragEnd={(e) => handleDragB(e)}>
                <div style={pinStyle}>Б</div>
              </Marker>
            }
            <Source id='routesrc' type='geojson' data={route ? route : emptyGeoJSON }>
              <Layer {...routeLayer}/>
            </Source>
            <Source id='light' type='vector' tiles={['http://89.232.188.156:8080/data/light/{z}/{x}/{y}.pbf']}>
              <Layer {...lampLayer}/>
            </Source>
            <div style={{
              position: 'absolute', top: 10, right: 30, gap: 10, 
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
            }}>
              <Checkbox 
                checked={naturalCycle} 
                onChange={(e)=> setNaturalCycle(e.target.checked)} 
                style={{fontSize: '1.1rem', fontWeight: '700', color: 'grey'}}
              >
                Естественный свет
              </Checkbox>
              <div style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                <div style={{fontSize: '1.1rem', fontWeight: '700', color: 'grey'}}>
                  {dark ? 'Ночь':'День'}
                </div>
                <Switch disabled={naturalCycle} checked={dark} size={'default'} onChange={(checked) => setDark(checked)}/>
              </div>
            </div>
          </Map>
        </div>
      )
    }
    if (vh>vw) {
      return (
        <div className='mobile' style={{backgroundColor: dark ? '#141414ff' : "white"}}>
          <NavBar 
            currentLoc={currentLoc} dark={dark}
            setALoc={setALoc} setBLoc={setBLoc} 
            vw={vw} vh={vh}
            setAValue={setAValue}
            setBValue={setBValue}
            aValue={aValue} bValue={bValue}
          />
          <Map
            style={{minWidth: '50%',  height: 'calc(100% - 100px)', width: '100%'}}
            mapStyle={dark ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" }
            ref={mapRef}
            onClick={(e) => console.log(e)}
            initialViewState={{
              longitude: 37.55,
              latitude: 55.538,
              fitBoundsOptions: {minZoom: 9},
              zoom: 12.5,
            }}
          >
            {aLoc && 
              <Marker longitude={aLoc.lon} latitude={aLoc.lat} draggable onDragEnd={(e) => handleDragA(e)}>
                <div style={pinStyle}>А</div>
              </Marker>
            }
            {bLoc && 
              <Marker longitude={bLoc.lon} latitude={bLoc.lat} draggable onDragEnd={(e) => handleDragB(e)}> 
                <div style={pinStyle}>Б</div>
              </Marker>
            }
            <Source  id='routesrc' type='geojson' data={route ? route : emptyGeoJSON }>
              <Layer {...routeLayer}/>
            </Source>
            <div style={{
              position: 'absolute', top: 10, right: 30, gap: 10, 
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
            }}>
              <Checkbox 
                checked={naturalCycle} 
                onChange={(e)=> setNaturalCycle(e.target.checked)} 
                style={{fontSize: '1.1rem', fontWeight: '700', color: 'grey'}}
              >
                Естественный свет
              </Checkbox>
              <div style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                <div style={{fontSize: '1.1rem', fontWeight: '700', color: 'grey'}}>
                  {dark ? 'Ночь':'День'}
                </div>
                <Switch disabled={naturalCycle} checked={dark} size={'default'} onChange={(checked) => setDark(checked)}/>
              </div>
            </div>
            
          </Map>
        </div>
      )
    }
}

export default App
