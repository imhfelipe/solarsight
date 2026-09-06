"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";
import { GeocodingResult } from "@/lib/geocoding";
import { RotateCcw } from "lucide-react";

interface LeafletRoofMapProps {
  location: GeocodingResult;
  initialAreaM2?: number;
  onAreaConfirmed: (areaM2: number) => void;
  onAzimuthCandidatesSuggested?: (candidates: [number, number]) => void;
}

export function LeafletRoofMap({
  location,
  initialAreaM2,
  onAreaConfirmed,
  onAzimuthCandidatesSuggested,
}: LeafletRoofMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);

  const [areaM2, setAreaM2] = useState<number>(initialAreaM2 || 0);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lon],
      zoom: 19,
      zoomControl: true,
    });

    const esriSat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    );

    const osmRoads = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    });

    esriSat.addTo(map);

    L.control.layers({ "Satélite (Esri World Imagery)": esriSat, "Ruas (OpenStreetMap)": osmRoads }).addTo(map);

    L.marker([location.lat, location.lon])
      .addTo(map)
      .bindPopup(`<b>${location.displayName}</b>`)
      .openPopup();

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    featureGroupRef.current = drawnItems;

    const drawControl = new (L.Control as unknown as { Draw: new (options: unknown) => L.Control }).Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: "#06b6d4",
            fillColor: "#06b6d4",
            fillOpacity: 0.4,
          },
        },
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });

    map.addControl(drawControl);

    // Eventos de cálculo de área com Turf.js e rumo da aresta mais longa para sugestão de azimute
    const calculateLayerMetrics = () => {
      let totalArea = 0;
      let longestEdgeMaxLen = 0;
      let longestEdgePts: [turf.Coord, turf.Coord] | null = null;

      drawnItems.eachLayer((layer: unknown) => {
        const l = layer as L.Polygon;
        const geoJson = l.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
        totalArea += turf.area(geoJson);

        // Identificar aresta mais longa
        const coords = geoJson.geometry.coordinates[0];
        if (coords && coords.length >= 3) {
          for (let i = 0; i < coords.length - 1; i++) {
            const p1 = turf.point(coords[i]);
            const p2 = turf.point(coords[i + 1]);
            const dist = turf.distance(p1, p2, { units: "meters" });
            if (dist > longestEdgeMaxLen) {
              longestEdgeMaxLen = dist;
              longestEdgePts = [coords[i], coords[i + 1]];
            }
          }
        }
      });

      const roundedArea = Number(totalArea.toFixed(1));
      setAreaM2(roundedArea);
      onAreaConfirmed(roundedArea);

      // Calcular azimute sugerido se encontrou aresta mais longa
      if (longestEdgePts && onAzimuthCandidatesSuggested) {
        const pointA = turf.point(longestEdgePts[0]);
        const pointB = turf.point(longestEdgePts[1]);
        const edgeBearing = turf.bearing(pointA, pointB);

        const azim1 = Math.round((edgeBearing + 90 + 360) % 360);
        const azim2 = Math.round((edgeBearing - 90 + 360) % 360);

        onAzimuthCandidatesSuggested([azim1, azim2]);
      }
    };

    map.on(L.Draw.Event.CREATED, (e: unknown) => {
      const event = e as { layer: L.Layer };
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      calculateLayerMetrics();
    });

    map.on(L.Draw.Event.EDITED, calculateLayerMetrics);
    map.on(L.Draw.Event.DELETED, calculateLayerMetrics);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location]);

  const handleReset = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      setAreaM2(0);
      onAreaConfirmed(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 h-[480px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Real-time Turf.js Area Card */}
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-6 z-[1000]">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
              Área Útil do Telhado (Turf.js)
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                {areaM2 > 0 ? areaM2.toLocaleString("pt-BR") : "0.0"}
              </span>
              <span className="text-sm font-semibold text-slate-300">m²</span>
            </div>
          </div>

          {areaM2 > 0 && (
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
              title="Limpar Polígono"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
