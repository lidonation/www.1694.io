import React from 'react'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'

function Map({ location }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API,
  })
  const center = {
    lat: location.latitude,
    lng: location.longitude,
  }
  if (!isLoaded) {
    return <h2 className="text-center text-2xl text-black dark:text-white">Loading map..</h2>
  }
  return (
    <div className="h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={10}
      >
        <MarkerF position={center} />
      </GoogleMap>
    </div>
  )
}

export default Map
