"use client";

import React, { useState } from "react";
import { FutureSolarPredictionResult, SolarPanel } from "@/lib/solar-calculator";
import { GeocodingResult } from "@/lib/geocoding";
import { ProvenanceTooltip } from "@/components/ui/ProvenanceTooltip";
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  HelpCircle,
  AlertCircle,
  BookOpenCheck,
  RefreshCw,
} from "lucide-react";

interface GeminiReportExplainerProps {
  prediction: FutureSolarPredictionResult;
  location: GeocodingResult;
  panel: SolarPanel;
  roofAreaM2: number;
}

const MAX_SESSION_REQUESTS = 10;

export function GeminiReportExplainer({
  prediction,
  location,
  panel,
  roofAreaM2,
}: GeminiReportExplainerProps) {
  const [userQuestion, setUserQuestion] = useState("");
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastPromptType, setLastPromptType] = useState<"summary" | "question" | null>(null);

  const fetchExplanation = async (type: "summary" | "question", questionText?: string) => {
    if (sessionCount >= MAX_SESSION_REQUESTS) {
      setErrorMessage(
        "Limite de 10 consultas por sessão atingido para preservar a cota do Gemini API."
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLastPromptType(type);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType: type,
          userQuestion: type === "question" ? questionText || userQuestion : undefined,
          predictionData: {
            ...prediction,
            roofAreaM2,
          },
          locationData: location,
          panelData: panel,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(
          data.error || "Não foi possível gerar a explicação agora — tente novamente em instantes."
        );
      } else if (data.explanation) {
        setExplanationText(data.explanation);
        setSessionCount((prev) => prev + 1);
        if (type === "question") setUserQuestion("");
      }
    } catch {
      setErrorMessage(
        "Não foi possível gerar a explicação agora — tente novamente em instantes."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setUserQuestion(q);
    fetchExplanation("question", q);
  };

  return (
    <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden font-sans text-slate-900">
      {/* Cabeçalho do Card com Alto Contraste */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-700" /> Camada de Interpretação por IA (Gemini API)
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-purple-600 shrink-0" />
            <span>Explicação em Linguagem Natural do Relatório</span>
            <ProvenanceTooltip
              title="Explicação por Inteligência Artificial"
              source="Gemini API (Google AI Studio - Gemini Flash)"
              formula="Análise interpretativa em linguagem natural baseada exclusivamente nos números determinísticos já calculados. Nenhum valor físico/financeiro é alterado."
            />
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium leading-relaxed">
            Utilize a inteligência artificial para traduzir os dados técnicos do simulador em linguagem acessível ou tirar dúvidas sobre o seu relatório.
          </p>
        </div>

        {/* Feature B: Botão Explicar em Linguagem Simples */}
        <button
          onClick={() => fetchExplanation("summary")}
          disabled={isLoading || sessionCount >= MAX_SESSION_REQUESTS}
          className={`px-5 py-3 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer ${
            isLoading
              ? "bg-purple-200 text-purple-800 border border-purple-300"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          }`}
        >
          {isLoading && lastPromptType === "summary" ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <BookOpenCheck className="w-4 h-4 text-white" />
          )}
          <span>Explicar em Linguagem Simples</span>
        </button>
      </div>

      {/* Feature A: Formulário de Pergunta Livre */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-purple-600" /> Pergunte sobre seu relatório solar:
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (userQuestion.trim()) fetchExplanation("question");
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ex.: Por que a geração varia nos meses? Como funciona a inclinação do meu telhado?"
            disabled={isLoading || sessionCount >= MAX_SESSION_REQUESTS}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-xs sm:text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 shadow-2xs"
          />

          <button
            type="submit"
            disabled={!userQuestion.trim() || isLoading || sessionCount >= MAX_SESSION_REQUESTS}
            className={`px-6 py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              userQuestion.trim() && !isLoading
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                : "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
            }`}
          >
            {isLoading && lastPromptType === "question" ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            <span>Perguntar</span>
          </button>
        </form>

        {/* Pílulas de Sugestões de Perguntas Frequentes */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-800 font-extrabold">Sugestões rápidas:</span>
          <button
            type="button"
            onClick={() => handleQuickQuestion("Como foi calculada a área útil, a inclinação e a direção do meu telhado?")}
            className="text-[11px] bg-purple-100/90 hover:bg-purple-200 text-purple-950 font-bold border border-purple-300 px-3.5 py-1.5 rounded-full transition cursor-pointer shadow-2xs"
          >
            Como é calculada a área, inclinação e direção?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion("Por que a geração de energia varia ao longo dos meses do ano?")}
            className="text-[11px] bg-purple-100/90 hover:bg-purple-200 text-purple-950 font-bold border border-purple-300 px-3.5 py-1.5 rounded-full transition cursor-pointer shadow-2xs"
          >
            Por que a geração varia nos meses?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion("O que é a regra do Fio B da Lei 14.300 e como afeta a economia?")}
            className="text-[11px] bg-purple-100/90 hover:bg-purple-200 text-purple-950 font-bold border border-purple-300 px-3.5 py-1.5 rounded-full transition cursor-pointer shadow-2xs"
          >
            O que é a regra do Fio B?
          </button>
        </div>
      </div>

      {/* Caixa de Erro Não-Bloqueante */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {sessionCount < MAX_SESSION_REQUESTS && (
            <button
              onClick={() => fetchExplanation(lastPromptType || "summary")}
              className="text-[11px] text-rose-700 hover:text-rose-950 underline font-extrabold flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Tentar Novamente
            </button>
          )}
        </div>
      )}

      {/* Caixa de Texto Explicativo Retornado pela Gemini API */}
      {explanationText && !errorMessage && (
        <div className="p-5 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-purple-200 pb-2.5">
            <div className="flex items-center gap-2 text-purple-950 font-extrabold text-xs">
              <Bot className="w-4 h-4 text-purple-700" />
              <span>Explicação em Linguagem Natural</span>
            </div>
            <span className="text-[10px] font-mono text-purple-900 bg-white border border-purple-300 px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
              Gemini API (Google AI Studio)
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-900 font-normal leading-relaxed whitespace-pre-line space-y-2">
            {explanationText}
          </div>

          <div className="pt-2 border-t border-purple-200/80 text-[10px] text-slate-600 flex items-center justify-between font-medium">
            <span>
              * Esta explicação é uma interpretação em linguagem natural baseada exclusivamente nos dados já calculados do relatório.
            </span>
            <span className="font-mono font-bold text-purple-900">
              Cota da sessão: {sessionCount}/{MAX_SESSION_REQUESTS}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
