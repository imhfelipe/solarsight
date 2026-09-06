/**
 * SolarSight - Client API NASA POWER (Climatologia Mensal Histórica Multi-Anual)
 * Parameter: ALLSKY_SFC_SW_DWN (Irradiância global horizontal climatológica em kWh/m²/dia por mês)
 * 
 * JUSTIFICATIVA ACADÊMICA TCC (FAESA):
 * A previsão de geração sazonal ao longo dos 12 meses do ano exige um perfil climatológico 
 * de médias históricas consolidadas por mês (série temporal multi-anual de longo prazo da NASA), 
 * em vez de uma amostragem pontual de 30 dias corridos que não captura as variações sazonais do ano.
 */

export interface NasaMonthlyClimatologyRecord {
  monthIndex: number; // 0..11
  monthName: string;
  irradiationKwhM2: number;
}

export interface NasaPowerClimatologyResponse {
  latitude: number;
  longitude: number;
  monthlyRecords: NasaMonthlyClimatologyRecord[];
  annualAverageIrradiationKwhM2: number;
  dataSourceInfo: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Climatologia histórica de referência para Vitória/ES (Fonte: LABREN / INPE / NASA POWER)
const VITORIA_CLIMATOLOGY_FALLBACK = [5.85, 6.10, 5.40, 4.75, 4.15, 3.80, 3.95, 4.50, 4.85, 5.20, 5.50, 5.70];

export async function fetchNasaPowerClimatology(
  lat: number,
  lon: number
): Promise<NasaPowerClimatologyResponse> {
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&format=JSON`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA POWER Climatology API respondeu com status ${response.status}`);
    }

    const data = await response.json();
    const climatologyMap = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN;

    if (!climatologyMap || typeof climatologyMap !== "object") {
      throw new Error("Dados climatológicos ausentes no retorno da NASA POWER API.");
    }

    // NASA Climatology keys: JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC, ANN
    const monthKeys = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthlyRecords: NasaMonthlyClimatologyRecord[] = [];
    let sum = 0;

    monthKeys.forEach((key, idx) => {
      const val = climatologyMap[key];
      const validVal = typeof val === "number" && val > 0 ? val : VITORIA_CLIMATOLOGY_FALLBACK[idx];
      monthlyRecords.push({
        monthIndex: idx,
        monthName: MONTH_NAMES[idx],
        irradiationKwhM2: Number(validVal.toFixed(2)),
      });
      sum += validVal;
    });

    const avg = sum / 12;

    return {
      latitude: lat,
      longitude: lon,
      monthlyRecords,
      annualAverageIrradiationKwhM2: Number(avg.toFixed(2)),
      dataSourceInfo: `NASA POWER Multi-Year Monthly Climatology (ALLSKY_SFC_SW_DWN) - Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
    };
  } catch (error) {
    console.warn("Utilizando Climatologia Histórica de Referência Vitória/ES:", error);
    const monthlyRecords = VITORIA_CLIMATOLOGY_FALLBACK.map((val, idx) => ({
      monthIndex: idx,
      monthName: MONTH_NAMES[idx],
      irradiationKwhM2: val,
    }));
    const avg = VITORIA_CLIMATOLOGY_FALLBACK.reduce((a, b) => a + b, 0) / 12;

    return {
      latitude: lat,
      longitude: lon,
      monthlyRecords,
      annualAverageIrradiationKwhM2: Number(avg.toFixed(2)),
      dataSourceInfo: `Climatologia Histórica Solar Vitória/ES (Fallback NASA POWER)`,
    };
  }
}
