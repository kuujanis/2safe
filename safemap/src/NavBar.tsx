import { useCallback, useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";
import Arrow from "./Arrow"
import { AutoComplete, Input } from 'antd';
import type { ILocation, IPoint } from "./App";
import { API_KEY } from "./utils";

interface INavBarProps {
    currentLoc: ILocation,
    dark: boolean,
    setALoc: Dispatch<SetStateAction<IPoint|null>>, 
    setBLoc: Dispatch<SetStateAction<IPoint|null>>,
    aValue: string,
    setAValue: Dispatch<SetStateAction<string>>,
    bValue: string,
    setBValue: Dispatch<SetStateAction<string>>,
    width?: number,
    height?: number,
    vw: number,
    vh: number
}

export const NavBar = ({
        currentLoc, dark,
        setALoc, setBLoc,
        aValue,setAValue,
        bValue, setBValue,
        height = 90,
        vw, vh
    }: INavBarProps) => {
    
    
    const [suggestions, setSuggestions] = useState([])
    const width = (vw > vh) ? 400 : window.innerWidth
    const sHeight = 40
    const sWidth = (vw < vh) ? (width - 130) : (width - 50)

    const searchOptionsA = useMemo(() => {
      const options: {key: number, label: ReactElement, value: string}[] = []
      if (suggestions && suggestions.length > 0) {
        suggestions.map((suggestion, i) => {
          options.push({
            key: i,
            label: 
              <div className='optionLabel' onClick={() => {
                setALoc(suggestion['point']??null)
                setAValue(suggestion['name']??'') 
              }}>
                <div className='primary'>{suggestion['address_name']??suggestion['name']}</div>
                <div className='secondary'>{suggestion['building_name']}</div>
              </div>, 
            value: suggestion['name']??''
          })
        })
      }    
      return [{
            key: 'skibidi',
            label: 
              <div className='optionLabel'onClick={() => {
                setALoc(currentLoc.coordinates)
                setAValue('Моё местоположение')
              }}>
                <div className='my_loc'>Моё местоположение</div>
              </div>, 
            value: 'Моё местоположение'
          },...options]
    },[suggestions,currentLoc, setALoc, setAValue])
    const searchOptionsB = useMemo(() => {
      const options: {key: number, label: ReactElement, value: string}[] = []
      if (suggestions && suggestions.length > 0) {
        suggestions.map((suggestion, i) => {
          options.push({
            key: 30-i,
            label: 
              <div className='optionLabel' onClick={() => {
                setBLoc(suggestion['point']??null)
                setBValue(suggestion['name']??'')
                console.log('bclick')
              }}>
                <div className='primary'>{suggestion['address_name']??''}</div>
                <div className='secondary'>{suggestion['building_name']}</div>
              </div>, 
            value: suggestion['name']??''
          })
        })
      }    
      return [{
            key: 'diddy',
            label: 
              <div className='optionLabel'onClick={() => {
                setBLoc(currentLoc.coordinates)
                setBValue('Моё местоположение')
              }}>
                <div className='my_loc'>Моё местоположение</div>
              </div>, 
            value: 'Моё местоположение'
          },...options]
    },[suggestions,currentLoc, setBLoc, setBValue])

    const onAChange = useCallback(async (value: string) => {
        if (currentLoc?.coordinates){const res = await fetch(`https://catalog.api.2gis.com/3.0/suggests?q=${value}&suggest_type=object&location=${currentLoc.coordinates?.lon},${currentLoc.coordinates?.lat}&fields=items.point&key=${API_KEY}`)
        .then((res) => res.json())
        setAValue(value)
        console.log(res.result.items)
        setSuggestions(res.result.items)}
    },[currentLoc,setAValue])
    const onBChange = useCallback(async (value: string) => {
        if (currentLoc?.coordinates) {const res = await fetch(`https://catalog.api.2gis.com/3.0/suggests?q=${value}&suggest_type=address&location=${currentLoc.coordinates?.lon},${currentLoc.coordinates?.lat}&fields=items.point&key=${API_KEY}`)
        .then((res) => res.json())
        setBValue(value)
        setSuggestions(res.result.items)}
    },[currentLoc, setBValue])
    
    return (
                <div style={{
                    display: 'flex', flexDirection: 'row', width: width,
                    alignItems: 'center', margin: '10px 2px 0 2px',
                    color: dark ? "white" : 'grey', backgroundColor: dark ? '#141414ff' : "white"
                }}>
                  <div>
                    <Arrow size={sHeight}/>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: height}}>
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <AutoComplete
                          popupMatchSelectWidth={sWidth}
                          style={{ width: sWidth, height: sHeight}} 
                          options={searchOptionsA}
                        >
                          <Input
                            onChange={(e) => onAChange(e.target.value)}
                            placeholder={aValue} size="large" allowClear value={aValue} onClear={() => setALoc(null)}
                          />
                        </AutoComplete>
                        <div className='liter'>A</div>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <AutoComplete
                          popupMatchSelectWidth={sWidth}
                          style={{ width: sWidth, height: sHeight }} 
                          options={searchOptionsB}
                        >
                          <Input
                            onChange={(e) => onBChange(e.target.value)}
                            placeholder={bValue} size="large" allowClear value={bValue} onClear={() => setBLoc(null)}
                          />
                        </AutoComplete>
                        <div className='liter'>Б</div>
                      </div>
                  </div>
                  
                </div>
    )
}