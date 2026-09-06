"use client";

import React, { useState } from "react";
import Link from "next/link";
import { runValidationAnalysis, ValidationSystemResult } from "@/lib/solar-calculator";
import { INSTITUTION_NAME, TCC_TITLE } from "@/lib/constants";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card3D } from "@/components/ui/Card3D";
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
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  Calculator,
  Scale,
  BookOpen,
} from "lucide-react";

export default function ValidacaoPage() {
  const validationResults: ValidationSystemResult[] = runValidationAnalysis();
  const [selectedSystemId, setSelectedSystemId] = useState<string>(validationResults[0]?.id || "");

  const activeSystem = validationResults.find((s) => s.id === selectedSystemId) || validationResults[0];

  return (
    <div className="min-h-screen bg-[#080c14] dark:bg-[#080c14] light:bg-[#f8fafc] text-slate-100 dark:text-slate-100 light:text-slate-900 selection:bg-cyan-500 selection:text-white flex flex-col justify-between transition-colors duration-300">
      {/* Header Superior FAESA */}
      <header className="border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-300/80 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" /> Voltar ao Simulador
            </Link>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-2 font-mono">
                Solar<span className="text-cyan-400">Sight</span> — Metodologia & Validação
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                Evidências Estatísticas e Rigor Científico do Modelo Preditivo ({INSTITUTION_NAME})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-sans font-bold bg-amber-950 text-amber-300 border border-amber-800/60 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> TCC FAESA
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal de Validação */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Banner do Módulo de Validação */}
        <div className="glass-card bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 rounded-3xl p-6 sm:p-8 border border-cyan-500/30 glow-cyan">
          <div className="space-y-3">
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
              MÓDULO DE EVIDÊNCIA CIENTÍFICA (TCC)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white dark:text-white light:text-slate-900 flex items-center gap-3">
              <Award className="w-7 h-7 text-amber-400" />
              Validação Experimental do Modelo contra Usinas Reais no ES
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 max-w-3xl leading-relaxed">
              Para demonstrar a precisão e viabilidade científica do <strong>SolarSight</strong> sem exigir upload de dados do usuário final, o modelo preditivo foi executado sobre coordenadas e especificações de usinas fotovoltaicas reais de referência no Espírito Santo (dados públicos ANEEL / registros de inversores).
            </p>
          </div>
        </div>

        {/* 1. SEÇÃO DE VALIDAÇÃO ESTATÍSTICA (MAPE & RMSE) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              1. Métricas Estatísticas de Erro Preditivo (MAPE & RMSE)
            </h3>

            {/* Seletor de Sistema de Referência */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Sistema de Referência:</span>
              <select
                value={selectedSystemId}
                onChange={(e) => setSelectedSystemId(e.target.value)}
                className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-white dark:text-white light:text-slate-900 font-medium text-xs focus:outline-none focus:border-cyan-500"
              >
                {validationResults.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name} ({sys.installedCapacityKwp} kWp)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards de Métricas MAPE / RMSE com Efeito 3D Perspective Tilt */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card3D className="glass-card p-4 border border-emerald-500/40 glow-emerald space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                Erro Percentual Médio (MAPE)
              </span>
              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                {activeSystem.mapePercent}%
              </div>
              <span className="text-[10px] text-slate-400 block">Excelente precisão (&lt; 6% erro)</span>
            </Card3D>

            <Card3D className="glass-card p-4 border border-cyan-500/40 space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                Erro Quadrático Médio (RMSE)
              </span>
              <div className="text-3xl font-extrabold font-mono text-cyan-400">
                {activeSystem.rmseKwh} <span className="text-xs text-slate-400">kWh</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Desvio absoluto por mês</span>
            </Card3D>

            <Card3D className="glass-card p-4 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                Geração Real Medida (Ano)
              </span>
              <div className="text-2xl font-bold font-mono text-white dark:text-white light:text-slate-900">
                {activeSystem.measuredAnnualKwh.toLocaleString("pt-BR")} <span className="text-xs text-slate-400">kWh</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Dados reais registrados</span>
            </Card3D>

            <Card3D className="glass-card p-4 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                Geração Simulada SolarSight
              </span>
              <div className="text-2xl font-bold font-mono text-cyan-300">
                {activeSystem.simulatedAnnualKwh.toLocaleString("pt-BR")} <span className="text-xs text-slate-400">kWh</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Saída do modelo Preativo</span>
            </Card3D>
          </div>

          {/* Gráfico Comparativo Mensal Medido vs Simulado */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Comparativo Mês a Mês: Geração Real Medida vs. Simulação SolarSight ({activeSystem.name})
            </h4>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activeSystem.monthlyComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="monthName" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} unit=" kWh" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(val: any) => [`${Number(val).toLocaleString("pt-BR")} kWh`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="measuredKwh" name="Geração Real Medida (kWh)" fill="#334155" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="simulatedKwh" name="Previsão SolarSight (kWh)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 2. MATRIZ COMPARATIVA DE FERRAMENTAS (SolarSight vs SunData vs PVGIS) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            2. Matriz Comparativa com Ferramentas Existentes (Diferencial TCC)
          </h3>

          <div className="overflow-x-auto glass-card rounded-3xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Critério de Avaliação</th>
                  <th className="p-4 text-slate-400">SunData (CRESESB/CEPEL)</th>
                  <th className="p-4 text-slate-400">PVGIS (União Europeia)</th>
                  <th className="p-4 text-cyan-400 font-bold bg-cyan-950/40">SolarSight (FAESA TCC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="p-4 font-semibold text-white">Precisão do Telhado</td>
                  <td className="p-4 text-slate-400">Não possui (Apenas ponto geográfico)</td>
                  <td className="p-4 text-slate-400">Não possui (Apenas coordenadas)</td>
                  <td className="p-4 text-emerald-400 font-bold bg-cyan-950/20">
                    Polígono Vetorial Real desenhado pelo usuário ($m^2$)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Jornada de Autoatendimento</td>
                  <td className="p-4 text-slate-400">Entrega dado bruto de irradiação para técnicos</td>
                  <td className="p-4 text-slate-400">Requer conhecimento técnico de fotovoltaica</td>
                  <td className="p-4 text-emerald-400 font-bold bg-cyan-950/20">
                    Autoatendimento ponta a ponta sem intermediários
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Dimensionamento do Gerador</td>
                  <td className="p-4 text-slate-400">Ausente</td>
                  <td className="p-4 text-slate-400">Simplificado (potência manual)</td>
                  <td className="p-4 text-emerald-400 font-bold bg-cyan-950/20">
                    Catálogo Nacional de Painéis Pré-Definidos (Wp, Eficiência)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Modelo Financeiro 25 Anos</td>
                  <td className="p-4 text-slate-400">Ausente</td>
                  <td className="p-4 text-slate-400">Sem suporte a normas brasileiras</td>
                  <td className="p-4 text-emerald-400 font-bold bg-cyan-950/20">
                    Marco Legal da GD (Lei 14.300/2022 + Fio B EDP-ES)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. MARCO LEGAL DA GD (LEI 14.300/2022) & GEOMETRIA LIU-JORDAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box Lei 14.300/2022 */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Modelagem do Marco Legal da GD (Lei 14.300/2022)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O SolarSight modela o cronograma progressivo de transição da parcela **Fio B** incidente sobre a energia compensada para geradores conectados a partir de 2023:
            </p>

            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">2023</span>
                <span className="text-amber-400 font-bold">15%</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">2024</span>
                <span className="text-amber-400 font-bold">30%</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">2025</span>
                <span className="text-amber-400 font-bold">45%</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">2026</span>
                <span className="text-amber-400 font-bold">60%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              *Calibrado para a concessionária EDP Espírito Santo (Tarifa R$ 0,85/kWh com ~28% componente Fio B).
            </p>
          </div>

          {/* Box Geometria Liu-Jordan & Erbs */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Modelo Rigoroso de Transposição Solar (Liu-Jordan & Erbs)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O motor de cálculo realiza a decomposição da irradiação Global Horizontal ($GHI$) em componente Direta ($DNI$) e Difusa ($DHI$) via correlação de Erbs, aplicando o modelo isotrópico de Liu-Jordan:
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300">
              POA = DNI · cos(θ) + DHI · ((1 + cos(β))/2) + GHI · ρg · ((1 - cos(β))/2)
            </div>

            <p className="text-[11px] text-slate-500">
              Garante acurácia teórica no cálculo da irradiação incidental no plano inclinado do gerador ($POA$).
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé FAESA */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-400">
          SolarSight &copy; 2026 — Metodologia e Validação de TCC
        </p>
        <p className="text-slate-600 text-[11px]">
          Engenharia da Computação — {INSTITUTION_NAME}
        </p>
      </footer>
    </div>
  );
}
