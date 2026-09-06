"use client";

import React, { useState } from "react";
import panelCatalogData from "@/data/panels.json";
import { SolarPanel, calculateLiuJordanTranspositionFactor as calculateTranspositionFactor, calculateCoordinateTilt, getCompassLabel } from "@/lib/solar-calculator";
import { DEFAULT_AZIMUTH_DEGREES } from "@/lib/constants";
import { ProvenanceTooltip } from "@/components/ui/ProvenanceTooltip";
import { Sun, Zap, Grid, Compass, CheckCircle2, Sliders, MapPin, Sparkles, Info, HelpCircle } from "lucide-react";

interface StepPanelProps {
  roofAreaM2: number;
  latitude: number;
  selectedPanel?: SolarPanel | null;
  initialAzimuth?: number;
  suggestedAzimuthCandidates?: [number, number] | null;
  onPanelSelected: (
    panel: SolarPanel,
    capacityKwp: number,
    moduleCount: number,
    tilt: number,
    azimuth: number
  ) => void;
  onBack: () => void;
}

export function StepPanel({
  roofAreaM2,
  latitude,
  selectedPanel: initialPanel,
  initialAzimuth = DEFAULT_AZIMUTH_DEGREES,
  suggestedAzimuthCandidates,
  onPanelSelected,
  onBack,
}: StepPanelProps) {
  const panels: SolarPanel[] = panelCatalogData as SolarPanel[];
  const [currentPanel, setCurrentPanel] = useState<SolarPanel>(initialPanel || panels[0]);
  const [azimuth, setAzimuth] = useState<number>(
    suggestedAzimuthCandidates ? suggestedAzimuthCandidates[0] : initialAzimuth
  );

  const calculatedTilt = calculateCoordinateTilt(latitude);
  const estimatedModules = Math.max(1, Math.floor((roofAreaM2 * 0.85) / currentPanel.areaM2));
  const installedCapacityKwp = Number(((estimatedModules * currentPanel.powerWp) / 1000).toFixed(2));
  const transFactor = calculateTranspositionFactor(latitude, calculatedTilt, azimuth);

  const handleConfirm = () => {
    onPanelSelected(currentPanel, installedCapacityKwp, estimatedModules, calculatedTilt, azimuth);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" /> RESIDÊNCIAS EM VITÓRIA - ES (LAT: {latitude.toFixed(4)}°)
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          <Sun className="w-6 h-6 text-[#ea580c]" />
          Passo 3: Módulo de Referência & Geometria Incidente
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm">
          Selecione o módulo fotovoltaico de referência e valide a inclinação/orientação do telhado residencial em Vitória - ES.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seletor de Módulos Pré-Definidos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selecione a Placa de Referência:
              </label>
              <ProvenanceTooltip sourceText="Catálogo nacional pré-definido com marcas Tier-1 de alta eficiência." />
            </div>
            <select
              value={currentPanel.id}
              onChange={(e) => {
                const found = panels.find((p) => p.id === e.target.value);
                if (found) setCurrentPanel(found);
              }}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-[#ea580c] text-sm"
            >
              {panels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} - {p.model} ({p.powerWp} Wp)
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-600 font-medium">Potência Nominal (STC):</span>
              <span className="text-[#ea580c] font-extrabold font-mono">{currentPanel.powerWp} Wp</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-600 font-medium">Eficiência de Fábrica:</span>
              <span className="text-[#ea580c] font-extrabold font-mono">{(currentPanel.efficiency * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-600 font-medium">Dimensões / Área Placa:</span>
              <span className="text-slate-900 font-semibold">{currentPanel.areaM2} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Tecnologia de Célula:</span>
              <span className="text-slate-900 font-semibold">{currentPanel.cellTech}</span>
            </div>
          </div>

          {/* Ajuste de Orientação Azimutal com Sugestão Nítida e Explicação */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#ea580c] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#ea580c]" /> Orientação / Azimute do Telhado Residencial
              </h4>
              <ProvenanceTooltip sourceText="Sugestão geométrica calculada via Turf.js a partir da cumeeira do telhado poligonal." />
            </div>

            {/* Explicação Clara: Por que a IA faz 2 sugestões de ângulos? */}
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#ea580c] font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-[#ea580c] shrink-0" />
                <span>Por que a IA sugere 2 ângulos de azimute?</span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Ao desenhar o telhado no mapa, o algoritmo (<strong>Turf.js</strong>) identifica o eixo da cumeeira. Telhados residenciais possuem <strong>duas águas (caimentos opostos a 180°)</strong>, logo a IA indica a <strong>Face A</strong> (uma vertente) e a <strong>Face B</strong> (vertente oposta).
              </p>
              <div className="bg-white p-2 rounded-lg border border-amber-200 text-[#ea580c] font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                <span>💡 Em Vitória-ES, escolha a face mais voltada para o <strong>Norte (0°)</strong>!</span>
              </div>
            </div>

            {/* Banner de Seleção dos 2 Ângulos Sugeridos */}
            {suggestedAzimuthCandidates ? (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Selecione a água do telhado onde os painéis serão instalados:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAzimuth(suggestedAzimuthCandidates[0])}
                    className={`p-3 rounded-xl text-left transition border-2 flex flex-col justify-between cursor-pointer ${
                      azimuth === suggestedAzimuthCandidates[0]
                        ? "bg-[#ea580c] text-white border-orange-500 font-bold shadow-md scale-[1.02]"
                        : "bg-white text-slate-800 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>Face A (Cumeeira):</span>
                      <span className="font-mono text-amber-200 font-bold">{suggestedAzimuthCandidates[0]}°</span>
                    </div>
                    <span className="text-[10px] opacity-90 mt-1 font-semibold">
                      {getCompassLabel(suggestedAzimuthCandidates[0])}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAzimuth(suggestedAzimuthCandidates[1])}
                    className={`p-3 rounded-xl text-left transition border-2 flex flex-col justify-between cursor-pointer ${
                      azimuth === suggestedAzimuthCandidates[1]
                        ? "bg-[#ea580c] text-white border-orange-500 font-bold shadow-md scale-[1.02]"
                        : "bg-white text-slate-800 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>Face B (Oposta):</span>
                      <span className="font-mono text-amber-200 font-bold">{suggestedAzimuthCandidates[1]}°</span>
                    </div>
                    <span className="text-[10px] opacity-90 mt-1 font-semibold">
                      {getCompassLabel(suggestedAzimuthCandidates[1])}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="flex items-center gap-1.5 font-semibold text-[#ea580c]">
                  <Compass className="w-4 h-4" /> Orientação padrão: 0° (Norte Verdadeiro para Vitória-ES).
                </span>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Ou Escolha Manualmente o Azimute:</label>
              <select
                value={azimuth}
                onChange={(e) => setAzimuth(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-[#ea580c]"
              >
                <option value={0}>0° - Norte Verdadeiro (Máxima Captação no ES)</option>
                <option value={45}>45° - Nordeste</option>
                <option value={90}>90° - Leste (Geração Matutina)</option>
                <option value={135}>135° - Sudeste</option>
                <option value={180}>180° - Sul</option>
                <option value={225}>225° - Sudoeste</option>
                <option value={270}>270° - Oeste (Geração Vespertina)</option>
                <option value={315}>315° - Noroeste</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumo de Geometria em Card Claro com Alto Contraste */}
        <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-md space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#ea580c] uppercase tracking-wider block">
                GEOMETRIA BASEADA NA COORDENADA (VITÓRIA-ES)
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Dimensionamento Preditivo</h3>

            {/* Banner de Inclinação Automática (Tilt) */}
            <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-800 font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#ea580c]" /> Inclinação Automática (Tilt):
                  <ProvenanceTooltip sourceText="Calculado dinamicamente a partir da latitude geográfica de Vitória-ES (|latitude|)." />
                </span>
                <span className="text-[#ea580c] font-extrabold font-mono text-xl">{calculatedTilt}°</span>
              </div>
              <p className="text-xs text-slate-600 leading-snug">
                Determinada pela latitude da coordenada geográfica de Vitória - ES (<code className="text-[#ea580c] font-bold font-mono">Tilt = |{latitude.toFixed(4)}°|</code>).
              </p>
            </div>

            {/* Grid Capacidade + Placas com Alto Contraste */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold">Capacidade</span>
                  </div>
                  <ProvenanceTooltip sourceText="Calculado a partir da área útil dividida pela dimensão do módulo e multiplicada pela potência Wp." />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {installedCapacityKwp} <span className="text-xs font-semibold text-slate-500">kWp</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-[#ea580c]" />
                    <span className="text-xs font-bold">Qtd. Placas</span>
                  </div>
                  <ProvenanceTooltip sourceText="Calculado considerando 85% de aproveitamento útil da área do telhado." />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {estimatedModules} <span className="text-xs font-semibold text-slate-500">módulos</span>
                </div>
              </div>
            </div>

            {/* Fator de Transposição */}
            <div className="mt-4 bg-orange-50/70 p-3.5 rounded-xl border border-orange-200 flex items-center justify-between text-xs shadow-xs">
              <span className="text-slate-800 font-bold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#ea580c]" /> Fator de Transposição (K_trans):
                <ProvenanceTooltip sourceText="Calculado via modelo Liu-Jordan & Erbs para irradiação incidental (POA) no plano inclinado em Vitória-ES." />
              </span>
              <span className="text-[#ea580c] font-extrabold font-mono text-base">{transFactor}x</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-[#ea580c] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Gerar Previsão de Geração Futura &rarr;
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-start">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl border border-slate-300 transition cursor-pointer"
        >
          &larr; Voltar
        </button>
      </div>
    </div>
  );
}
