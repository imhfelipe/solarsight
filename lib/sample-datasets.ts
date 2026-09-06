/**
 * SolarSight - Datasets de Teste Pré-carregados
 * 
 * Fornece CSVs reais e sintéticos para demonstração instantânea perante a banca avaliadora.
 * Inclui formatos de inversores conhecidos (Fronius, Growatt) e cenários de teste controlados.
 */

export interface SampleDataset {
  id: string;
  name: string;
  inverterBrand: string;
  scenario: "NORMAL" | "SOILING" | "SHADING";
  description: string;
  csvContent: string;
}

export function generateSampleDatasets(baseDates: string[]): SampleDataset[] {
  // Garantir 30 datas
  const dates = baseDates.length >= 30 ? baseDates.slice(0, 30) : generateFallbackDateRange();

  // 1. Fronius Inverter Sample (Formato Hourly kWh)
  const froniusRows: string[] = ["Timestamp;Energy_kWh;Status_Code"];
  for (const date of dates) {
    for (let h = 6; h <= 18; h++) {
      const angle = ((h - 6) / 12) * Math.PI;
      const idealH = Math.pow(Math.sin(angle), 1.8) * 4.2; // ~4.2 kWh pico
      // Variação normal (< 5%)
      const noise = (Math.random() * 0.04 - 0.02);
      const realH = Math.max(0, idealH * (1 + noise));
      froniusRows.push(`${date} ${String(h).padStart(2, "0")}:00;${realH.toFixed(3)};0`);
    }
  }
  const froniusCsv = froniusRows.join("\n");

  // 2. Growatt Inverter Sample (Formato 5-min Potência Ativa em Watts com colunas em inglês)
  const growattRows: string[] = ["Time,Pac_W,E_Today_kWh"];
  for (const date of dates) {
    for (let h = 6; h <= 18; h++) {
      for (let m = 0; m < 60; m += 15) {
        const angle = ((h + m / 60 - 6) / 12) * Math.PI;
        const idealW = Math.pow(Math.sin(angle), 1.8) * 8500; // ~8.5 kWp
        const realW = Math.max(0, idealW * 0.96);
        growattRows.push(`${date} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00,${Math.round(realW)},12.4`);
      }
    }
  }
  const growattCsv = growattRows.join("\n");

  // 3. Cenário Sintético de Sujidade (Perda constante e sustentada de ~11% ao longo do dia)
  const soilingRows: string[] = ["Data/Hora,Geracao_kWh,Inversor_ID"];
  for (const date of dates) {
    for (let h = 6; h <= 18; h++) {
      const angle = ((h - 6) / 12) * Math.PI;
      const idealH = Math.pow(Math.sin(angle), 1.8) * 5.0;
      // Perda sustentada uniforme de 11% (multiplicador 0.89)
      const soilingH = Math.max(0, idealH * 0.885);
      soilingRows.push(`${date} ${String(h).padStart(2, "0")}:00,${soilingH.toFixed(3)},INV-01`);
    }
  }
  const soilingCsv = soilingRows.join("\n");

  // 4. Cenário Sintético de Sombreamento Fixo (Queda abrupta e recorrente das 08:00 às 10:00 em dias ensolarados)
  const shadingRows: string[] = ["date_time,power_w"];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    for (let h = 6; h <= 18; h++) {
      const angle = ((h - 6) / 12) * Math.PI;
      let idealW = Math.pow(Math.sin(angle), 1.8) * 7500;

      // Queda abrupta das 8h às 10h da manhã (simula árvore/chaminé a leste do telhado)
      if (h >= 8 && h <= 10) {
        idealW = idealW * 0.35; // Perda de 65% nesse intervalo
      }

      shadingRows.push(`${date} ${String(h).padStart(2, "0")}:00:00,${Math.round(idealW)}`);
    }
  }
  const shadingCsv = shadingRows.join("\n");

  return [
    {
      id: "soiling-demo",
      name: "Cenário Sintético 🟡 Sujidade (~11% perda)",
      inverterBrand: "Sintético Calibrado",
      scenario: "SOILING",
      description: "Demonstração de perda uniforme por sujeira acumulada / maresia costeira em Vitória-ES.",
      csvContent: soilingCsv,
    },
    {
      id: "shading-demo",
      name: "Cenário Sintético 🔴 Sombreamento Fixo (08h-10h)",
      inverterBrand: "Sintético Calibrado",
      scenario: "SHADING",
      description: "Demonstração de queda pontual recorrente provocada por obstáculo físico no período da manhã.",
      csvContent: shadingCsv,
    },
    {
      id: "fronius-normal",
      name: "Inversor Fronius (Operação Normal 🟢)",
      inverterBrand: "Fronius Primo/Symo",
      scenario: "NORMAL",
      description: "CSV no padrão de exportação horária Fronius com separador de ponto-e-vírgula (;) e energia em kWh.",
      csvContent: froniusCsv,
    },
    {
      id: "growatt-normal",
      name: "Inversor Growatt (Intervalos de 15min W)",
      inverterBrand: "Growatt MIN/MOD",
      scenario: "NORMAL",
      description: "CSV no padrão Growatt ShineServer com leituras instantâneas em Watts a cada 15 minutos.",
      csvContent: growattCsv,
    },
  ];
}

function generateFallbackDateRange(): string[] {
  const dates: string[] = [];
  const base = new Date();
  base.setDate(base.getDate() - 34);

  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}
