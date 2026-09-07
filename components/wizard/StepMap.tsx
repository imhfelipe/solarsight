"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { GeocodingResult } from "@/lib/geocoding";
import {
  Layers,
  CheckCircle2,
  Edit3,
  Loader2,
  Sparkles,
  Compass,
  MapPin,
  Info,
  Maximize2,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { ProvenanceTooltip } from "@/components/ui/ProvenanceTooltip";
import { getCompassLabel } from "@/lib/solar-calculator";
import { RidgeDetectionResult } from "@/lib/roof-image-analysis";

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
  onAreaConfirmed: (
    areaM2: number,
    candidates?: [number, number] | null,
    detectionResult?: RidgeDetectionResult | null
  ) => void;
  onBack: () => void;
}

export function StepMap({
  location,
  initialAreaM2,
  onAreaConfirmed,
  onBack,
}: StepMapProps) {
  const [areaM2, setAreaM2] = useState<number>(initialAreaM2 || 0);
  const [isManualAreaMode, setIsManualAreaMode] = useState<boolean>(false);
  const [manualAreaValue, setManualAreaValue] = useState<string>(
    initialAreaM2 ? String(initialAreaM2) : "50"
  );
  const [azimuthCandidates, setAzimuthCandidates] = useState<[number, number] | null>(null);
  const [detectionResult, setDetectionResult] = useState<RidgeDetectionResult | null>(null);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<0 | 1>(0);

  const handleConfirm = () => {
    const finalArea = isManualAreaMode ? parseFloat(manualAreaValue) || 50 : areaM2;
    if (finalArea <= 0) return;

    let reorderedCandidates = azimuthCandidates;
    if (azimuthCandidates && selectedFaceIndex === 1) {
      reorderedCandidates = [azimuthCandidates[1], azimuthCandidates[0]];
    }

    onAreaConfirmed(finalArea, reorderedCandidates, detectionResult);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Cabeçalho do Passo 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <MapPin className="w-3 h-3 text-[#ea580c]" /> Vitória - ES (Imóvel Residencial)
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#ea580c]" />
            Passo 2: Mapeamento do Telhado & Detecção de Cumeeira (OpenCV.js)
            <ProvenanceTooltip
              title="Cálculo Geodésico & Análise de Imagem"
              source="Turf.js (@turf/area) + OpenCV.js (WASM Client-side)"
              formula="Integração geodésica WGS84 para área útil e segmentação por brilho/sombra (K-Means/Otsu) para cumeeira."
            />
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Desenhe o contorno do telhado sobre a imagem de satélite. O sistema calculará a área geodésica real e detectará a cumeeira por análise de sombra em tempo real.
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
            onAzimuthCandidatesSuggested={(candidates, result) => {
              setAzimuthCandidates(candidates);
              if (result) setDetectionResult(result);
            }}
          />

          {/* Painel Explicativo Transparente: Como o Telhado é Calculado */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#ea580c]" />
                Como o Cálculo do Telhado é Realizado (Metodologia Transparente)
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-semibold border border-slate-700">
                100% Processado no Navegador (Client-side)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Cálculo da Área Útil */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs">
                    <Maximize2 className="w-3.5 h-3.5" /> 1. Cálculo da Área Útil em m² (Turf.js)
                  </span>
                  <ProvenanceTooltip
                    title="Cálculo de Área Esférica WGS84"
                    source="Turf.js (@turf/area)"
                    formula="Integração esférica das coordenadas WGS84 do polígono desenhado sobre os tiles de satélite Esri World Imagery."
                  />
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  O contorno desenhado é convertido em polígono geodésico WGS84. A biblioteca <code className="text-cyan-400 font-mono">@turf/area</code> calcula a área real em metros quadrados ($m^2$), projetando a curvatura terrestre local na latitude de Vitória-ES (~20.31°S).
                </p>
              </div>

              {/* Box 2: Detecção de Cumeeira por Imagem */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-400 flex items-center gap-1.5 text-xs">
                    <Sun className="w-3.5 h-3.5" /> 2. Orientação & Cumeeira (OpenCV.js WASM)
                  </span>
                  <ProvenanceTooltip
                    title="Análise de Sombra/Brilho por Visão Computacional"
                    source="OpenCV.js (Build WASM Oficial)"
                    formula="Recorte em canvas da área do polígono, conversão para escala de cinza, filtro Gaussiano, segmentação K-Means/Otsu do contraste (ΔB) e extração da linha via Canny + HoughLinesP."
                  />
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  A imagem de satélite do telhado é recortada na memória. O algoritmo OpenCV.js analisa o contraste entre o lado iluminado e o lado sombreado ($\Delta B$). A linha de separação é extraída como cumeeira e converte-se o rumo em azimutes das duas águas (bearing $\pm 90^\circ$).
                </p>
              </div>
            </div>
          </div>

          {/* Card Prominente de Sugestão de Azimute com Proveniência OpenCV.js */}
          {azimuthCandidates && (
            <div
              className={`p-4 rounded-2xl border-2 space-y-3 shadow-sm transition-all ${
                detectionResult?.method === "image"
                  ? "border-orange-300 bg-orange-50/90"
                  : "border-slate-300 bg-slate-50/90"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className={`w-4 h-4 ${
                      detectionResult?.method === "image"
                        ? "text-[#ea580c] animate-pulse"
                        : "text-slate-600"
                    }`}
                  />
                  <span className="font-extrabold text-[#ea580c] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    {detectionResult?.method === "image"
                      ? "Sugestão por Análise de Sombra/Brilho da Imagem"
                      : "Sugestão Geométrica (Fallback de Baixa Confiança)"}
                  </span>

                  {detectionResult && (
                    <ProvenanceTooltip
                      title={
                        detectionResult.method === "image"
                          ? "Sugestão por Análise de Sombra/Brilho"
                          : "Sugestão Geométrica (Longest Edge)"
                      }
                      source={
                        detectionResult.method === "image"
                          ? "OpenCV.js (WASM oficial), processado no seu navegador"
                          : "Turf.js (@turf/bearing)"
                      }
                      formula={
                        detectionResult.method === "image"
                          ? `Segmentação K-Means/Otsu entre regiões de iluminação/sombra (Diferença de intensidade ΔB = ${
                              detectionResult.contrastDelta ?? "N/A"
                            }).`
                          : detectionResult.reason ||
                            "Aresta mais longa do contorno desenhado como fallback devido a baixo contraste."
                      }
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {detectionResult?.contrastDelta !== undefined && (
                    <span className="text-[10px] font-mono bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                      ΔB: {detectionResult.contrastDelta} / 255
                    </span>
                  )}
                  <span className="text-[10px] font-mono bg-white text-[#ea580c] border border-orange-200 px-2.5 py-0.5 rounded-full font-bold">
                    {detectionResult?.method === "image"
                      ? "Detectado via OpenCV.js"
                      : "Heurística Geométrica"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 font-medium">
                {detectionResult?.provenanceLabel ||
                  "Selecione a face de instalação desejada para os painéis fotovoltaicos:"}
              </p>

              {/* Controles de Seleção Manual da Face (Face A / Face B) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedFaceIndex(0)}
                  className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                    selectedFaceIndex === 0
                      ? "bg-white border-[#ea580c] ring-2 ring-orange-400/40 shadow-sm"
                      : "bg-white/60 border-slate-200 hover:border-orange-200"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#ea580c]" />
                      Face A (Sugerida):{" "}
                      <code className="text-[#ea580c] font-extrabold font-mono text-sm">
                        {azimuthCandidates[0]}°
                      </code>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      Orientação {getCompassLabel(azimuthCandidates[0])}
                    </span>
                  </div>
                  {selectedFaceIndex === 0 && (
                    <CheckCircle2 className="w-5 h-5 text-[#ea580c] shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFaceIndex(1)}
                  className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                    selectedFaceIndex === 1
                      ? "bg-white border-[#ea580c] ring-2 ring-orange-400/40 shadow-sm"
                      : "bg-white/60 border-slate-200 hover:border-orange-200"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-amber-600" />
                      Face B (Água Oposta):{" "}
                      <code className="text-slate-900 font-extrabold font-mono text-sm">
                        {azimuthCandidates[1]}°
                      </code>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      Orientação {getCompassLabel(azimuthCandidates[1])}
                    </span>
                  </div>
                  {selectedFaceIndex === 1 && (
                    <CheckCircle2 className="w-5 h-5 text-[#ea580c] shrink-0" />
                  )}
                </button>
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
