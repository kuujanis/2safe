import { useCallback, useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";
import Arrow from "./Arrow"
import { AutoComplete, Input } from 'antd';
import type { ILocation, IPoint } from "./App";
import { API_KEY } from "./utils";

interface INavBarProps {
    currentLoc: ILocation,
    setALoc: Dispatch<SetStateAction<IPoint|null>>, 
    setBLoc: Dispatch<SetStateAction<IPoint|null>>
}

export const NavBar = ({
        currentLoc,
        setALoc, 
        setBLoc,
    }: INavBarProps) => {
    
    const [aValue, setAValue] = useState<string>('')
    const [bValue, setBValue] = useState<string>('')
    const [suggestions, setSuggestions] = useState([])

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
    },[suggestions,currentLoc, setALoc])
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
    },[suggestions,currentLoc, setBLoc])

    const onAChange = useCallback(async (value: string) => {
        if (currentLoc?.coordinates){const res = await fetch(`https://catalog.api.2gis.com/3.0/suggests?q=${value}&suggest_type=object&location=${currentLoc.coordinates?.lon},${currentLoc.coordinates?.lat}&fields=items.point&key=${API_KEY}`)
        .then((res) => res.json())
        setAValue(value)
        console.log(res.result.items)
        setSuggestions(res.result.items)}
    },[currentLoc])
    const onBChange = useCallback(async (value: string) => {
        if (currentLoc?.coordinates) {const res = await fetch(`https://catalog.api.2gis.com/3.0/suggests?q=${value}&suggest_type=address&location=${currentLoc.coordinates?.lon},${currentLoc.coordinates?.lat}&fields=items.point&key=${API_KEY}`)
        .then((res) => res.json())
        setBValue(value)
        setSuggestions(res.result.items)}
    },[currentLoc])
    
    return (
                <div style={{display: 'flex', flexDirection: 'row', width: '400px', alignItems: 'center', margin: '12px 2px'}}>
                  <div>
                    <Arrow size={40}/>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '90px'}}>
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <AutoComplete
                          popupMatchSelectWidth={350}
                          style={{ width: 350, height: 40}} 
                          options={searchOptionsA}
                        >
                          <Input
                            onChange={(e) => onAChange(e.target.value)}
                            placeholder="Начало маршрута" size="large" allowClear value={aValue} onClear={() => setALoc(null)}
                          />
                        </AutoComplete>
                        <div className='liter'>A</div>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <AutoComplete
                          popupMatchSelectWidth={350}
                          style={{ width: 350, height: 40 }} 
                          options={searchOptionsB}
                        >
                          <Input
                            onChange={(e) => onBChange(e.target.value)}
                            placeholder="Пункт назначения" size="large" allowClear value={bValue} onClear={() => setBLoc(null)}
                          />
                        </AutoComplete>
                        <div className='liter'>Б</div>
                      </div>
                  </div>
                  
                </div>
    )
}