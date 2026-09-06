"use client";

import React, { useState } from "react";
import { FutureSolarPredictionResult, SolarPanel } from "@/lib/solar-calculator";
import { GeocodingResult } from "@/lib/geocoding";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { ProvenanceTooltip } from "@/components/ui/ProvenanceTooltip";
import { Card3D } from "@/components/ui/Card3D";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  Info,
  SunMedium,
  Zap,
  TrendingDown,
  Layers,
  Sparkles,
  RotateCcw,
  Calendar,
  DollarSign,
  Compass,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { INSTITUTION_NAME } from "@/lib/constants";

interface StepDiagnosisProps {
  prediction: FutureSolarPredictionResult;
  location: GeocodingResult;
  roofAreaM2: number;
  panel: SolarPanel;
  onRestart: () => void;
}

export function StepDiagnosis({
  prediction,
  location,
  roofAreaM2,
  panel,
  onRestart,
}: StepDiagnosisProps) {
  const [activeTab, setActiveTab] = useState<"forecast12" | "projections25" | "simulation" | "tcc">("forecast12");

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 print:p-0 font-sans">
      {/* Banner Principal de Previsão Futura Estilo PVWatts NREL Executive Summary */}
      <div className="bg-gradient-to-r from-orange-500 via-[#ea580c] to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 z-10 relative">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-sans px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                QUALIFICAÇÃO PREDITIVA CONCLUÍDA
              </span>
              <span className="text-xs text-orange-100 font-sans flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-200" /> Tilt {prediction.calculatedTiltDegrees}° / Azimute {prediction.azimuthDegrees}°
                <ProvenanceTooltip sourceText="Inclinação calculada pela latitude geográfica local e azimute assistido via Turf.js no modelo PVWatts (NREL)." />
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-200" />
              Previsão de Geração Solar Preditiva (PVWatts / NREL)
            </h2>

            <p className="text-xs sm:text-sm text-orange-50 leading-relaxed">
              Estimativa preditiva de produção de energia futura calculada com base na irradiação solar incidental (POA) pelo modelo Liu-Jordan & Erbs + PVWatts (NREL / Sandia / Perez Model), inclinada dinamicamente conforme a latitude e escalonada pela placa solar ({panel.brand} {panel.powerWp}Wp).
            </p>

            <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/20 text-xs text-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-200 uppercase tracking-wider">
                  Resumo da Estimativa Preditiva:
                </span>
                <ProvenanceTooltip sourceText="Calculado via irradiação no plano (POA), modelo PVWatts (NREL), eficiência nominal do painel e PR fixo de 80% (incluindo 3,5% de sujeira/maresia)." />
              </div>
              <p>
                O gerador fotovoltaico de <strong>{prediction.installedCapacityKwp} kWp</strong> ({prediction.estimatedModuleCount} placas) prevê produzir <strong><AnimatedNumber value={prediction.firstYearGenerationKwh} decimals={0} suffix=" kWh" /></strong> no 1º ano de operação na região de {location.city}/{location.state}.
              </p>
            </div>
          </div>

          {/* KPI Card Rápido de Previsão Anual e 25 Anos */}
          <Card3D className="bg-white p-5 rounded-2xl border border-orange-200 text-slate-900 shrink-0 w-full sm:w-72 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                Geração Preditiva (1º Ano)
              </span>
              <ProvenanceTooltip sourceText="Fonte: NASA POWER & Modelo PVWatts (NREL / Sandia / Perez Model)" />
            </div>

            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={prediction.firstYearGenerationKwh}
                decimals={0}
                suffix=" kWh/ano"
                className="text-3xl font-extrabold text-[#ea580c]"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1.5">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  Economia no 1º Ano:
                  <ProvenanceTooltip sourceText="Modelado conforme a Lei 14.300/2022 (Fio B EDP-ES)" />
                </span>
                <AnimatedNumber
                  value={prediction.firstYearSavingsBrl}
                  decimals={2}
                  prefix="R$ "
                  className="text-[#ea580c] font-bold"
                />
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  Acumulado 25 Anos:
                  <ProvenanceTooltip sourceText="Projeção com taxa de degradação anual de fábrica de 0.5%/ano" />
                </span>
                <AnimatedNumber
                  value={Math.round(prediction.twentyFiveYearGenerationKwh / 1000)}
                  decimals={0}
                  suffix=" MWh"
                  className="text-[#ea580c] font-bold"
                />
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Payback Estimado:</span>
                <span className="text-amber-400 font-mono font-semibold">
                  ~ {prediction.estimatedPaybackYears} anos
                </span>
              </div>
            </div>
          </Card3D>
        </div>
      </div>

      {/* Grade de KPIs Preditivos com Proveniência */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Potência Arranjo
            </span>
            <ProvenanceTooltip sourceText="Calculado a partir da área do telhado e dimensões da placa solar pré-definida." />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {prediction.installedCapacityKwp} <span className="text-xs text-slate-400">kWp</span>
          </div>
          <span className="text-[10px] text-slate-500 block">{prediction.estimatedModuleCount} × {panel.powerWp}Wp ({panel.brand})</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Área Útil Telhado
            </span>
            <ProvenanceTooltip sourceText="Calculado via vetorização Turf.js sobre imagem de satélite Esri World Imagery." />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {roofAreaM2} <span className="text-xs text-slate-300">m²</span>
          </div>
          <span className="text-[10px] text-slate-500 block">{location.city} / {location.state}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Inclinação Latitudinal
            </span>
            <ProvenanceTooltip sourceText="Calculado dinamicamente pela latitude da coordenada (|latitude|)." />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-300">
            Tilt {prediction.calculatedTiltDegrees}° (|Lat|)
          </div>
          <span className="text-[10px] text-slate-500 block">Fator K_trans = {prediction.transpositionFactor}x</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Economia 25 Anos
            </span>
            <ProvenanceTooltip sourceText="Modelado conforme a Lei 14.300/2022 (Fio B EDP-ES)." />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            <AnimatedNumber value={prediction.twentyFiveYearSavingsBrl / 1000} decimals={0} prefix="R$ " suffix="k" />
          </div>
          <span className="text-[10px] text-slate-500 block">Acumulada com degradação</span>
        </div>
      </div>

      {/* Navegação de Abas dos Gráficos Preditivos */}
      <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("forecast12")}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              activeTab === "forecast12"
                ? "bg-cyan-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Previsão Sazonal (12 Meses Futuros)
          </button>
          <button
            onClick={() => setActiveTab("projections25")}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              activeTab === "projections25"
                ? "bg-cyan-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Projeção Longo Prazo (25 Anos)
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              activeTab === "simulation"
                ? "bg-cyan-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Simulação de Perdas por Sujeira
          </button>
          <button
            onClick={() => setActiveTab("tcc")}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              activeTab === "tcc"
                ? "bg-cyan-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Metodologia Preditiva FAESA
          </button>
        </div>

        <button
          onClick={handlePrintReport}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition text-xs"
        >
          <Download className="w-3.5 h-3.5" /> Exportar Relatório Preditivo FAESA
        </button>
      </div>

      {/* Conteúdo da Aba 1: Previsão Sazonal Futura dos 12 Meses */}
      {activeTab === "forecast12" && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Previsão de Geração Solar Sazonal Futura (12 Meses)
              </h3>
              <p className="text-xs text-slate-400">
                Estimativa mensal de produção em kWh considerando irradiação incidental (POA) com inclinação latitudinal (Tilt = {prediction.calculatedTiltDegrees}°).
              </p>
            </div>
            <ProvenanceTooltip sourceText="Fonte: NASA POWER Climatologia Mensal Histórica Multi-Anual aplicada ao Modelo Liu-Jordan & Erbs." />
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prediction.monthlyForecast} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={10} unit=" kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  formatter={(val: any, name: any) => [
                    name === "idealMonthlyGenKwh" ? `${Number(val).toLocaleString("pt-BR")} kWh` : `R$ ${Number(val).toLocaleString("pt-BR")}`,
                    name === "idealMonthlyGenKwh" ? "Geração Futura Estimada" : "Economia Estimada",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="idealMonthlyGenKwh" name="Geração Mensal Futura (kWh)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorGen)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Projeção de Longo Prazo para 25 Anos com Degradação & Lei 14.300 */}
      {activeTab === "projections25" && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Projeção Futura de Longo Prazo (25 Anos com Degradação & Lei 14.300)
              </h3>
              <p className="text-xs text-slate-400">
                Desempenho energético acumulado ao longo da vida útil garantida do fabricante ({panel.brand}).
              </p>
            </div>
            <ProvenanceTooltip sourceText="Aplica a regra de transição do Fio B da Lei 14.300/2022 (2023-2029) e degradação de fábrica de 0.5%/ano." />
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={prediction.yearlyProjections} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="calendarYear" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit=" kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  formatter={(val: any, name: any) => [
                    `${Number(val).toLocaleString("pt-BR")} kWh`,
                    name === "annualGenerationKwh" ? "Geração Anual" : "Acumulado",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="annualGenerationKwh" name="Geração Anual Futura (kWh)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="cumulativeGenerationKwh" name="Geração Acumulada (kWh)" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Simulação Preditiva de Perdas por Sujeira/Maresia */}
      {activeTab === "simulation" && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                Simulação Preditiva de Perdas por Sujeira & Maresia
              </h3>
              <p className="text-xs text-slate-400">
                Comparação entre a geração futura limpa vs. geração com acúmulo médio estimado de sujidade ({prediction.estimatedSoilingLossPercent}%).
              </p>
            </div>
            <ProvenanceTooltip sourceText="Perda por sujidade/maresia de 3,5% integrada ao Performance Ratio global de 80% conforme normas técnicas para a região litorânea da Grande Vitória/ES." />
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={prediction.monthlyForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="monthName" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit=" kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  formatter={(val: any) => [`${Number(val).toLocaleString("pt-BR")} kWh`]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="idealMonthlyGenKwh" name="Geração Futura Ideal (kWh)" stroke="#06b6d4" strokeWidth={2.5} />
                <Line type="monotone" dataKey="soilingMonthlyGenKwh" name="Geração Futura com Sujeira (~3,5% perda)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Metodologia FAESA */}
      {activeTab === "tcc" && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Parâmetros & Metodologia Preditiva ({INSTITUTION_NAME})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold block flex items-center justify-between">
                Inclinação Latitudinal
                <ProvenanceTooltip sourceText="Calculado dinamicamente pela latitude (|lat|)" />
              </span>
              <p className="text-slate-300 font-mono text-base font-bold">Tilt = |{location.lat.toFixed(2)}°|</p>
              <p className="text-slate-400 leading-relaxed">
                Determinado estritamente a partir da latitude geográfica local para máxima captação anual.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-emerald-400 font-bold block flex items-center justify-between">
                Marco Legal GD (Lei 14.300)
                <ProvenanceTooltip sourceText="Transição tarifária do Fio B EDP-ES" />
              </span>
              <p className="text-slate-300 font-mono text-base font-bold">15% a 100% Fio B</p>
              <p className="text-slate-400 leading-relaxed">
                Regra de transição progressiva de cobrança sobre os créditos compensados (2023 a 2029+).
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-amber-400 font-bold block flex items-center justify-between">
                Modelo de Referência
                <ProvenanceTooltip sourceText="Painel fotovoltaico pré-definido selecionado" />
              </span>
              <p className="text-slate-300 font-mono text-base font-bold">{panel.model}</p>
              <p className="text-slate-400 leading-relaxed">
                {panel.powerWp}Wp com eficiência de {(panel.efficiency * 100).toFixed(1)}% ({panel.cellTech}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé de Ações */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <button
          onClick={onRestart}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Nova Simulação Preditiva
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>{INSTITUTION_NAME} — Simulação Preditiva Futura 100% Stateless</span>
        </div>
      </div>
    </div>
  );
}
