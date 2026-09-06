"use client";

import React, { useState } from "react";
import { geocodeSearch, GeocodingResult } from "@/lib/geocoding";
import { MapPin, Search, Loader2, AlertTriangle, CheckCircle2, GraduationCap } from "lucide-react";
import { ProvenanceTooltip } from "@/components/ui/ProvenanceTooltip";

interface StepLocationProps {
  onLocationSelect: (location: GeocodingResult) => void;
  currentLocation?: GeocodingResult | null;
}

export function StepLocation({ onLocationSelect, currentLocation }: StepLocationProps) {
  const [query, setQuery] = useState(currentLocation?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(
    currentLocation || null
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await geocodeSearch(query);
      setSelectedLocation(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao buscar localização.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectFaesa = async () => {
    setQuery("FAESA, Av. Vitória, Monte Belo, Vitória - ES");
    setLoading(true);
    setError(null);
    try {
      const res = await geocodeSearch("FAESA, Av. Vitória, Monte Belo, Vitória - ES");
      setSelectedLocation(res);
    } catch {
      const fallback: GeocodingResult = {
        lat: -20.311279122941556,
        lon: -40.31432813971878,
        displayName: "FAESA Centro Universitário, Monte Belo, Vitória - ES, Brasil",
        city: "Vitória",
        state: "ES",
        neighborhood: "Monte Belo",
      };
      setSelectedLocation(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" /> RESIDÊNCIAS EM VITÓRIA - ES — PASSO 1 DE 4
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Localize o Telhado Residencial em Vitória - ES
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm">
          Digite o CEP (ex: <code className="text-[#ea580c] font-bold font-mono">29053-360</code>) ou endereço da residência em Vitória - ES para carregar as imagens de satélite ArcGIS.
        </p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto space-y-4">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite CEP (ex: 29053-360) ou Endereço Completo..."
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-[#ea580c] transition shadow-xs text-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-[#ea580c] hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50 transition flex items-center gap-2 text-xs cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
          </button>
        </div>

        {/* Atalhos Rápidos para Demonstração da Banca FAESA */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Atalho para Banca FAESA:</span>
          <button
            type="button"
            onClick={handleQuickSelectFaesa}
            className="text-[#ea580c] hover:underline flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#ea580c]" /> Campus FAESA (Vitória / ES)
          </button>
        </div>
      </form>

      {error && (
        <div className="max-w-xl mx-auto bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-sm shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erro de Geocodificação</p>
            <p className="text-rose-600 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 shadow-sm space-y-4 border border-orange-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Localização Qualificada</h3>
                <p className="text-xs text-slate-500">{selectedLocation.displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono bg-orange-50 border border-orange-200 text-[#ea580c] px-2.5 py-1 rounded-full font-bold">
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
              </span>
              <ProvenanceTooltip
                title="Coordenadas Geográficas (Lat/Lon)"
                source="Google Solar API / OpenStreetMap / ViaCEP"
                formula="Latitude e Longitude resolvidas dinamicamente via webservice gratuito WGS84 para consulta de radiação solar NASA POWER e Google Solar Building Insights."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 flex items-center gap-1">
                Cidade / UF
                <ProvenanceTooltip
                  title="Dados do Município"
                  source="IBGE / ViaCEP / OSM"
                  formula="Identificação geográfica de Vitória ou região do Espírito Santo."
                />
              </span>
              <span className="text-slate-900 font-bold">{selectedLocation.city} - {selectedLocation.state}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bairro:</span>
              <span className="text-slate-900 font-bold">{selectedLocation.neighborhood || "Centro"}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => onLocationSelect(selectedLocation)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-[#ea580c] hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              Avançar para Mapeamento Físico &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
