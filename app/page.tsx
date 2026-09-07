"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GeocodingResult } from "@/lib/geocoding";
import {
  SolarPanel,
  runFutureSolarPrediction,
  FutureSolarPredictionResult,
  runValidationAnalysis,
  ValidationSystemResult,
} from "@/lib/solar-calculator";
import { DEFAULT_AZIMUTH_DEGREES, INSTITUTION_NAME, TCC_TITLE } from "@/lib/constants";
import panelCatalogData from "@/data/panels.json";
import { StepLocation } from "@/components/wizard/StepLocation";
import { StepMap } from "@/components/wizard/StepMap";
import { StepPanel } from "@/components/wizard/StepPanel";
import { StepDiagnosis } from "@/components/wizard/StepDiagnosis";
import { SolarSightLogo } from "@/components/ui/SolarSightLogo";
import { Card3D } from "@/components/ui/Card3D";
import {
  Sun,
  MapPin,
  Layers,
  Grid,
  Activity,
  CheckCircle2,
  Shield,
  GraduationCap,
  Sparkles,
  Award,
  Search,
  Calculator,
  BarChart3,
  BookOpen,
  Filter,
  Cpu,
  Server,
  Database,
  Code2,
  Scale,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import { RidgeDetectionResult } from "@/lib/roof-image-analysis";

export default function UnifiedSolarSightPage() {
  // Top 5-Tab Navigation State
  const [activeTab, setActiveTab] = useState<"tab1" | "tab2" | "tab3" | "tab4" | "tab5">("tab1");

  // Tab 1: Wizard Stepper State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [location, setLocation] = useState<GeocodingResult | null>(null);
  const [roofAreaM2, setRoofAreaM2] = useState<number>(0);
  const [azimuthCandidates, setAzimuthCandidates] = useState<[number, number] | null>(null);
  const [roofRidgeResult, setRoofRidgeResult] = useState<RidgeDetectionResult | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<SolarPanel | null>(null);
  const [installedCapacityKwp, setInstalledCapacityKwp] = useState<number>(0);
  const [estimatedModuleCount, setEstimatedModuleCount] = useState<number>(0);
  const [azimuth, setAzimuth] = useState<number>(DEFAULT_AZIMUTH_DEGREES);
  const [prediction, setPrediction] = useState<FutureSolarPredictionResult | null>(null);

  // Tab 2: Validation State
  const validationResults: ValidationSystemResult[] = runValidationAnalysis();
  const [selectedSystemId, setSelectedSystemId] = useState<string>(validationResults[0]?.id || "");
  const activeSystem = validationResults.find((s) => s.id === selectedSystemId) || validationResults[0];

  // Tab 3: Panel Catalog Filter State
  const [catalogSearch, setCatalogSearch] = useState("");
  const [techFilter, setTechFilter] = useState("all");

  const panels: SolarPanel[] = panelCatalogData as SolarPanel[];
  const filteredPanels = panels.filter((p) => {
    const matchesSearch =
      p.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.model.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesTech = techFilter === "all" || p.cellTech.toLowerCase().includes(techFilter.toLowerCase());
    return matchesSearch && matchesTech;
  });

  // Wizard Step Handlers
  const handleLocationSelect = (loc: GeocodingResult) => {
    setLocation(loc);
    setCurrentStep(2);
  };

  const handleAreaConfirmed = (
    area: number,
    candidates?: [number, number] | null,
    detectionResult?: RidgeDetectionResult | null
  ) => {
    setRoofAreaM2(area);
    if (candidates) setAzimuthCandidates(candidates);
    if (detectionResult) setRoofRidgeResult(detectionResult);
    setCurrentStep(3);
  };

  const handlePanelSelected = (
    panel: SolarPanel,
    capacityKwp: number,
    moduleCount: number,
    _tilt: number,
    chosenAzimuth: number
  ) => {
    setSelectedPanel(panel);
    setInstalledCapacityKwp(capacityKwp);
    setEstimatedModuleCount(moduleCount);
    setAzimuth(chosenAzimuth);

    if (location) {
      const predResult = runFutureSolarPrediction(
        roofAreaM2,
        panel,
        location.lat,
        location.lon,
        chosenAzimuth
      );
      setPrediction(predResult);
      setCurrentStep(4);
    }
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setLocation(null);
    setRoofAreaM2(0);
    setAzimuthCandidates(null);
    setSelectedPanel(null);
    setPrediction(null);
  };

  const stepsHeader = [
    { num: 1, label: "Localização", icon: MapPin },
    { num: 2, label: "Mapeamento", icon: Layers },
    { num: 3, label: "Painel Referência", icon: Grid },
    { num: 4, label: "Previsão Futura", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 selection:bg-[#ea580c] selection:text-white transition-colors duration-300 font-sans">
      {/* 1. CABEÇALHO COM LOGO SOL NASCENTE E BRANDING BRANCO & LARANJA */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-100 border border-orange-200 p-1 flex items-center justify-center shadow-xs">
              <SolarSightLogo className="w-9 h-9 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                  Solar<span className="text-[#ea580c]">Sight</span>
                </h1>
                <span className="text-[10px] font-sans font-bold bg-orange-50 text-[#ea580c] border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-[#ea580c]" /> TCC FAESA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                Plataforma Preditiva para Residências em Vitória - ES • FAESA TCC 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-700 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-xl font-bold text-[#ea580c]">
              <Shield className="w-4 h-4 text-[#ea580c]" />
              <span>Dimensionamento Residencial</span>
            </div>
          </div>
        </div>

        {/* 2. NAVEGAÇÃO PRINCIPAL POR ABAS (UNIFIED 4-TAB NAVIGATION BAR) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-200 pt-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("tab1")}
              className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab1"
                  ? "border-[#ea580c] text-[#ea580c] bg-orange-50/60 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Aba 1: Pesquisa & Mapeamento</span>
            </button>

            <button
              onClick={() => setActiveTab("tab2")}
              className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab2"
                  ? "border-[#ea580c] text-[#ea580c] bg-orange-50/60 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Aba 2: Validação & Métricas</span>
            </button>

            <button
              onClick={() => setActiveTab("tab3")}
              className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab3"
                  ? "border-[#ea580c] text-[#ea580c] bg-orange-50/60 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Aba 3: Catálogo de Placas</span>
            </button>

            <button
              onClick={() => setActiveTab("tab4")}
              className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab4"
                  ? "border-[#ea580c] text-[#ea580c] bg-orange-50/60 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Aba 4: Arquitetura & APIs</span>
            </button>

            <button
              onClick={() => setActiveTab("tab5")}
              className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab5"
                  ? "border-[#ea580c] text-[#ea580c] bg-orange-50/60 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Aba 5: Resumo do Projeto (README)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO DAS ABAS NO HOST ÚNICO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* ================= ABA 1: PESQUISA & MAPEAMENTO (SIMULADOR 4 PASSOS) ================= */}
        {activeTab === "tab1" && (
          <div className="space-y-6 animate-step-transition">
            {/* Banner de Apresentação do Simulador */}
            {currentStep === 1 && (
              <div className="text-center space-y-3 mb-8 max-w-3xl mx-auto pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>METODOLOGIA ERBS + LIU-JORDAN & NASA POWER GHI</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Qualifique o Potencial Solar Residencial em Vitória - ES
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Desenhe o telhado sobre a imagem de satélite, receba a sugestão geométrica assistida de azimute via Turf.js e obtenha a previsão preditiva imediata pelo modelo de transposição Erbs + Liu-Jordan.
                </p>
              </div>
            )}

            {/* Barra de Progresso do Wizard em 4 Passos dentro da Aba 1 */}
            <div className="max-w-3xl mx-auto px-4 py-3 bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-[#ea580c] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />

                {stepsHeader.map((step) => {
                  const Icon = step.icon;
                  const isDone = currentStep > step.num;
                  const isCurrent = currentStep === step.num;

                  return (
                    <div key={step.num} className="relative z-10 flex flex-col items-center">
                      <button
                        onClick={() => {
                          if (isDone) setCurrentStep(step.num);
                        }}
                        disabled={!isDone}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition font-bold text-xs ${
                          isDone
                            ? "bg-orange-100 text-[#ea580c] border-2 border-[#ea580c] cursor-pointer"
                            : isCurrent
                            ? "bg-[#ea580c] text-white border-2 border-orange-300 shadow-md shadow-orange-500/20 scale-110"
                            : "bg-white text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-[#ea580c]" /> : <Icon className="w-3.5 h-3.5" />}
                      </button>
                      <span
                        className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                          isCurrent
                            ? "text-[#ea580c] font-bold"
                            : isDone
                            ? "text-slate-700 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo do Passo Atual do Wizard */}
            <div key={currentStep} className="animate-step-transition">
              {currentStep === 1 && (
                <StepLocation onLocationSelect={handleLocationSelect} currentLocation={location} />
              )}

              {currentStep === 2 && location && (
                <StepMap
                  location={location}
                  initialAreaM2={roofAreaM2}
                  onAreaConfirmed={handleAreaConfirmed}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 3 && location && (
                <StepPanel
                  roofAreaM2={roofAreaM2}
                  latitude={location.lat}
                  selectedPanel={selectedPanel}
                  initialAzimuth={azimuth}
                  suggestedAzimuthCandidates={azimuthCandidates}
                  onPanelSelected={handlePanelSelected}
                  onBack={() => setCurrentStep(2)}
                />
              )}

              {currentStep === 4 && prediction && location && selectedPanel && (
                <StepDiagnosis
                  prediction={prediction}
                  location={location}
                  roofAreaM2={roofAreaM2}
                  panel={selectedPanel}
                  onRestart={handleRestart}
                />
              )}
            </div>
          </div>
        )}

        {/* ================= ABA 2: VALIDAÇÃO & MÉTRICAS (TCC FAESA) ================= */}
        {activeTab === "tab2" && (
          <div className="space-y-8 animate-step-transition">
            {/* Banner do Módulo de Validação */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-sm space-y-3">
              <span className="text-xs font-bold font-sans px-3 py-1 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 uppercase tracking-wider">
                MÓDULO DE EVIDÊNCIA CIENTÍFICA (TCC FAESA & MODELO ERBS + LIU-JORDAN)
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <Award className="w-7 h-7 text-[#ea580c]" />
                Validação Experimental do Modelo contra Usinas Reais no ES
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Para demonstrar a precisão e viabilidade científica do <strong>SolarSight</strong> sem exigir upload de dados do usuário final, o modelo preditivo foi executado sobre coordenadas e especificações de usinas fotovoltaicas reais de referência no Espírito Santo.
              </p>
            </div>

            {/* 1. SEÇÃO DE VALIDAÇÃO ESTATÍSTICA (MAPE & RMSE) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#ea580c]" />
                  1. Métricas Estatísticas de Erro Preditivo (MAPE & RMSE)
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold">Sistema de Referência:</span>
                  <select
                    value={selectedSystemId}
                    onChange={(e) => setSelectedSystemId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#ea580c]"
                  >
                    {validationResults.map((sys) => (
                      <option key={sys.id} value={sys.id}>
                        {sys.name} ({sys.installedCapacityKwp} kWp)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cards de Métricas MAPE / RMSE */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card3D className="bg-white p-4 border border-orange-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">
                    Erro Percentual Médio (MAPE)
                  </span>
                  <div className="text-3xl font-extrabold text-[#ea580c]">
                    {activeSystem.mapePercent}%
                  </div>
                  <span className="text-[10px] text-slate-500 block">Excelente precisão (&lt; 10% erro)</span>
                </Card3D>

                <Card3D className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">
                    Erro Quadrático Médio (RMSE)
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900">
                    {activeSystem.rmseKwh} <span className="text-xs text-slate-500">kWh</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Desvio absoluto mensal</span>
                </Card3D>

                <Card3D className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">
                    Geração Real Medida (Ano)
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {activeSystem.measuredAnnualKwh.toLocaleString("pt-BR")} <span className="text-xs text-slate-500">kWh</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Dados reais registrados</span>
                </Card3D>

                <Card3D className="bg-white p-4 border border-orange-200 rounded-2xl shadow-xs space-y-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">
                    Geração Simulada SolarSight
                  </span>
                  <div className="text-2xl font-extrabold text-[#ea580c]">
                    {activeSystem.simulatedAnnualKwh.toLocaleString("pt-BR")} <span className="text-xs text-slate-500">kWh</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Saída do modelo Preditivo</span>
                </Card3D>
              </div>

              {/* Gráfico Comparativo Mensal Medido vs Simulado */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ea580c]" />
                  Comparativo Mês a Mês: Geração Real Medida vs. Simulação SolarSight ({activeSystem.name})
                </h4>

                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={activeSystem.monthlyComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="monthName" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} unit=" kWh" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "12px", color: "#0f172a", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                        formatter={(val: any) => [`${Number(val).toLocaleString("pt-BR")} kWh`]}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      <Bar dataKey="measuredKwh" name="Geração Real Medida (kWh)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="simulatedKwh" name="Previsão SolarSight (kWh)" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 2. MATRIZ COMPARATIVA DE FERRAMENTAS */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#ea580c]" />
                2. Matriz Comparativa com Ferramentas Existentes (Diferencial TCC)
              </h3>

              <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Critério de Avaliação</th>
                      <th className="p-4 text-slate-500">SunData (CRESESB/CEPEL)</th>
                      <th className="p-4 text-slate-500">PVGIS (União Europeia)</th>
                      <th className="p-4 text-[#ea580c] font-bold bg-orange-50">SolarSight (FAESA TCC & Erbs / Liu-Jordan)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="p-4 font-bold text-slate-900">Precisão do Telhado</td>
                      <td className="p-4 text-slate-500">Não possui (Apenas ponto geográfico)</td>
                      <td className="p-4 text-slate-500">Não possui (Apenas coordenadas)</td>
                      <td className="p-4 text-[#ea580c] font-bold bg-orange-50/50">
                        Polígono Vetorial Real + Modelo Erbs / Liu-Jordan (Céu Isotrópico)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-900">Jornada de Autoatendimento</td>
                      <td className="p-4 text-slate-500">Entrega dado bruto de irradiação para técnicos</td>
                      <td className="p-4 text-slate-500">Requer conhecimento técnico de fotovoltaica</td>
                      <td className="p-4 text-[#ea580c] font-bold bg-orange-50/50">
                        Autoatendimento ponta a ponta sem intermediários
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-900">Dimensionamento do Gerador</td>
                      <td className="p-4 text-slate-500">Ausente</td>
                      <td className="p-4 text-slate-500">Simplificado (potência manual)</td>
                      <td className="p-4 text-[#ea580c] font-bold bg-orange-50/50">
                        Catálogo Nacional de Painéis Pré-Definidos (Wp, Eficiência)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-slate-900">Modelo Financeiro 25 Anos</td>
                      <td className="p-4 text-slate-500">Ausente</td>
                      <td className="p-4 text-slate-500">Sem suporte a normas brasileiras</td>
                      <td className="p-4 text-[#ea580c] font-bold bg-orange-50/50">
                        Marco Legal da GD (Lei 14.300/2022 + Fio B EDP-ES)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA 3: CATÁLOGO DE PLACAS ================= */}
        {activeTab === "tab3" && (
          <div className="space-y-8 animate-step-transition">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ea580c]">
                <Grid className="w-4 h-4" /> CATÁLOGO TÉCNICO DE MÓDULOS FOTOVOLTAICOS
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Módulos Fotovoltaicos Pré-Definidos no Sistema
              </h2>
              <p className="text-sm text-slate-600">
                Explore as especificações técnicas de painéis Tier-1 com tecnologia Monocristalina N-Type e PERC.
              </p>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Buscar modelo ou fabricante..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 pl-9 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Filter className="w-4 h-4 text-[#ea580c]" /> Tecnologia:
                </span>
                <select
                  value={techFilter}
                  onChange={(e) => setTechFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#ea580c]"
                >
                  <option value="all">Todas as Tecnologias</option>
                  <option value="mono">Monocristalino N-Type</option>
                  <option value="bifacial">Bifacial / PERC</option>
                </select>
              </div>
            </div>

            {/* Grid Interativo de Placas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPanels.map((panel) => (
                <Card3D key={panel.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#ea580c] px-2.5 py-0.5 rounded-full border border-orange-200">
                        {panel.brand}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{panel.model}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
                      <Sun className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-600">Potência Nominal:</span>
                      <span className="font-bold font-mono text-[#ea580c]">{panel.powerWp} Wp</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-600">Eficiência de Fábrica:</span>
                      <span className="font-bold font-mono text-[#ea580c]">{(panel.efficiency * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-600">Área Útil:</span>
                      <span className="font-bold text-slate-900">{panel.areaM2} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Coef. Temperatura:</span>
                      <span className="font-semibold text-slate-700">-0,34%/°C</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                    <span className="font-bold text-slate-900 block">Recomendação de Uso:</span>
                    {panel.cellTech} — Telhados residenciais e comerciais de alta densidade.
                  </div>
                </Card3D>
              ))}
            </div>
          </div>
        )}

        {/* ================= ABA 4: ARQUITETURA, APIS & BIBLIOTECAS ================= */}
        {activeTab === "tab4" && (
          <div className="space-y-8 animate-step-transition">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ea580c]">
                <Cpu className="w-4 h-4" /> ARQUITETURA TÉCNICA E INTEGRAÇÕES
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Ecossistema de APIs, Bibliotecas & Motor Preditivo
              </h2>
              <p className="text-sm text-slate-600">
                Documentação visual das camadas de dados, geoprocessamento, modelo de transposição Erbs + Liu-Jordan e bibliotecas matemáticas do SolarSight.
              </p>
            </div>

            {/* Diagrama de Arquitetura em Cards Categorizados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Camada de APIs de Dados */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <Database className="w-5 h-5 text-[#ea580c]" /> 1. APIs de Dados & Clima
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">Modelo Erbs + Liu-Jordan (Céu Isotrópico)</span>
                    <p className="text-slate-600 mt-0.5">Modelo matemático público de radiação incidental (POA) e transposição fotovoltaica.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">NASA POWER Climatology API</span>
                    <p className="text-slate-600 mt-0.5">Radiação solar global horizontal (GHI) multi-anual.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">Esri World Imagery Tiles</span>
                    <p className="text-slate-600 mt-0.5">Camada de satélite de alta resolução sem token pago.</p>
                  </div>
                </div>
              </div>

              {/* Camada de Bibliotecas de Cálculo */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <Code2 className="w-5 h-5 text-[#ea580c]" /> 2. Bibliotecas & Geodésia
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">Turf.js (@turf/area & @turf/bearing)</span>
                    <p className="text-slate-600 mt-0.5">Cálculo de área WGS84 e rumo assistido de aresta de telhado.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">Leaflet + Leaflet Draw</span>
                    <p className="text-slate-600 mt-0.5">Interface gráfica vetorial para desenho no mapa.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">Recharts Visualizations</span>
                    <p className="text-slate-600 mt-0.5">Renderização dos gráficos de curva solar e sazonalidade.</p>
                  </div>
                </div>
              </div>

              {/* Camada Frontend & UI */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <Server className="w-5 h-5 text-[#ea580c]" /> 3. Framework & Estilização
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">Next.js App Router (React 19)</span>
                    <p className="text-slate-600 mt-0.5">Arquitetura moderna com suporte a SSR e rotas estáticas.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#ea580c] block">Tailwind CSS & Google Fonts Outfit</span>
                    <p className="text-slate-600 mt-0.5">Design system limpo com tipografia arredondada.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Endpoints e Status de Integração */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#ea580c]" /> Tabela de Endpoints e Status de Integração
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Endpoint / Serviço</th>
                      <th className="p-3.5">Finalidade Técnica</th>
                      <th className="p-3.5">Status de Integração</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="p-3.5 font-mono text-[#ea580c] font-semibold">Modelo Erbs + Liu-Jordan (Client-Side)</td>
                      <td className="p-3.5">Modelo matemático de radiação incidental no plano (POA) e decomposição difusa Erbs</td>
                      <td className="p-3.5"><span className="bg-orange-50 text-[#ea580c] border border-orange-200 font-bold px-2.5 py-0.5 rounded-full">Integrado (Modelo Direto)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono text-[#ea580c] font-semibold">https://power.larc.nasa.gov/api</td>
                      <td className="p-3.5">Obtenção de dados climáticos e irradiação solar (GHI)</td>
                      <td className="p-3.5"><span className="bg-orange-50 text-[#ea580c] border border-orange-200 font-bold px-2.5 py-0.5 rounded-full">Integrado (Ativo)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono text-[#ea580c] font-semibold">https://viacep.com.br/ws/{`{cep}`}/json</td>
                      <td className="p-3.5">Geocodificação de endereços e CEP no Espírito Santo</td>
                      <td className="p-3.5"><span className="bg-orange-50 text-[#ea580c] border border-orange-200 font-bold px-2.5 py-0.5 rounded-full">Integrado (Ativo)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA 5: RESUMO DO PROJETO (README GITHUB STYLE) ================= */}
        {activeTab === "tab5" && (
          <div className="space-y-6 animate-step-transition max-w-5xl mx-auto font-sans">
            {/* Documentação Markdown Estilo GitHub README */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-slate-800 leading-relaxed text-sm">
              {/* Título Principal */}
              <div className="border-b border-slate-200 pb-6 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-orange-50 text-[#ea580c] border border-orange-200 text-xs px-2.5 py-1 rounded-md font-bold">TCC FAESA 2026</span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-1 rounded-md font-mono">Next.js 16 + React 19</span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-1 rounded-md font-mono">Erbs + Liu-Jordan Model</span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-1 rounded-md font-mono">Vitória / ES</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  ☀️ SolarSight — Plataforma Preditiva de Geração Fotovoltaica Residencial
                </h1>
                <p className="text-slate-600 text-base">
                  Ferramenta preditiva desenvolvida para dimensionamento fotovoltaico e previsão de geração solar em telhados residenciais de <strong>Vitória - ES</strong>, sem exigir upload de arquivos CSV de inversores.
                </p>
              </div>

              {/* Seção 1: Como Funciona */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ea580c]" /> 1. Como Funciona o Sistema (Wizard em 4 Passos)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-[#ea580c]">Passo 1: Geocodificação WGS84</span>
                    <p className="text-xs text-slate-600">Tradução instantânea de CEP ou endereço em latitude e longitude para a região de Vitória - ES (Lat ~20.31°S).</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-[#ea580c]">Passo 2: Vetorização Satélite Turf.js</span>
                    <p className="text-xs text-slate-600">Desenho da cobertura em imagem Esri World Imagery com cálculo da área em m² e sugestão geométrica assistida de azimute (Face A / Face B).</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-[#ea580c]">Passo 3: Geometria & Liu-Jordan</span>
                    <p className="text-xs text-slate-600">Inclinação latitudinal automática (Tilt = 20.3°), fator de transposição incidental (K_trans) e seleção no catálogo de placas Tier-1.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-[#ea580c]">Passo 4: Diagnóstico 25 Anos & Lei 14.300</span>
                    <p className="text-xs text-slate-600">Previsão sazonal mensal (Erbs + Liu-Jordan + NASA POWER), projeção de 25 anos com degradação (0,5%/ano) e regra tarifária do Fio B EDP ES.</p>
                  </div>
                </div>
              </div>

              {/* Seção 2: Módulo de Validação */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#ea580c]" /> 2. Módulo de Validação Empírica (Evidência Científica)
                </h3>
                <p className="text-slate-600 text-xs">
                  O modelo foi executado e validado estatisticamente contra dados de geração real monitorados em usinas fotovoltaicas de referência no Espírito Santo:
                </p>
                <div className="overflow-x-auto bg-slate-50 rounded-xl border border-slate-200 p-2">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="border-b border-slate-200 font-bold text-slate-900 uppercase">
                      <tr>
                        <th className="p-3">Usina de Referência</th>
                        <th className="p-3">Capacidade</th>
                        <th className="p-3">Geração Real (Ano)</th>
                        <th className="p-3">Previsão SolarSight</th>
                        <th className="p-3 text-[#ea580c]">MAPE (Erro %)</th>
                        <th className="p-3">RMSE (kWh)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Usina FAESA (Vitória/ES)</td>
                        <td className="p-3">15.4 kWp</td>
                        <td className="p-3">21.710 kWh</td>
                        <td className="p-3 font-mono">22.485,1 kWh</td>
                        <td className="p-3 font-bold text-[#ea580c]">4,45%</td>
                        <td className="p-3 font-mono">84,3 kWh</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Usina GD Comercial (Serra/ES)</td>
                        <td className="p-3">52.2 kWp</td>
                        <td className="p-3">73.660 kWh</td>
                        <td className="p-3 font-mono">76.142,5 kWh</td>
                        <td className="p-3 font-bold text-[#ea580c]">4,37%</td>
                        <td className="p-3 font-mono">281,7 kWh</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seção 3: Equações e Modelos */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#ea580c]" /> 3. Formulação Matemática Aplicada
                </h3>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2 overflow-x-auto">
                  <p className="text-orange-400 font-bold">// 1. Inclinação Latitudinal Automática (Tilt)</p>
                  <p className="text-emerald-300">Tilt = |Latitude_Geográfica| ≈ 20.31°S</p>
                  <p className="text-orange-400 font-bold mt-2">// 2. Irradiância no Plano Inclinado (POA Factor - Liu-Jordan & Erbs)</p>
                  <p className="text-emerald-300">POA = Direct * Rb + Diffuse * ((1 + cos(Tilt))/2) + Albedo * GHI * ((1 - cos(Tilt))/2)</p>
                  <p className="text-orange-400 font-bold mt-2">// 3. Performance Ratio Global (PR = 80.0%)</p>
                  <p className="text-emerald-300">PR = 100% - 14.0% (Térmica/Módulo) - 3.5% (Sujeira/Maresia) - 2.5% (Cabos/CC-CA) = 80.0%</p>
                </div>
              </div>

              {/* Seção 4: Stack & Instalação */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#ea580c]" /> 4. Execução Local & Build de Produção
                </h3>
                <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1.5">
                  <p className="text-slate-400"># Clonar e instalar dependências</p>
                  <p className="text-white">npm install</p>
                  <p className="text-slate-400 mt-2"># Iniciar servidor de desenvolvimento local</p>
                  <p className="text-white">npm run dev</p>
                  <p className="text-slate-400 mt-2"># Compilar pacote otimizado para Vercel</p>
                  <p className="text-white">npm run build</p>
                </div>
              </div>

              {/* Seção 5: Créditos FAESA */}
              <div className="bg-orange-50/70 p-5 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-[#ea580c] block text-sm">FAESA — Centro Universitário</span>
                  <p className="text-slate-700 mt-0.5">Trabalho de Conclusão de Curso em Engenharia da Computação (2026)</p>
                </div>
                <div className="text-slate-600 font-semibold text-right">
                  <p>Autor: Felipe</p>
                  <p>Vitória - Espírito Santo, Brasil</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RODAPÉ TÉCNICO FAESA */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          SolarSight &copy; 2026 — Plataforma Preditiva de Geração Fotovoltaica
        </p>
        <p className="text-slate-500 text-[11px] mt-1">
          Trabalho de Conclusão de Curso (TCC) em Engenharia da Computação — {INSTITUTION_NAME}
        </p>
      </footer>
    </div>
  );
}
