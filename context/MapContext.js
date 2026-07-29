import React, { createContext, useState, useContext } from 'react';

const MapContext = createContext();

export function MapProvider({ children }) {
  // 'Standard' | 'Satellite' | 'Dark'
  const [mapType, setMapType] = useState('Standard');

  return (
    <MapContext.Provider value={{ mapType, setMapType }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapTheme() {
  return useContext(MapContext);
}