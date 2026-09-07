"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";
import { GeocodingResult } from "@/lib/geocoding";
import { RotateCcw, Loader2, Sparkles, Compass } from "lucide-react";
import {
  analyzeRoofImageRidge,
  RidgeDetectionResult,
} from "@/lib/roof-image-analysis";

interface LeafletRoofMapProps {
  location: GeocodingResult;
  initialAreaM2?: number;
  onAreaConfirmed: (areaM2: number) => void;
  onAzimuthCandidatesSuggested?: (
    candidates: [number, number],
    detectionResult?: RidgeDetectionResult
  ) => void;
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
  const ridgeLayerRef = useRef<L.Polyline | null>(null);

  const [areaM2, setAreaM2] = useState<number>(initialAreaM2 || 0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<RidgeDetectionResult | null>(null);

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

    // Option `crossOrigin: true` enables client-side canvas cropping without tainted canvas issues
    const esriSat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        crossOrigin: true,
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    );

    const osmRoads = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    });

    esriSat.addTo(map);

    L.control
      .layers({
        "Satélite (Esri World Imagery)": esriSat,
        "Ruas (OpenStreetMap)": osmRoads,
      })
      .addTo(map);

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

    const processRoofAnalysis = async () => {
      let totalArea = 0;
      let targetPolygonLayer: L.Polygon | null = null;

      drawnItems.eachLayer((layer: unknown) => {
        const l = layer as L.Polygon;
        const geoJson = l.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
        totalArea += turf.area(geoJson);
        targetPolygonLayer = l;
      });

      const roundedArea = Number(totalArea.toFixed(1));
      setAreaM2(roundedArea);
      onAreaConfirmed(roundedArea);

      // Remove existing ridge line from map if present
      if (ridgeLayerRef.current) {
        map.removeLayer(ridgeLayerRef.current);
        ridgeLayerRef.current = null;
      }

      if (!targetPolygonLayer || roundedArea <= 0) {
        setDetectionResult(null);
        return;
      }

      setIsAnalyzing(true);

      // Short delay to allow Leaflet tile rendering
      await new Promise((resolve) => setTimeout(resolve, 150));

      try {
        const result = await analyzeRoofImageRidge(map, targetPolygonLayer);
        setDetectionResult(result);

        // Draw detected ridge line on map
        if (result.ridgeLinePoints && mapInstanceRef.current) {
          const lineLatLngs: [number, number][] = [
            [result.ridgeLinePoints[0].lat, result.ridgeLinePoints[0].lng],
            [result.ridgeLinePoints[1].lat, result.ridgeLinePoints[1].lng],
          ];

          const ridgePolyline = L.polyline(lineLatLngs, {
            color: result.method === "image" ? "#ea580c" : "#06b6d4",
            weight: 4,
            dashArray: result.method === "image" ? "6, 6" : "3, 3",
            opacity: 0.95,
          }).addTo(mapInstanceRef.current);

          ridgePolyline.bindTooltip(
            result.method === "image"
              ? "Cumeeira detectada por análise de imagem (OpenCV.js)"
              : "Linha de cumeeira sugerida (Aresta geométrica)",
            { permanent: false, direction: "top" }
          );

          ridgeLayerRef.current = ridgePolyline;
        }

        if (onAzimuthCandidatesSuggested) {
          onAzimuthCandidatesSuggested(result.candidateAzimuths, result);
        }
      } catch (err) {
        console.error("Erro na análise de imagem do telhado:", err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    map.on(L.Draw.Event.CREATED, (e: unknown) => {
      const event = e as { layer: L.Layer };
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      processRoofAnalysis();
    });

    map.on(L.Draw.Event.EDITED, processRoofAnalysis);
    map.on(L.Draw.Event.DELETED, () => {
      if (ridgeLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(ridgeLayerRef.current);
        ridgeLayerRef.current = null;
      }
      setAreaM2(0);
      onAreaConfirmed(0);
      setDetectionResult(null);
    });

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
    }
    if (ridgeLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(ridgeLayerRef.current);
      ridgeLayerRef.current = null;
    }
    setAreaM2(0);
    onAreaConfirmed(0);
    setDetectionResult(null);
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 h-[480px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Non-Blocking Loading Indicator */}
        {isAnalyzing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white backdrop-blur-md border border-orange-500/50 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold z-[1000] animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#ea580c]" />
            <span>Analisando orientação do telhado... (OpenCV.js WASM)</span>
          </div>
        )}

        {/* Provenance badge overlay when analysis completes */}
        {detectionResult && !isAnalyzing && (
          <div className="absolute top-4 left-4 z-[1000] max-w-sm">
            <div
              className={`px-3 py-1.5 rounded-xl border backdrop-blur-md text-[11px] font-bold shadow-lg flex items-center gap-2 ${
                detectionResult.method === "image"
                  ? "bg-slate-900/90 text-orange-400 border-orange-500/40"
                  : "bg-slate-900/90 text-cyan-400 border-cyan-500/40"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                {detectionResult.method === "image"
                  ? "Cumeeira por Análise de Imagem (OpenCV.js)"
                  : "Sugestão Geométrica (Longest Edge)"}
              </span>
            </div>
          </div>
        )}

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
