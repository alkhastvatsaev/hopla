
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Custom Destination Icon (Enhanced Minimalist Apple-style)
const DestinationIcon = L.divIcon({
  className: 'custom-dest-icon',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="
        background: #34C759; 
        width: 24px; height: 24px; 
        border: 3px solid white;
        border-radius: 50%; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        display: flex; align-items: center; justify-content: center;
      ">
         <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
      </div>
      <div style="
        width: 4px; height: 6px; 
        background: white; 
        margin-top: -2px;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      "></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 28]
});

// Custom Driver Icon
const DriverIcon = L.divIcon({
  className: 'custom-driver-icon',
  html: `
    <div style="
      background: #007AFF; 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Component to handle map center updates
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && !isNaN(center[0])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function TrackingMap({ status, clientCoords }: { status: string, clientCoords?: {lat: number, lng: number} }) {
  // Strasbourg default fallback
  const strasbourgCenter: [number, number] = [48.5734, 7.7521];
  
  const [driverPos, setDriverPos] = useState<[number, number]>(strasbourgCenter);
  const [clientPos, setClientPos] = useState<[number, number]>(
    clientCoords ? [clientCoords.lat, clientCoords.lng] : strasbourgCenter
  );

  // Update center when clientCoords change
  useEffect(() => {
    if (clientCoords && !isNaN(clientCoords.lat)) {
      setClientPos([clientCoords.lat, clientCoords.lng]);
    }
  }, [clientCoords]);

  useEffect(() => {
    if (status === 'taken' || status === 'delivering') {
      const interval = setInterval(() => {
        setDriverPos(prev => [
          prev[0] + (Math.random() - 0.5) * 0.001,
          prev[1] + (Math.random() - 0.5) * 0.001
        ]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (typeof window === 'undefined') return null;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer 
        id="hopla-map-container"
        key="stable-hopla-map-v2"
        center={clientPos} 
        zoom={14} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#f5f5f7' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          className="map-tiles"
        />
        
        <ChangeView center={status === 'open' ? clientPos : driverPos} />

        {/* Client Position */}
        <Marker position={clientPos} icon={DestinationIcon}>
          <Popup>Votre destination</Popup>
        </Marker>

        {/* Driver Position (Visible if assigned) */}
        {status !== 'open' && (
          <Marker position={driverPos} icon={DriverIcon}>
            <Popup>Votre livreur est ici</Popup>
          </Marker>
        )}
      </MapContainer>

      <style jsx global>{`
        .map-tiles {
          filter: saturate(1.1) brightness(1.02); /* Softer, natural modern feel */
        }
        .leaflet-container {
          background: #f5f5f7 !important;
        }
        .custom-driver-icon {
          transition: all 5s linear !important;
        }
      `}</style>
    </div>
  );
}
