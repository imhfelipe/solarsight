"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { GeocodingResult } from "@/lib/geocoding";
import { Layers, CheckCircle2, Edit3, Loader2, Sparkles, Compass, MapPin } from "lucide-react";
import { ProvenanceTooltip } from "@/components/ui/ProvenanceTooltip";
import { getCompassLabel } from "@/lib/solar-calculator";

// Carregamento dinâmico do mapa Leaflet no cliente para evitar erros de SSR window
const LeafletRoofMap = dynamic(
  () => import("@/components/map/LeafletRoofMap").then((mod) => mod.LeafletRoofMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-300 text-slate-600 text-xs gap-2 font-sans font-medium">
        <Loader2 className="w-5 h-5 animate-spin text-[#ea580c]" />
        <span>Carregando Imagem de Satélite Esri World Imagery (Vitória - ES)...</span>
      </div>
    ),
  }
);

interface StepMapProps {
  location: GeocodingResult;
  initialAreaM2?: number;
  onAreaConfirmed: (areaM2: number, candidates?: [number, number] | null) => void;
  onBack: () => void;
}

export function StepMap({ location, initialAreaM2, onAreaConfirmed, onBack }: StepMapProps) {
  const [areaM2, setAreaM2] = useState<number>(initialAreaM2 || 0);
  const [isManualAreaMode, setIsManualAreaMode] = useState<boolean>(false);
  const [manualAreaValue, setManualAreaValue] = useState<string>(initialAreaM2 ? String(initialAreaM2) : "50");
  const [azimuthCandidates, setAzimuthCandidates] = useState<[number, number] | null>(null);

  const handleConfirm = () => {
    const finalArea = isManualAreaMode ? parseFloat(manualAreaValue) || 50 : areaM2;
    if (finalArea <= 0) return;
    onAreaConfirmed(finalArea, azimuthCandidates);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <MapPin className="w-3 h-3 text-[#ea580c]" /> Vitória - ES (Imóvel Residencial)
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#ea580c]" />
            Passo 2: Mapeamento do Telhado Residencial & Área Útil (m²)
            <ProvenanceTooltip
              title="Cálculo Geodésico de Área do Telhado"
              source="Turf.js (@turf/area) sobre imagens Esri World Imagery"
              formula="Integração esférica das coordenadas WGS84 do polígono desenhado sobre a imagem de satélite em Vitória-ES."
            />
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Utilize a ferramenta de polígono no mapa para desenhar o contorno do telhado residencial. O sistema calculará a área e os azimutes das duas águas automaticamente.
          </p>
        </div>

        <button
          onClick={() => setIsManualAreaMode(!isManualAreaMode)}
          className="text-xs text-slate-700 hover:text-[#ea580c] font-bold underline flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-2 rounded-xl shrink-0 transition cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {isManualAreaMode ? "Usar Desenho no Mapa" : "Inserção Manual em m²"}
        </button>
      </div>

      {!isManualAreaMode ? (
        <div className="space-y-4">
          <LeafletRoofMap
            location={location}
            initialAreaM2={areaM2}
            onAreaConfirmed={(a) => setAreaM2(a)}
            onAzimuthCandidatesSuggested={(candidates) => setAzimuthCandidates(candidates)}
          />

          {/* Card Prominente de Sugestão Automática de Azimute via Telhado */}
          {azimuthCandidates && (
            <div className="p-4 rounded-2xl border-2 border-orange-200 bg-orange-50/80 text-xs space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#ea580c] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#ea580c] animate-pulse" />
                  Sugestão Geométrica Assistida com Confirmação Manual (Turf.js)
                </span>
                <span className="text-[10px] font-mono bg-white text-[#ea580c] border border-orange-200 px-2.5 py-0.5 rounded-full font-bold">
                  2 Águas Sugeridas (180° Opostos)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between shadow-xs">
                  <span className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#ea580c]" />
                    Face A (Cumeeira): <code className="text-[#ea580c] font-extrabold font-mono text-sm">{azimuthCandidates[0]}°</code>
                  </span>
                  <span className="text-xs text-[#ea580c] font-bold">
                    {getCompassLabel(azimuthCandidates[0])}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between shadow-xs">
                  <span className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-600" />
                    Face B (Água Oposta): <code className="text-slate-900 font-extrabold font-mono text-sm">{azimuthCandidates[1]}°</code>
                  </span>
                  <span className="text-xs text-slate-600 font-bold">
                    {getCompassLabel(azimuthCandidates[1])}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#ea580c]" />
            Entrada Manual da Área do Telhado Residencial
          </h3>
          <p className="text-xs text-slate-600">
            Informe a área útil aproximada da cobertura da residência em metros quadrados (m²).
          </p>

          <div>
            <label className="text-xs text-slate-700 font-bold block mb-1">Área Útil (m²):</label>
            <input
              type="number"
              min="5"
              max="5000"
              step="0.5"
              value={manualAreaValue}
              onChange={(e) => setManualAreaValue(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-[#ea580c]"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl border border-slate-300 transition cursor-pointer"
        >
          &larr; Voltar
        </button>

        <button
          onClick={handleConfirm}
          disabled={isManualAreaMode ? (parseFloat(manualAreaValue) || 0) <= 0 : areaM2 <= 0}
          className={`px-6 py-3 font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm ${
            (isManualAreaMode ? (parseFloat(manualAreaValue) || 0) > 0 : areaM2 > 0)
              ? "bg-gradient-to-r from-orange-500 via-[#ea580c] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirmar Área ({isManualAreaMode ? manualAreaValue || "0" : areaM2} m²) e Avançar &rarr;
        </button>
      </div>
    </div>
  );
}
