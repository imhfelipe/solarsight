import Papa from "papaparse";

export interface ParsedCsvRow {
  date: string; // YYYY-MM-DD
  hour?: number; // 0..23
  generationKwh: number;
}

export interface CsvParseResult {
  success: boolean;
  dailyGenMap: Record<string, { totalKwh: number; hourlyKwh?: Record<number, number> }>;
  headers: string[];
  detectedTimestampCol?: string;
  detectedGenCol?: string;
  detectedUnit?: "W" | "kW" | "kWh";
  rawRowsCount: number;
  parsedDaysCount: number;
  totalKwhParsed: number;
  error?: string;
  requiresManualMapping?: boolean;
  sampleRows?: Record<string, string>[];
}

// Heurísticas para identificação de colunas por expressões regulares
const TIMESTAMP_HEADER_PATTERNS = [
  /date/i,
  /data/i,
  /time/i,
  /zeit/i,
  /horario/i,
  /timestamp/i,
  /data\s*\/s*hora/i,
  /dt_reg/i,
];

const GENERATION_HEADER_PATTERNS = [
  /power/i,
  /potencia/i,
  /energy/i,
  /energia/i,
  /geracao/i,
  /geraç/i,
  /kwh/i,
  /e-today/i,
  /etoday/i,
  /pac/i,
  /ppv/i,
  /potencia_activa/i,
  /v1/i,
];

export function parseInverterCsv(
  fileContent: string,
  manualTimestampCol?: string,
  manualGenCol?: string,
  manualUnit?: "W" | "kW" | "kWh"
): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(fileContent.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      success: false,
      dailyGenMap: {},
      headers: [],
      rawRowsCount: 0,
      parsedDaysCount: 0,
      totalKwhParsed: 0,
      error: `Erro ao interpretar formato do CSV: ${parsed.errors[0]?.message || "Arquivo inválido"}`,
    };
  }

  const headers = parsed.meta.fields || [];
  if (headers.length === 0) {
    return {
      success: false,
      dailyGenMap: {},
      headers: [],
      rawRowsCount: 0,
      parsedDaysCount: 0,
      totalKwhParsed: 0,
      error: "O arquivo CSV não possui um cabeçalho identificável na primeira linha.",
    };
  }

  // 1. Heurística de Auto-detecção de colunas
  let timestampCol = manualTimestampCol;
  let genCol = manualGenCol;

  if (!timestampCol) {
    for (const h of headers) {
      if (TIMESTAMP_HEADER_PATTERNS.some((pattern) => pattern.test(h))) {
        timestampCol = h;
        break;
      }
    }
  }

  if (!genCol) {
    for (const h of headers) {
      if (GENERATION_HEADER_PATTERNS.some((pattern) => pattern.test(h))) {
        genCol = h;
        break;
      }
    }
  }

  // Se não foi possível detectar as colunas automaticamente, acionar fallback de mapeamento manual
  if (!timestampCol || !genCol) {
    return {
      success: false,
      dailyGenMap: {},
      headers,
      rawRowsCount: parsed.data.length,
      parsedDaysCount: 0,
      totalKwhParsed: 0,
      requiresManualMapping: true,
      sampleRows: parsed.data.slice(0, 5),
      error: "Não foi possível identificar automaticamente as colunas de data/hora e geração de energia.",
    };
  }

  // 2. Detecção de Unidade (W, kW ou kWh)
  let unit: "W" | "kW" | "kWh" = manualUnit || "kWh";
  if (!manualUnit) {
    const colLower = genCol.toLowerCase();
    if (colLower.includes("(w)") || colLower.includes("[w]") || colLower.endsWith("_w") || colLower.includes("watt")) {
      unit = "W";
    } else if (colLower.includes("(kw)") || colLower.includes("[kw]") || colLower.endsWith("_kw")) {
      unit = "kW";
    } else if (colLower.includes("kwh")) {
      unit = "kWh";
    } else {
      // Heurística baseada nos valores numéricos da primeira linha
      const sampleVal = parseFloat(String(parsed.data[0]?.[genCol] || "0").replace(",", "."));
      if (sampleVal > 100) unit = "W"; // Valores > 100 indicam Potência em Watts
      else if (sampleVal < 50) unit = "kW"; // Potência instantânea kW
      else unit = "kWh";
    }
  }

  // 3. Processamento linha a linha e agregação diária/horária
  const dailyGenMap: Record<string, { totalKwh: number; hourlyKwh: Record<number, number> }> = {};
  let totalKwhParsed = 0;

  for (const row of parsed.data) {
    const rawTimeStr = row[timestampCol];
    const rawGenStr = row[genCol];

    if (!rawTimeStr || rawGenStr === undefined || rawGenStr === null) continue;

    const parseDateRes = parseTimestampString(String(rawTimeStr));
    if (!parseDateRes) continue;

    const { isoDate, hour } = parseDateRes;

    const rawVal = parseFloat(String(rawGenStr).replace(",", "."));
    if (isNaN(rawVal)) continue;

    // Converter para kWh
    let kwhVal = rawVal;
    if (unit === "W") {
      // Para leituras de 5 ou 15 minutos em Watts, aproximar integração trapezoidal/horária
      kwhVal = rawVal / 1000 / 12; // Supondo granularidade de 5 min (12 amostras por hora)
    } else if (unit === "kW") {
      kwhVal = rawVal / 12; // Supondo granularidade de 5 min
    }

    if (!dailyGenMap[isoDate]) {
      dailyGenMap[isoDate] = { totalKwh: 0, hourlyKwh: {} };
    }

    dailyGenMap[isoDate].totalKwh += kwhVal;
    dailyGenMap[isoDate].hourlyKwh[hour] = (dailyGenMap[isoDate].hourlyKwh[hour] || 0) + kwhVal;
    totalKwhParsed += kwhVal;
  }

  // Arredondamento final dos valores acumulados
  for (const dateKey of Object.keys(dailyGenMap)) {
    dailyGenMap[dateKey].totalKwh = Number(dailyGenMap[dateKey].totalKwh.toFixed(2));
    for (const h of Object.keys(dailyGenMap[dateKey].hourlyKwh)) {
      const numH = Number(h);
      dailyGenMap[dateKey].hourlyKwh[numH] = Number(dailyGenMap[dateKey].hourlyKwh[numH].toFixed(3));
    }
  }

  const parsedDaysCount = Object.keys(dailyGenMap).length;

  if (parsedDaysCount === 0) {
    return {
      success: false,
      dailyGenMap: {},
      headers,
      detectedTimestampCol: timestampCol,
      detectedGenCol: genCol,
      detectedUnit: unit,
      rawRowsCount: parsed.data.length,
      parsedDaysCount: 0,
      totalKwhParsed: 0,
      error: "Formato de data ou valores numéricos incompatíveis. Nenhuma linha válida foi agregada.",
    };
  }

  return {
    success: true,
    dailyGenMap,
    headers,
    detectedTimestampCol: timestampCol,
    detectedGenCol: genCol,
    detectedUnit: unit,
    rawRowsCount: parsed.data.length,
    parsedDaysCount,
    totalKwhParsed: Number(totalKwhParsed.toFixed(1)),
  };
}

/**
 * Parser flexível para interpretar datas em formatos variados (DD/MM/YYYY HH:mm, YYYY-MM-DD HH:mm:ss, etc.)
 */
function parseTimestampString(timeStr: string): { isoDate: string; hour: number } | null {
  const cleanStr = timeStr.trim();

  // Formato BR: DD/MM/YYYY HH:mm ou DD/MM/YYYY
  const brMatch = cleanStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (brMatch) {
    const dd = brMatch[1].padStart(2, "0");
    const mm = brMatch[2].padStart(2, "0");
    const yyyy = brMatch[3];
    const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 12;
    return { isoDate: `${yyyy}-${mm}-${dd}`, hour };
  }

  // Formato ISO: YYYY-MM-DD HH:mm ou YYYY-MM-DDTHH:mm:ss
  const isoMatch = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2}))?/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2].padStart(2, "0");
    const dd = isoMatch[3].padStart(2, "0");
    const hour = isoMatch[4] ? parseInt(isoMatch[4], 10) : 12;
    return { isoDate: `${yyyy}-${mm}-${dd}`, hour };
  }

  return null;
}
