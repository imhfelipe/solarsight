"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

interface ProvenanceTooltipProps {
  title?: string;
  source?: string;
  formula?: string;
  sourceText?: string;
  className?: string;
}

export function ProvenanceTooltip({
  title,
  source,
  formula,
  sourceText,
  className = "",
}: ProvenanceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayTitle = title || "Origem & Proveniência do Dado";
  const contentText = sourceText || [source ? `Fonte: ${source}` : null, formula ? `Fórmula/Método: ${formula}` : null].filter(Boolean).join(" | ");

  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-slate-500 hover:text-cyan-400 focus:outline-none transition cursor-pointer"
        aria-label="Origem dos Dados"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900/95 border border-cyan-500/40 text-slate-200 text-[11px] rounded-xl shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-snug space-y-1">
          <span className="font-semibold text-cyan-300 block uppercase tracking-wider text-[10px]">
            {displayTitle}:
          </span>
          <p>{contentText}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

