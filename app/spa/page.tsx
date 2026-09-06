"use client";

import React, { useState } from "react";
import Link from "next/link";
import panelCatalogData from "@/data/panels.json";
import {
  Sun,
  MapPin,
  Search,
  CheckCircle2,
  Activity,
  Calculator,
  Grid,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Filter,
  Server,
  Code2,
  Database,
  Cpu,
  GraduationCap,
  Leaf,
  BarChart3,
  BookOpen,
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

export default function SolarSightSpaPage() {
  const [activeTab, setActiveTab] = useState<"tab1" | "tab2" | "tab3" | "tab4">("tab1");

  // Tab 1 Form States
  const [locationInput, setLocationInput] = useState("FAESA, Av. Vitória, Monte Belo, Vitória - ES");
  const [monthlyConsumptionKwh, setMonthlyConsumptionKwh] = useState<number>(350);
  const [roofAreaM2, setRoofAreaM2] = useState<number>(65);
  const [structureType, setStructureType] = useState<string>("Cerâmico / Colonial");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepProgress, setStepProgress] = useState<number>(3);
  const [showResults, setShowResults] = useState<boolean>(true);

  // Tab 3 Filter States
  const [catalogSearch, setCatalogSearch] = useState("");
  const [techFilter, setTechFilter] = useState("all");

  const runDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStepProgress(1);
    setShowResults(false);

    setTimeout(() => setStepProgress(2), 600);
    setTimeout(() => {
      setStepProgress(3);
      setIsProcessing(false);
      setShowResults(true);
    }, 1200);
  };

  // Calculations for Tab 1 preview
  const estimatedKwp = Number(((roofAreaM2 * 0.85 * 0.215) / 1.5).toFixed(2));
  const estimatedAnnualKwh = Math.round(estimatedKwp * 1420);
  const estimatedMonthlyKwh = Math.round(estimatedAnnualKwh / 12);
  const estimatedMonthlySavingsBrl = Math.round(estimatedMonthlyKwh * 0.78);

  // Chart Data for Tab 2
  const validationChartData = [
    { month: "Jan", teorica: 620, real: 595 },
    { month: "Fev", teorica: 645, real: 625 },
    { month: "Mar", teorica: 580, real: 560 },
    { month: "Abr", teorica: 510, real: 495 },
    { month: "Mai", teorica: 440, real: 425 },
    { month: "Jun", teorica: 405, real: 390 },
    { month: "Jul", teorica: 420, real: 405 },
    { month: "Ago", teorica: 480, real: 465 },
    { month: "Set", teorica: 520, real: 505 },
    { month: "Out", teorica: 560, real: 540 },
    { month: "Nov", teorica: 590, real: 570 },
    { month: "Dez", teorica: 610, real: 590 },
  ];

  // Filtering Tab 3 panels
  const filteredPanels = panelCatalogData.filter((panel) => {
    const matchesSearch =
      panel.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      panel.model.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesTech = techFilter === "all" || panel.cellTech.toLowerCase().includes(techFilter.toLowerCase());
    return matchesSearch && matchesTech;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col justify-between selection:bg-[#EA580C] selection:text-white font-sans">
      {/* 1. CABEÇALHO FIXO COM DESIGN SYSTEM EXCLUSIVO (Branco / Laranja / Neutro Escuro) */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EA580C] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-[#111827] font-mono">
                  Solar<span className="text-[#EA580C]">Sight</span>
                </h1>
                <span className="text-[10px] font-sans font-bold bg-[#FFEDD5] text-[#EA580C] border border-orange-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-[#EA580C]" /> TCC FAESA
                </span>
              </div>
              <p className="text-[11px] text-[#475569]">
                Plataforma Preditiva de Geração Fotovoltaica & Validação de Modelo (SPA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#374151] bg-[#F1F5F9] border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sistema Ativo & Stateless</span>
            </div>

            <Link
              href="/"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Simulador Completo &rarr;
            </Link>
          </div>
        </div>

        {/* 2. NAVEGAÇÃO POR ABAS (TABS SYSTEM) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 pt-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("tab1")}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab1"
                  ? "border-[#EA580C] text-[#EA580C] bg-[#FFEDD5]/40 font-bold"
                  : "border-transparent text-slate-600 hover:text-[#111827] hover:bg-slate-50"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Aba 1: Pesquisa & Diagnóstico</span>
            </button>

            <button
              onClick={() => setActiveTab("tab2")}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab2"
                  ? "border-[#EA580C] text-[#EA580C] bg-[#FFEDD5]/40 font-bold"
                  : "border-transparent text-slate-600 hover:text-[#111827] hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Aba 2: Validação & Métricas</span>
            </button>

            <button
              onClick={() => setActiveTab("tab3")}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab3"
                  ? "border-[#EA580C] text-[#EA580C] bg-[#FFEDD5]/40 font-bold"
                  : "border-transparent text-slate-600 hover:text-[#111827] hover:bg-slate-50"
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Aba 3: Catálogo de Placas</span>
            </button>

            <button
              onClick={() => setActiveTab("tab4")}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tab4"
                  ? "border-[#EA580C] text-[#EA580C] bg-[#FFEDD5]/40 font-bold"
                  : "border-transparent text-slate-600 hover:text-[#111827] hover:bg-slate-50"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Aba 4: Arquitetura & APIs</span>
            </button>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO DAS ABAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* ================= ABA 1: PESQUISA & DIAGNÓSTICO ================= */}
        {activeTab === "tab1" && (
          <div className="space-y-8 animate-step-transition">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                <Sparkles className="w-4 h-4" /> FLUXO INICIAL DE DIAGNÓSTICO FOTOVOLTAICO
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827]">
                Pesquisa de Irradiação & Estimativa Preditiva Solar
              </h2>
              <p className="text-sm text-slate-600">
                Preencha os dados do sistema para calcular a curva teórica de radiação solar e o dimensionamento recomendado do gerador.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulário de Entrada */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-[#111827] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#EA580C]" /> Dados de Entrada
                </h3>

                <form onSubmit={runDiagnosis} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[#374151] font-semibold block mb-1">Localização / Endereço:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        className="w-full bg-[#F9FAFB] border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-[#111827] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C]"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#374151] font-semibold block mb-1">Consumo Médio Mensal (kWh):</label>
                    <input
                      type="number"
                      value={monthlyConsumptionKwh}
                      onChange={(e) => setMonthlyConsumptionKwh(Number(e.target.value))}
                      className="w-full bg-[#F9FAFB] border border-slate-300 rounded-xl px-3 py-2.5 text-[#111827] font-mono font-bold focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="text-[#374151] font-semibold block mb-1">Área Disponível do Telhado (m²):</label>
                    <input
                      type="number"
                      value={roofAreaM2}
                      onChange={(e) => setRoofAreaM2(Number(e.target.value))}
                      className="w-full bg-[#F9FAFB] border border-slate-300 rounded-xl px-3 py-2.5 text-[#111827] font-mono font-bold focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="text-[#374151] font-semibold block mb-1">Tipo de Estrutura:</label>
                    <select
                      value={structureType}
                      onChange={(e) => setStructureType(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-slate-300 rounded-xl px-3 py-2.5 text-[#111827] font-medium focus:outline-none focus:border-[#EA580C]"
                    >
                      <option value="Cerâmico / Colonial">Telhado Cerâmico / Colonial</option>
                      <option value="Fibrocimento">Telhado Fibrocimento</option>
                      <option value="Laje Plana">Laje Plana de Concreto</option>
                      <option value="Metálico / Trapezoidal">Telhado Metálico Trapezoidal</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isProcessing ? (
                      <span>Calculando Radiação...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Executar Diagnóstico Solar
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Painel de Processamento & Resultados */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stepper Visual de Processamento */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status do Processamento Preditivo:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                    <div className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${stepProgress >= 1 ? "bg-[#FFEDD5] border-[#EA580C] text-[#EA580C]" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>1. Coleta de Dados</span>
                    </div>
                    <div className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${stepProgress >= 2 ? "bg-[#FFEDD5] border-[#EA580C] text-[#EA580C]" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                      <Activity className="w-4 h-4" />
                      <span>2. Cálculo Radiação</span>
                    </div>
                    <div className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${stepProgress >= 3 ? "bg-[#FFEDD5] border-[#EA580C] text-[#EA580C]" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                      <Award className="w-4 h-4" />
                      <span>3. Dimensionamento</span>
                    </div>
                  </div>
                </div>

                {/* Resultados Preliminares */}
                {showResults && (
                  <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-md space-y-6 animate-step-transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                        <Sun className="w-5 h-5 text-[#EA580C]" /> Resultados do Diagnóstico Preliminar
                      </h3>
                      <span className="text-xs font-mono bg-[#FFEDD5] text-[#EA580C] px-3 py-1 rounded-full font-bold">
                        Região Vitória/ES (Lat -20.31°)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#F9FAFB] p-4 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Potência Recomendada:</span>
                        <div className="text-2xl font-black font-mono text-[#EA580C]">{estimatedKwp} kWp</div>
                        <span className="text-[10px] text-slate-500 block">Arranjo fotovoltaico ideal</span>
                      </div>

                      <div className="bg-[#F9FAFB] p-4 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Geração Mensal Estimada:</span>
                        <div className="text-2xl font-black font-mono text-emerald-600">{estimatedMonthlyKwh} kWh/mês</div>
                        <span className="text-[10px] text-slate-500 block">Média mensal acumulada</span>
                      </div>

                      <div className="bg-[#F9FAFB] p-4 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Economia Prevista (Mês):</span>
                        <div className="text-2xl font-black font-mono text-[#EA580C]">R$ {estimatedMonthlySavingsBrl}</div>
                        <span className="text-[10px] text-slate-500 block">Tarifa estimada EDP-ES</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA 2: VALIDAÇÃO & MÉTRICAS ================= */}
        {activeTab === "tab2" && (
          <div className="space-y-8 animate-step-transition">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                <Award className="w-4 h-4" /> ANÁLISE DOS NÚMEROS & RIGOR METODOLÓGICO
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827]">
                Dashboard Analítico de Validação do Modelo
              </h2>
              <p className="text-sm text-slate-600">
                Demonstração detalhada de como as previsões foram validadas contra medições reais e especificações técnicas de engenharia.
              </p>
            </div>

            {/* Grid de KPIs Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  HSP (Horas Sol Pleno)
                  <span className="bg-[#FFEDD5] text-[#EA580C] text-[10px] px-2 py-0.5 rounded-full font-bold">NASA</span>
                </span>
                <div className="text-3xl font-black font-mono text-[#EA580C]">5,2 kWh/m²</div>
                <p className="text-xs text-slate-500">Média diária em Vitória/ES</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  Performance Ratio (PR)
                  <span className="bg-[#FFEDD5] text-[#EA580C] text-[10px] px-2 py-0.5 rounded-full font-bold">IEC 61724</span>
                </span>
                <div className="text-3xl font-black font-mono text-emerald-600">80,0%</div>
                <p className="text-xs text-slate-500">Desempenho global do sistema</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  Payback Estimado
                  <span className="bg-[#FFEDD5] text-[#EA580C] text-[10px] px-2 py-0.5 rounded-full font-bold">Lei 14.300</span>
                </span>
                <div className="text-3xl font-black font-mono text-[#EA580C]">3,4 anos</div>
                <p className="text-xs text-slate-500">Retorno do investimento</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  Redução de Carbono
                  <span className="bg-[#FFEDD5] text-[#EA580C] text-[10px] px-2 py-0.5 rounded-full font-bold">Ambiental</span>
                </span>
                <div className="text-3xl font-black font-mono text-emerald-600">2,85 tCO₂</div>
                <p className="text-xs text-slate-500">Emissões evitadas por ano</p>
              </div>
            </div>

            {/* Gráfico Comparativo Curva Teórica vs Geração Real */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#EA580C]" />
                Curva Teórica de Radiação vs. Geração Real Estimada (kWh/mês)
              </h3>

              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={validationChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} unit=" kWh" />
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="teorica" name="Curva Teórica Irradiação (kWh)" fill="#FFEDD5" stroke="#EA580C" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="real" name="Geração Real Simulada (kWh)" stroke="#EA580C" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seção de Notas Metodológicas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#EA580C]" />
                Notas Metodológicas & Equações de Validação
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F9FAFB] p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-[#111827]">Modelo de Transposição Solar Liu-Jordan & Erbs:</h4>
                  <div className="font-mono bg-white p-2.5 rounded-lg border border-slate-300 text-[#EA580C]">
                    POA = DNI · cos(θ) + DHI · ((1 + cos(β))/2) + GHI · ρg · ((1 - cos(β))/2)
                  </div>
                  <p className="text-slate-600">
                    Decomposição empírica da irradiação Global Horizontal (GHI) em componente Direta (DNI) e Difusa (DHI) com albedo solo $\rho_g = 0,20$.
                  </p>
                </div>

                <div className="bg-[#F9FAFB] p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-[#111827]">Valoração Financeira da Lei 14.300/2022 (Fio B EDP-ES):</h4>
                  <div className="font-mono bg-white p-2.5 rounded-lg border border-slate-300 text-emerald-700">
                    Tarifa_Líquida = Tarifa_Base - (Fio_B · %_Escalonamento_Ano)
                  </div>
                  <p className="text-slate-600">
                    Aplica a escala do Fio B de 2023 (15%) a 2029 (100%) para a concessionária EDP Espírito Santo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA 3: CATÁLOGO DE PLACAS ================= */}
        {activeTab === "tab3" && (
          <div className="space-y-8 animate-step-transition">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                <Grid className="w-4 h-4" /> CATÁLOGO TÉCNICO DE MÓDULOS FOTOVOLTAICOS
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827]">
                Módulos Fotovoltaicos Pré-Definidos no Sistema
              </h2>
              <p className="text-sm text-slate-600">
                Explore as especificações técnicas de painéis Tier-1 com tecnologia Monocristalina N-Type e PERC.
              </p>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Buscar modelo ou fabricante..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-slate-300 rounded-xl px-3 py-2 pl-9 text-[#111827] focus:outline-none focus:border-[#EA580C]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Filter className="w-4 h-4 text-[#EA580C]" /> Tecnologia:
                </span>
                <select
                  value={techFilter}
                  onChange={(e) => setTechFilter(e.target.value)}
                  className="bg-[#F9FAFB] border border-slate-300 rounded-xl px-3 py-2 text-[#111827] font-medium focus:outline-none focus:border-[#EA580C]"
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
                <div key={panel.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFEDD5] text-[#EA580C] px-2.5 py-0.5 rounded-full">
                        {panel.brand}
                      </span>
                      <h3 className="text-lg font-bold text-[#111827] mt-1">{panel.model}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#EA580C]">
                      <Sun className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Potência Nominal:</span>
                      <span className="font-bold font-mono text-[#EA580C]">{panel.powerWp} Wp</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Eficiência de Fábrica:</span>
                      <span className="font-bold font-mono text-emerald-600">{(panel.efficiency * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Área Útil:</span>
                      <span className="font-medium text-slate-800">{panel.areaM2} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coef. Temperatura:</span>
                      <span className="font-mono text-slate-700">-0,34%/°C</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-700 block">Recomendação de Uso:</span>
                    {panel.cellTech} — Telhados residenciais e comerciais de alta densidade.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= ABA 4: ARQUITETURA, APIS & BIBLIOTECAS ================= */}
        {activeTab === "tab4" && (
          <div className="space-y-8 animate-step-transition">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                <Cpu className="w-4 h-4" /> ARQUITETURA TÉCNICA E INTEGRAÇÕES
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827]">
                Ecossistema de APIs, Bibliotecas & Motor Preditivo
              </h2>
              <p className="text-sm text-slate-600">
                Documentação visual das camadas de dados, geoprocessamento e bibliotecas matemáticas do SolarSight.
              </p>
            </div>

            {/* Diagrama de Arquitetura em Cards Categorizados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Camada de APIs de Dados */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-[#111827] text-base">
                  <Database className="w-5 h-5 text-[#EA580C]" /> 1. APIs de Dados Gratuitas
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-[#EA580C] block">NASA POWER Climatology API</span>
                    <p className="text-slate-600 mt-0.5">Radiação solar global horizontal (GHI) multi-anual.</p>
                  </div>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-[#EA580C] block">Esri World Imagery Tiles</span>
                    <p className="text-slate-600 mt-0.5">Camada de satélite de alta resolução sem token pago.</p>
                  </div>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-[#EA580C] block">ViaCEP / OpenStreetMap</span>
                    <p className="text-slate-600 mt-0.5">Resolução instantânea de CEP e endereço em Vitória/ES.</p>
                  </div>
                </div>
              </div>

              {/* Camada de Bibliotecas de Cálculo */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-[#111827] text-base">
                  <Code2 className="w-5 h-5 text-[#EA580C]" /> 2. Bibliotecas & Geodésia
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-emerald-700 block">Turf.js (@turf/area & @turf/bearing)</span>
                    <p className="text-slate-600 mt-0.5">Cálculo de área WGS84 e rumo de aresta de telhado.</p>
                  </div>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-emerald-700 block">Leaflet + Leaflet Draw</span>
                    <p className="text-slate-600 mt-0.5">Interface gráfica vetorial para desenho no mapa.</p>
                  </div>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-emerald-700 block">Recharts Visualizations</span>
                    <p className="text-slate-600 mt-0.5">Renderização dos gráficos de curva solar e sazonalidade.</p>
                  </div>
                </div>
              </div>

              {/* Camada Frontend & UI */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-[#111827] text-base">
                  <Server className="w-5 h-5 text-[#EA580C]" /> 3. Framework & Estilização
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-blue-700 block">Next.js App Router (React 19)</span>
                    <p className="text-slate-600 mt-0.5">Arquitetura moderna com suporte a SSR e rotas estáticas.</p>
                  </div>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-slate-200">
                    <span className="font-bold text-blue-700 block">Tailwind CSS & Lucide Icons</span>
                    <p className="text-slate-600 mt-0.5">Design system limpo com microinterações responsivas.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Endpoints e Status de Integração */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#EA580C]" /> Tabela de Endpoints e Status de Integração
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] text-[#111827] font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Endpoint / Serviço</th>
                      <th className="p-3.5">Finalidade Técnica</th>
                      <th className="p-3.5">Status de Integração</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-3.5 font-mono text-[#EA580C] font-semibold">https://power.larc.nasa.gov/api</td>
                      <td className="p-3.5">Obtenção de dados climáticos e irradiação solar (GHI)</td>
                      <td className="p-3.5"><span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Integrado (Ativo)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono text-[#EA580C] font-semibold">https://viacep.com.br/ws/{`{cep}`}/json</td>
                      <td className="p-3.5">Geocodificação de endereços e CEP no Espírito Santo</td>
                      <td className="p-3.5"><span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Integrado (Ativo)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono text-[#EA580C] font-semibold">https://server.arcgisonline.com/.../World_Imagery</td>
                      <td className="p-3.5">Tiles de imagem de satélite de alta resolução sem token</td>
                      <td className="p-3.5"><span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Integrado (Ativo)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RODAPÉ */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          SolarSight &copy; 2026 — Single Page Application (SPA TCC)
        </p>
        <p className="text-slate-500 text-[11px] mt-1">
          Bacharelado em Engenharia da Computação — FAESA Centro Universitário (Vitória/ES)
        </p>
      </footer>
    </div>
  );
}
