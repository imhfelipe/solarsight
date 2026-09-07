"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";
import { GeocodingResult } from "@/lib/geocoding";
import { RotateCcw, Loader2, Sparkles, Compass, Eye, Layers } from "lucide-react";
import { ProvenanceTooltip } from "@/components/ui/ProvenanceTooltip";
import {
  analyzeRoofImageRidge,
  RidgeDetectionResult,
} from "@/lib/roof-image-analysis";
import vitoriaBairrosData from "@/data/vitoria-bairros.json";

export interface ShowcaseRoof {
  bairroId: string;
  bairroNome: string;
  address: string;
  center: [number, number]; // [lat, lng]
  coordinates: [number, number][]; // [[lng, lat], ...] WGS84
  azimutePreCalculado: number;
  areaCalculadaM2: number;
  descricao: string;
}

interface LeafletRoofMapProps {
  location: GeocodingResult;
  initialAreaM2?: number;
  onAreaConfirmed: (areaM2: number) => void;
  onAzimuthCandidatesSuggested?: (
    candidates: [number, number],
    detectionResult?: RidgeDetectionResult
  ) => void;
  viewMode?: "satellite" | "energy";
  onViewModeChange?: (mode: "satellite" | "energy") => void;
  selectedBairroId?: string;
  onBairroSelect?: (bairroId: string) => void;
  showcaseRoofToInject?: ShowcaseRoof | null;
}

export function LeafletRoofMap({
  location,
  initialAreaM2,
  onAreaConfirmed,
  onAzimuthCandidatesSuggested,
  viewMode = "satellite",
  onViewModeChange,
  selectedBairroId,
  onBairroSelect,
  showcaseRoofToInject,
}: LeafletRoofMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const ridgeLayerRef = useRef<L.Polyline | null>(null);

  const esriSatLayerRef = useRef<L.TileLayer | null>(null);
  const cartoDarkLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const [areaM2, setAreaM2] = useState<number>(initialAreaM2 || 0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<RidgeDetectionResult | null>(null);

  // Function to calculate polygon area & trigger OpenCV ridge analysis
  const processRoofAnalysis = async (targetPoly?: L.Polygon) => {
    if (!mapInstanceRef.current || !featureGroupRef.current) return;

    let totalArea = 0;
    let targetPolygonLayer: L.Polygon | null = targetPoly || null;

    featureGroupRef.current.eachLayer((layer: unknown) => {
      const l = layer as L.Polygon;
      if (typeof l.toGeoJSON === "function") {
        const geoJson = l.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
        totalArea += turf.area(geoJson);
        if (!targetPolygonLayer) targetPolygonLayer = l;
      }
    });

    const roundedArea = Number(totalArea.toFixed(1));
    setAreaM2(roundedArea);
    onAreaConfirmed(roundedArea);

    // Remove existing ridge line from map if present
    if (ridgeLayerRef.current) {
      mapInstanceRef.current.removeLayer(ridgeLayerRef.current);
      ridgeLayerRef.current = null;
    }

    if (!targetPolygonLayer || roundedArea <= 0) {
      setDetectionResult(null);
      return;
    }

    setIsAnalyzing(true);

    // Short delay to allow Leaflet tile rendering
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const result = await analyzeRoofImageRidge(mapInstanceRef.current, targetPolygonLayer);
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

  // Main Map Setup Effect
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
      zoom: 18,
      zoomControl: true,
    });

    const esriSat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        crossOrigin: true,
        attribution: "Tiles &copy; Esri &mdash; World Imagery",
      }
    );

    const cartoDark = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }
    );

    esriSatLayerRef.current = esriSat;
    cartoDarkLayerRef.current = cartoDark;

    if (viewMode === "energy") {
      cartoDark.addTo(map);
    } else {
      esriSat.addTo(map);
    }

    // GeoJSON Neighborhood Layer
    const geoJsonLayer = L.geoJSON(vitoriaBairrosData as unknown as GeoJSON.FeatureCollection, {
      style: (feature) => {
        const isSelected = selectedBairroId && feature?.properties?.id === selectedBairroId;
        return {
          color: isSelected ? "#ea580c" : "#06b6d4",
          weight: isSelected ? 3 : 1.5,
          fillColor: isSelected ? "#ea580c" : "#06b6d4",
          fillOpacity: isSelected ? 0.35 : 0.15,
          dashArray: isSelected ? undefined : "4, 4",
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        if (props && props.nome) {
          layer.bindTooltip(
            `<b>${props.nome}</b><br/>Potencial: <span style="color: #06b6d4; font-weight: bold;">${props.potencialAnualGwh} GWh/ano</span>`,
            { permanent: false, direction: "center" }
          );
        }

        layer.on("click", () => {
          if (onBairroSelect && props?.id) {
            onBairroSelect(props.id);
          }
        });
      },
    });

    geoJsonLayerRef.current = geoJsonLayer;
    if (viewMode === "energy") {
      geoJsonLayer.addTo(map);
    }

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

    map.on(L.Draw.Event.CREATED, (e: unknown) => {
      const event = e as { layer: L.Layer };
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      processRoofAnalysis();
    });

    map.on(L.Draw.Event.EDITED, () => processRoofAnalysis());
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

  // Effect to switch ViewMode ('satellite' vs 'energy')
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (viewMode === "energy") {
      if (esriSatLayerRef.current && map.hasLayer(esriSatLayerRef.current)) {
        map.removeLayer(esriSatLayerRef.current);
      }
      if (cartoDarkLayerRef.current && !map.hasLayer(cartoDarkLayerRef.current)) {
        cartoDarkLayerRef.current.addTo(map);
      }
      if (geoJsonLayerRef.current && !map.hasLayer(geoJsonLayerRef.current)) {
        geoJsonLayerRef.current.addTo(map);
      }
    } else {
      if (cartoDarkLayerRef.current && map.hasLayer(cartoDarkLayerRef.current)) {
        map.removeLayer(cartoDarkLayerRef.current);
      }
      if (geoJsonLayerRef.current && map.hasLayer(geoJsonLayerRef.current)) {
        map.removeLayer(geoJsonLayerRef.current);
      }
      if (esriSatLayerRef.current && !map.hasLayer(esriSatLayerRef.current)) {
        esriSatLayerRef.current.addTo(map);
      }
    }
  }, [viewMode]);

  // Effect to Fly to Selected Neighborhood in 'energy' mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    const geoJsonLayer = geoJsonLayerRef.current;
    if (!map || !geoJsonLayer || !selectedBairroId) return;

    geoJsonLayer.eachLayer((layer: unknown) => {
      const l = layer as L.Polygon & { feature?: GeoJSON.Feature };
      if (l.feature?.properties?.id === selectedBairroId) {
        map.flyToBounds(l.getBounds(), { duration: 1.5, padding: [20, 20] });
        l.setStyle({
          color: "#ea580c",
          fillColor: "#ea580c",
          fillOpacity: 0.35,
          weight: 3,
        });
      } else {
        l.setStyle({
          color: "#06b6d4",
          fillColor: "#06b6d4",
          fillOpacity: 0.15,
          weight: 1.5,
        });
      }
    });
  }, [selectedBairroId]);

  // Effect to Inject Showcase Roof Polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    const featureGroup = featureGroupRef.current;
    if (!map || !featureGroup || !showcaseRoofToInject) return;

    // Switch to satellite view mode if in energy mode
    if (viewMode !== "satellite" && onViewModeChange) {
      onViewModeChange("satellite");
    }

    // Convert coordinates from [lng, lat] WGS84 to Leaflet LatLng [lat, lng]
    const latLngs: [number, number][] = showcaseRoofToInject.coordinates.map(
      ([lng, lat]) => [lat, lng]
    );

    // Fly close to the house coordinates
    map.flyTo(showcaseRoofToInject.center, 19, { duration: 1.5 });

    // Clear previous drawn polygons and inject showcase roof polygon
    featureGroup.clearLayers();
    const showcasePolygon = L.polygon(latLngs, {
      color: "#06b6d4",
      fillColor: "#06b6d4",
      fillOpacity: 0.45,
      weight: 3,
    });
    featureGroup.addLayer(showcasePolygon);

    // Wait for zoom flyTo animation to finish, then process roof analysis (Turf.js + OpenCV.js)
    const timer = setTimeout(() => {
      processRoofAnalysis(showcasePolygon);
    }, 1200);

    return () => clearTimeout(timer);
  }, [showcaseRoofToInject]);

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

        {/* ViewMode Toggle Overlay */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => onViewModeChange && onViewModeChange("satellite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "satellite"
                ? "bg-[#ea580c] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Satélite (Micro)
          </button>

          <button
            onClick={() => onViewModeChange && onViewModeChange("energy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "energy"
                ? "bg-[#ea580c] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Mapa de Calor Bairros (Macro)
          </button>
        </div>

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
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              Área Útil do Telhado (Turf.js)
              <ProvenanceTooltip
                title="Cálculo Geodésico da Área Útil"
                source="Turf.js (@turf/area)"
                formula="Integração esférica das coordenadas vetoriais WGS84 do polígono desenhado sobre as imagens de satélite Esri World Imagery."
              />
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                {areaM2 > 0 ? areaM2.toLocaleString("pt-BR") : "0.0"}
              </span>
              <span className="text-sm font-semibold text-slate-300">m²</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Vetores WGS84 sobre Esri World Imagery
            </span>
          </div>

          {areaM2 > 0 && (
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
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

