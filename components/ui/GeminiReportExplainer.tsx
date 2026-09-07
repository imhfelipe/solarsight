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
    <div className="bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40 border border-violet-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-500/20 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Camada de Interpretação por IA (Gemini API)
          </div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-400" />
            Explicação em Linguagem Natural do Relatório
            <ProvenanceTooltip
              title="Explicação por Inteligência Artificial"
              source="Gemini API (Google AI Studio - Gemini Flash)"
              formula="Análise interpretativa em linguagem natural baseada exclusivamente nos números determinísticos já calculados. Nenhum valor físico/financeiro é alterado."
            />
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Utilize a inteligência artificial para traduzir os dados técnicos do simulador em linguagem acessível ou tirar dúvidas sobre o seu relatório.
          </p>
        </div>

        {/* Feature B: Explicar em Linguagem Simples Button */}
        <button
          onClick={() => fetchExplanation("summary")}
          disabled={isLoading || sessionCount >= MAX_SESSION_REQUESTS}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer ${
            isLoading
              ? "bg-violet-950 text-violet-400 border border-violet-500/30"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
          }`}
        >
          {isLoading && lastPromptType === "summary" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BookOpenCheck className="w-4 h-4" />
          )}
          <span>Explicar em Linguagem Simples</span>
        </button>
      </div>

      {/* Feature A: Field "Pergunte sobre seu relatório" */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-violet-400" /> Pergunte sobre seu relatório solar:
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (userQuestion.trim()) fetchExplanation("question");
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ex.: Por que a geração cai nos meses do meio do ano? O que é o Fio B?"
            disabled={isLoading || sessionCount >= MAX_SESSION_REQUESTS}
            className="flex-1 bg-slate-950/80 border border-violet-500/30 rounded-xl px-4 py-3 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
          />

          <button
            type="submit"
            disabled={!userQuestion.trim() || isLoading || sessionCount >= MAX_SESSION_REQUESTS}
            className={`px-5 py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              userQuestion.trim() && !isLoading
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-md"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
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

        {/* Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-semibold">Sugestões de perguntas:</span>
          <button
            type="button"
            onClick={() => handleQuickQuestion("Por que a geração varia nos meses do meio do ano?")}
            className="text-[11px] bg-violet-950/60 hover:bg-violet-900/80 text-violet-200 border border-violet-500/30 px-3 py-1 rounded-full transition cursor-pointer"
          >
            Por que a geração varia nos meses?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion("O que é o Fio B e como afeta minha economia?")}
            className="text-[11px] bg-violet-950/60 hover:bg-violet-900/80 text-violet-200 border border-violet-500/30 px-3 py-1 rounded-full transition cursor-pointer"
          >
            O que é a regra do Fio B?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion("O que representa o fator de transposição K_trans?")}
            className="text-[11px] bg-violet-950/60 hover:bg-violet-900/80 text-violet-200 border border-violet-500/30 px-3 py-1 rounded-full transition cursor-pointer"
          >
            O que significa K_trans?
          </button>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {sessionCount < MAX_SESSION_REQUESTS && (
            <button
              onClick={() => fetchExplanation(lastPromptType || "summary")}
              className="text-[11px] text-rose-300 hover:text-white underline font-bold flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Tentar Novamente
            </button>
          )}
        </div>
      )}

      {/* Output Explanation Text Box */}
      {explanationText && !errorMessage && (
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-violet-500/30 space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-violet-500/20 pb-2">
            <div className="flex items-center gap-2 text-violet-300 font-bold text-xs">
              <Bot className="w-4 h-4 text-violet-400" />
              <span>Explicação em Linguagem Natural</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-violet-950/80 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">
              Gemini API (Google AI Studio)
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
            {explanationText}
          </div>

          <div className="pt-2 border-t border-violet-500/10 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              * Esta explicação é uma interpretação em linguagem natural baseada exclusivamente nos dados já calculados do relatório.
            </span>
            <span className="font-mono">
              Cota da sessão: {sessionCount}/{MAX_SESSION_REQUESTS}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
