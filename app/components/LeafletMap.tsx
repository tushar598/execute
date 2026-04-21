"use client";

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons in Next.js
const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function ClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export interface LeafletMapProps {
    lat: number | null;
    lng: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function LeafletMap({ lat, lng, onLocationSelect }: LeafletMapProps) {
    const position: [number, number] = lat && lng ? [lat, lng] : [20.5937, 78.9629]; // Default: Centre of India
    const [mapKey, setMapKey] = useState(0);

    useEffect(() => {
        setMapKey(prev => prev + 1);
    }, []);

    return (
        <MapContainer
            key={mapKey}
            center={position}
            zoom={lat && lng ? 13 : 5}
            className="w-full h-full"
            style={{ zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onLocationSelect={onLocationSelect} />
            {lat && lng && <Marker position={[lat, lng]} icon={markerIcon} />}
        </MapContainer>
    );
}
