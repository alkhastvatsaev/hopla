'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Centers map on the driver if we have their location
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && !isNaN(center[0])) {
        map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function DriverMap({ jobs, driverPos }: { jobs: any[], driverPos: { lat: number, lng: number } | null }) {
  const strasbourgCenter: [number, number] = [48.5734, 7.7521];
  const centerPos: [number, number] = driverPos && !isNaN(driverPos.lat) ? [driverPos.lat, driverPos.lng] : strasbourgCenter;
  
  if (typeof window === 'undefined') return null;

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f2f2f7' }}>
      <MapContainer 
        center={centerPos} 
        zoom={driverPos ? 14 : 12} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#f5f5f7' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          className="map-tiles"
        />

        <ChangeView center={centerPos} />

        {/* Current Driver Pos */}
        {driverPos && !isNaN(driverPos.lat) && (
            <CircleMarker center={[driverPos.lat, driverPos.lng]} radius={8} pathOptions={{ fillColor: '#007AFF', fillOpacity: 1, color: 'white', weight: 4 }}>
               <Popup>Ma position</Popup>
            </CircleMarker>
        )}

        {/* Available Jobs */}
        {jobs.filter(j => j.locationCoords && !isNaN(j.locationCoords.lat)).map(job => (
             <CircleMarker 
                key={job.id} 
                center={[job.locationCoords.lat, job.locationCoords.lng]} 
                radius={12} 
                pathOptions={{ 
                    fillColor: job.type === 'colis' ? '#FF9500' : '#34C759', 
                    fillOpacity: 0.8, 
                    color: 'white', 
                    weight: 2 
                }}
             >
               <Popup>
                    <div style={{ fontWeight: 700 }}>{job.reward} - {job.type === 'colis' ? 'Colis' : 'Courses'}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{job.location}</div>
               </Popup>
             </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
