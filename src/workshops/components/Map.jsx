import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import getConfig from "next/config";

function Map({ location }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API,
  })
  const center = {
    lat: location[0],
    lng: location[1],
  }
  if (!isLoaded) {
    return <h2 className="text-2xl text-center text-black dark:text-white">Loading map..</h2>
  }
  return (
    <div className="h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={16}
      >
        <MarkerF position={center} />
      </GoogleMap>
    </div>
  )
}

export default Map
