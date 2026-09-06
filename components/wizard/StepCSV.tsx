"use client";

import React, { useState } from "react";
import { parseInverterCsv, CsvParseResult } from "@/lib/csv-parser";
import { generateSampleDatasets, SampleDataset } from "@/lib/sample-datasets";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Play,
  Settings2,
  Clock,
  Sparkles,
} from "lucide-react";

interface StepCSVProps {
  nasaDates: string[];
  parsedResult?: CsvParseResult | null;
  onCsvParsed: (result: CsvParseResult, rawCsvContent: string) => void;
  onBack: () => void;
}

export function StepCSV({ nasaDates, parsedResult: initialResult, onCsvParsed, onBack }: StepCSVProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(initialResult || null);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);

  // Mapeamento manual
  const [manualTimeCol, setManualTimeCol] = useState<string>("");
  const [manualGenCol, setManualGenCol] = useState<string>("");
  const [manualUnit, setManualUnit] = useState<"W" | "kW" | "kWh">("kWh");

  const sampleDatasets = generateSampleDatasets(nasaDates);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);

      const result = parseInverterCsv(content);
      setParseResult(result);

      if (result.requiresManualMapping) {
        setIsMappingModalOpen(true);
      } else if (result.success) {
        onCsvParsed(result, content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (sample: SampleDataset) => {
    setFileName(`${sample.name}.csv`);
    setFileContent(sample.csvContent);

    const result = parseInverterCsv(sample.csvContent);
    setParseResult(result);

    if (result.success) {
      onCsvParsed(result, sample.csvContent);
    }
  };

  const handleApplyManualMapping = () => {
    if (!fileContent || !manualTimeCol || !manualGenCol) return;

    const result = parseInverterCsv(fileContent, manualTimeCol, manualGenCol, manualUnit);
    setParseResult(result);
    setIsMappingModalOpen(false);

    if (result.success) {
      onCsvParsed(result, fileContent);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          Passo 4: Geração Real do Inversor (Upload CSV)
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Faça o upload do arquivo CSV exportado pelo portal do inversor (Fronius, Growatt, Huawei, SolarEdge, SAJ, etc.) para os últimos 30 dias.
        </p>
      </div>

      {/* Alerta de Timezone UTC-3 */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 text-xs text-slate-400">
        <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Assunção de Timezone:</strong> Se o arquivo CSV omitir o fuso horário, o sistema assumirá o <strong>Horário de Brasília (UTC-3)</strong>.
        </span>
      </div>

      {/* Área de Drag and Drop File Upload */}
      <div className="glass-card rounded-2xl p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition text-center space-y-4 relative">
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-white">
            {fileName ? `Arquivo Carregado: ${fileName}` : "Arraste o arquivo CSV aqui ou clique para selecionar"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Parser adaptativo com suporte a vírgula/ponto e vírgula, e unidades em Watts (W), kW ou kWh.
          </p>
        </div>
      </div>

      {/* Atalhos de Demonstração para a Banca (Preloaded Datasets) */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Conjuntos de Dados de Teste (1-Clique para Apresentação)
          </span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-mono">
            Banca TCC Demo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleDatasets.map((sample) => (
            <div
              key={sample.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl transition flex flex-col justify-between space-y-2 text-left"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">{sample.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      sample.scenario === "SOILING"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : sample.scenario === "SHADING"
                        ? "bg-rose-950 text-rose-300 border border-rose-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {sample.scenario}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sample.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="w-full py-1.5 bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-current" /> Carregar este Exemplo
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exibição do Resultado do Parsing */}
      {parseResult && (
        <div className="space-y-4">
          {parseResult.success ? (
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 glow-emerald space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">CSV Processado com Sucesso</h3>
                    <p className="text-xs text-slate-400">
                      Schema detectado automaticamente client-side (100% Stateless).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Coluna Data/Hora:</span>
                  <span className="text-cyan-300 font-mono font-semibold">{parseResult.detectedTimestampCol}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Coluna Geração:</span>
                  <span className="text-cyan-300 font-mono font-semibold">{parseResult.detectedGenCol}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unidade Detectada:</span>
                  <span className="text-emerald-400 font-mono font-semibold">{parseResult.detectedUnit}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dias Agregados:</span>
                  <span className="text-white font-mono font-semibold">{parseResult.parsedDaysCount} dias</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onCsvParsed(parseResult, fileContent || "")}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  Executar Diagnóstico Fotovoltaico &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/40 border border-rose-800/60 p-5 rounded-2xl text-rose-200 text-xs space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-300 text-sm">Falha no Parsing Automático do CSV</h4>
                  <p className="mt-1 text-rose-300/90">{parseResult.error}</p>
                </div>
              </div>

              {parseResult.requiresManualMapping && (
                <button
                  onClick={() => setIsMappingModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  <Settings2 className="w-4 h-4" /> Mapear Colunas Manualmente
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal / Dialog de Mapeamento Manual de Colunas */}
      {isMappingModalOpen && parseResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-amber-400" />
              Mapeamento Manual de Colunas (Fallback)
            </h3>
            <p className="text-xs text-slate-400">
              Selecione qual coluna do seu arquivo representa a data/hora e qual representa a geração de energia.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Coluna de Data / Hora:</label>
                <select
                  value={manualTimeCol}
                  onChange={(e) => setManualTimeCol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                >
                  <option value="">-- Selecionar Coluna --</option>
                  {parseResult.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Coluna de Geração de Energia / Potência:</label>
                <select
                  value={manualGenCol}
                  onChange={(e) => setManualGenCol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                >
                  <option value="">-- Selecionar Coluna --</option>
                  {parseResult.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Unidade dos Valores:</label>
                <select
                  value={manualUnit}
                  onChange={(e) => setManualUnit(e.target.value as "W" | "kW" | "kWh")}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                >
                  <option value="kWh">kWh (Energia Agregada)</option>
                  <option value="kW">kW (Potência Instantânea)</option>
                  <option value="W">W (Watts Potência Instantânea)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyManualMapping}
                disabled={!manualTimeCol || !manualGenCol}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                Confirmar Mapeamento
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-start">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
        >
          &larr; Voltar
        </button>
      </div>
    </div>
  );
}
