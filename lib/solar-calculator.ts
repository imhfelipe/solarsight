import {
  SOILING_LOSS_THRESHOLD,
  DEFAULT_PERFORMANCE_RATIO,
  DEFAULT_AZIMUTH_DEGREES,
  VITORIA_MONTHLY_GHI_KWH_M2,
  MONTH_NAMES_PT,
} from "./constants";
import validationSystemsData from "@/data/validation-systems.json";

export interface SolarPanel {
  id: string;
  brand: string;
  model: string;
  powerWp: number;
  efficiency: number;
  widthMeters: number;
  heightMeters: number;
  areaM2: number;
  cellTech: string;
}

export interface MonthlyForecastPoint {
  monthName: string;
  monthIndex: number; // 0..11
  dailyGhiKwhM2: number;
  poaIrradianceKwhM2: number;
  idealMonthlyGenKwh: number; // Geração sem perdas de sujeira (ideal para comparação)
  soilingMonthlyGenKwh: number; // Geração líquida estimada (com perda de sujidade/maresia)
  estimatedSavingsBrl: number; // Economia líquida baseada na geração real com sujeira
}

export interface YearProjectionPoint {
  year: number; // 1..25
  calendarYear: number;
  degradationPercent: number;
  fioBChargePercent: number;
  netTariffPerKwh: number;
  annualGenerationKwh: number;
  cumulativeGenerationKwh: number;
  annualSavingsBrl: number;
  cumulativeSavingsBrl: number;
}

export interface FutureSolarPredictionResult {
  latitude: number;
  longitude: number;
  calculatedTiltDegrees: number;
  azimuthDegrees: number;
  transpositionFactor: number;
  roofAreaM2: number;
  estimatedModuleCount: number;
  installedCapacityKwp: number;
  panel: SolarPanel;
  firstYearGenerationKwh: number;
  firstYearSavingsBrl: number;
  twentyFiveYearGenerationKwh: number;
  twentyFiveYearSavingsBrl: number;
  estimatedPaybackYears: number;
  monthlyForecast: MonthlyForecastPoint[];
  yearlyProjections: YearProjectionPoint[];
  estimatedSoilingLossPercent: number;
  transpositionModelSource: string;
  nrelPVWattsSource: string; // Mantido para compatibilidade retroativa
}

export interface ValidationSystemResult {
  id: string;
  name: string;
  location: string;
  installedCapacityKwp: number;
  measuredAnnualKwh: number;
  simulatedAnnualKwh: number;
  mapePercent: number;
  rmseKwh: number;
  monthlyComparison: {
    monthName: string;
    measuredKwh: number;
    simulatedKwh: number;
    errorPercent: number;
  }[];
}

/**
 * Rótulo descritivo da bússola solar em relação aos graus do azimute
 */
export function getCompassLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return "Norte (Máxima Captação no HS)";
  if (normalized >= 22.5 && normalized < 67.5) return "Nordeste";
  if (normalized >= 67.5 && normalized < 112.5) return "Leste (Geração Matutina)";
  if (normalized >= 112.5 && normalized < 157.5) return "Sudeste";
  if (normalized >= 157.5 && normalized < 202.5) return "Sul";
  if (normalized >= 202.5 && normalized < 247.5) return "Sudoeste";
  if (normalized >= 247.5 && normalized < 292.5) return "Oeste (Geração Vespertina)";
  return "Noroeste";
}

/**
 * Inclinação ótima calculada dinamicamente a partir da latitude da coordenada
 */
export function calculateCoordinateTilt(latitude: number): number {
  const absLat = Math.abs(latitude);
  return Number((absLat || 20.3).toFixed(1));
}

/**
 * Modelo de Transposição Solar: Erbs (fração difusa) + Liu-Jordan (céu isotrópico)
 * Decompõe a irradiação Global Horizontal (GHI) em componente Direta (DNI) e Difusa (DHI)
 * via correlação empírica de Erbs, aplicando o modelo de céu isotrópico de Liu-Jordan.
 * 
 * PREMISSAS E LIMITAÇÕES ASSUMIDAS DO MODELO:
 * 1. Coeficiente de Limpidez Kt Fixo (0,58): O índice Kt real varia sazonalmente entre a
 *    estação chuvosa e seca em Vitória/ES. Usar o valor médio anual de 0,58 é uma simplificação
 *    assumida para evitar requisição extra de dados diários de nebulosidade.
 * 2. Transposição Estática Anual (transFactor): O fator transFactor é calculado uma única vez
 *    fora do loop mensal. A sazonalidade da previsão decorre primariamente da curva de GHI mensal.
 * 3. Componente Direta Rb ao Meio-Dia Solar: O fator Rb utiliza a aproximação simplificada do
 *    ângulo de incidência solar ao meio-dia (cos(lat - tilt) * cos(azimute) / cos(lat)), operando
 *    como uma heurística direcional consistente sem exigir integração horária de Klein & Duffie.
 */
export function calculateLiuJordanTranspositionFactor(
  latitude: number,
  tiltDegrees: number,
  azimuthDegrees: number = DEFAULT_AZIMUTH_DEGREES
): number {
  const absLat = Math.abs(latitude) || 20.3;
  const tiltRad = (tiltDegrees * Math.PI) / 180;
  const latRad = (absLat * Math.PI) / 180;
  const azimRad = (azimuthDegrees * Math.PI) / 180;

  // 1. Coeficiente de transmissão atmosférica K_T (Índice de Limpidez Médio de Erbs para Vitória/ES ~0,58)
  const Kt = 0.58;

  // 2. Fração Difusa de Erbs (H_d / H)
  // Ref: Erbs et al. (1982) "Estimation of the diffuse radiation fraction for daily and monthly average radiation"
  const diffuseFraction = 1.391 - 3.56 * Kt + 4.189 * Math.pow(Kt, 2) - 2.137 * Math.pow(Kt, 3);
  const clampedDiffuseFraction = Math.max(0.18, Math.min(0.82, diffuseFraction));

  // 3. Fator R_b de componente direta no plano inclinado (Aproximação de incidência solar ao meio-dia)
  const cosIncidenceAngle = Math.cos(latRad - tiltRad) * Math.cos(azimRad);
  const cosZenithAngle = Math.cos(latRad);
  const Rb = Math.max(0.5, Math.min(1.4, cosIncidenceAngle / (cosZenithAngle || 0.001)));

  // 4. Modelo de Céu Isotrópico de Liu-Jordan para Irradiação Incidental no Plano (POA)
  const albedo = 0.20; // Albedo padrão do solo/telhado
  const directWeight = (1 - clampedDiffuseFraction) * Rb;
  const diffuseWeight = clampedDiffuseFraction * ((1 + Math.cos(tiltRad)) / 2);
  const groundWeight = albedo * ((1 - Math.cos(tiltRad)) / 2);

  const poaFactor = directWeight + diffuseWeight + groundWeight;
  return Math.max(0.70, Math.min(1.30, Number(poaFactor.toFixed(3))));
}

/**
 * Modelo Financeiro da Lei 14.300/2022 (Marco Legal da Geração Distribuída)
 * Retorna a porcentagem de cobrança do componente Fio B para cada ano (2023 a 2029+)
 * Ref: EDP Espírito Santo - Componente Fio B representa ~28% da tarifa B1 residencial.
 */
export function calculateLei14300FioBPercent(calendarYear: number): number {
  if (calendarYear <= 2022) return 0;
  if (calendarYear === 2023) return 15;
  if (calendarYear === 2024) return 30;
  if (calendarYear === 2025) return 45;
  if (calendarYear === 2026) return 60;
  if (calendarYear === 2027) return 75;
  if (calendarYear === 2028) return 90;
  return 100; // 2029 em diante (100% da cobrança do Fio B)
}

/**
 * Calcula a economia líquida por kWh considerando a regra de transição da Lei 14.300/2022
 */
export function calculateNetTariffLei14300(
  calendarYear: number,
  baseTariffBrl: number = 0.85,
  fioBPercentOfTariff: number = 0.28
): number {
  const fioBChargeShare = calculateLei14300FioBPercent(calendarYear) / 100;
  const fioBVal = baseTariffBrl * fioBPercentOfTariff;
  const netSavingsPerKwh = baseTariffBrl - fioBVal * fioBChargeShare;
  return Number(netSavingsPerKwh.toFixed(4));
}

/**
 * Executa a Simulação Preditiva de Geração Solar Futura com modelo Liu-Jordan & Lei 14.300/2022
 */
export function runFutureSolarPrediction(
  roofAreaM2: number,
  panel: SolarPanel,
  latitude: number = -20.3168,
  longitude: number = -40.3245,
  azimuthDegrees: number = DEFAULT_AZIMUTH_DEGREES,
  performanceRatio: number = DEFAULT_PERFORMANCE_RATIO,
  baseTariffBrl: number = 0.85,
  estimatedSystemCostPerKwp: number = 3200
): FutureSolarPredictionResult {
  const calculatedTiltDegrees = calculateCoordinateTilt(latitude);
  const transFactor = calculateLiuJordanTranspositionFactor(latitude, calculatedTiltDegrees, azimuthDegrees);

  // BUG #1 FIX: Derivar capacidade instalada real a partir do número inteiro de módulos no telhado
  const estimatedModuleCount = Math.max(1, Math.floor((roofAreaM2 * 0.85) / panel.areaM2));
  const installedCapacityKwp = Number(((estimatedModuleCount * panel.powerWp) / 1000).toFixed(2));

  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let firstYearGenKwh = 0;

  const currentYear = new Date().getFullYear();
  const netTariffYear1 = calculateNetTariffLei14300(currentYear, baseTariffBrl);

  const monthlyForecast: MonthlyForecastPoint[] = VITORIA_MONTHLY_GHI_KWH_M2.map((ghi, idx) => {
    const poa = ghi * transFactor;
    
    // BUG #1 FIX: Energia mensal ideal (bruta) derivada diretamente do kWp instalado (E = kWp * POA * PR * dias)
    const idealGen = installedCapacityKwp * poa * performanceRatio * daysInMonths[idx];
    
    // BUG #2 FIX: Geração líquida real (aplicando o fator de sujidade/maresia)
    const soilingGen = idealGen * (1 - SOILING_LOSS_THRESHOLD);

    // BUG #2 FIX: Economia financeira calculada sobre a geração líquida real
    const savings = soilingGen * netTariffYear1;

    // BUG #2 FIX: Acumular a geração líquida real para os totais anuais
    firstYearGenKwh += soilingGen;

    return {
      monthName: MONTH_NAMES_PT[idx],
      monthIndex: idx,
      dailyGhiKwhM2: Number(ghi.toFixed(2)),
      poaIrradianceKwhM2: Number(poa.toFixed(2)),
      idealMonthlyGenKwh: Number(idealGen.toFixed(1)),
      soilingMonthlyGenKwh: Number(soilingGen.toFixed(1)),
      estimatedSavingsBrl: Number(savings.toFixed(2)),
    };
  });

  // BUG #2 FIX: Economia do primeiro ano derivada da geração líquida com sujeira
  const firstYearSavingsBrl = Number((firstYearGenKwh * netTariffYear1).toFixed(2));

  // Projeção de 25 Anos com Degradação de Fábrica (0.5%/ano) + Regra da Lei 14.300 sobre Geração Líquida
  const yearlyProjections: YearProjectionPoint[] = [];
  let cumKwh = 0;
  let cumSavings = 0;
  const annualDegradationRate = 0.005;

  for (let y = 1; y <= 25; y++) {
    const calYear = currentYear + y - 1;
    const degradation = Math.pow(1 - annualDegradationRate, y - 1);
    const annualKwh = firstYearGenKwh * degradation;

    const netTariff = calculateNetTariffLei14300(calYear, baseTariffBrl);
    const annualSavings = annualKwh * netTariff;

    cumKwh += annualKwh;
    cumSavings += annualSavings;

    yearlyProjections.push({
      year: y,
      calendarYear: calYear,
      degradationPercent: Number(((1 - degradation) * 100).toFixed(1)),
      fioBChargePercent: calculateLei14300FioBPercent(calYear),
      netTariffPerKwh: netTariff,
      annualGenerationKwh: Number(annualKwh.toFixed(1)),
      cumulativeGenerationKwh: Number(cumKwh.toFixed(1)),
      annualSavingsBrl: Number(annualSavings.toFixed(2)),
      cumulativeSavingsBrl: Number(cumSavings.toFixed(2)),
    });
  }

  const totalSystemCost = installedCapacityKwp * estimatedSystemCostPerKwp;
  const paybackYears = Number((totalSystemCost / (firstYearSavingsBrl || 1)).toFixed(1));

  const modelSourceText = "Modelo de Transposição Erbs (fração difusa) + Liu-Jordan (céu isotrópico) + NASA POWER Climatology";

  return {
    latitude,
    longitude,
    calculatedTiltDegrees,
    azimuthDegrees,
    transpositionFactor: transFactor,
    roofAreaM2,
    estimatedModuleCount,
    installedCapacityKwp,
    panel,
    firstYearGenerationKwh: Number(firstYearGenKwh.toFixed(1)),
    firstYearSavingsBrl,
    twentyFiveYearGenerationKwh: Number(cumKwh.toFixed(1)),
    twentyFiveYearSavingsBrl: Number(cumSavings.toFixed(2)),
    estimatedPaybackYears: paybackYears,
    monthlyForecast,
    yearlyProjections,
    // BUG #2 FIX: Ler dinamicamente a constante SOILING_LOSS_THRESHOLD
    estimatedSoilingLossPercent: Number((SOILING_LOSS_THRESHOLD * 100).toFixed(1)),
    transpositionModelSource: modelSourceText,
    nrelPVWattsSource: modelSourceText,
  };
}

/**
 * Módulo de Validação Estatística do Modelo Preditivo do SolarSight
 * Roda a previsão sobre sistemas reais documentados no Espírito Santo e calcula MAPE e RMSE
 */
export function runValidationAnalysis(): ValidationSystemResult[] {
  const referenceSystems = validationSystemsData as unknown as {
    id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    installedCapacityKwp: number;
    roofAreaM2: number;
    tiltDegrees: number;
    azimuthDegrees: number;
    panelModel: string;
    panelPowerWp: number;
    panelEfficiency: number;
    measuredMonthlyKwh: number[];
    measuredAnnualKwh: number;
  }[];

  return referenceSystems.map((sys) => {
    const dummyPanel: SolarPanel = {
      id: sys.id,
      brand: "Referência",
      model: sys.panelModel,
      powerWp: sys.panelPowerWp,
      efficiency: sys.panelEfficiency,
      widthMeters: 1.134,
      heightMeters: 2.278,
      areaM2: 2.583,
      cellTech: "Monocristalino PERC/TOPCon",
    };

    const calculatedTiltDegrees = calculateCoordinateTilt(sys.latitude);
    const transFactor = calculateLiuJordanTranspositionFactor(sys.latitude, calculatedTiltDegrees, sys.azimuthDegrees);
    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let absolutePercentageErrorSum = 0;
    let squaredErrorSum = 0;
    let totalSimulatedAnnualKwh = 0;

    const monthlyComparison = sys.measuredMonthlyKwh.map((measured, idx) => {
      const ghi = VITORIA_MONTHLY_GHI_KWH_M2[idx];
      const poa = ghi * transFactor;
      
      // Simulação usando a capacidade instalada real da usina de referência
      const idealGen = sys.installedCapacityKwp * poa * DEFAULT_PERFORMANCE_RATIO * daysInMonths[idx];
      const simulated = idealGen * (1 - SOILING_LOSS_THRESHOLD);

      totalSimulatedAnnualKwh += simulated;

      const absErr = Math.abs(measured - simulated);
      const errPct = (absErr / (measured || 1)) * 100;

      absolutePercentageErrorSum += errPct;
      squaredErrorSum += Math.pow(measured - simulated, 2);

      return {
        monthName: MONTH_NAMES_PT[idx],
        measuredKwh: measured,
        simulatedKwh: Number(simulated.toFixed(1)),
        errorPercent: Number(errPct.toFixed(2)),
      };
    });

    const mape = Number((absolutePercentageErrorSum / 12).toFixed(2));
    const rmse = Number(Math.sqrt(squaredErrorSum / 12).toFixed(1));

    return {
      id: sys.id,
      name: sys.name,
      location: sys.location,
      installedCapacityKwp: sys.installedCapacityKwp,
      measuredAnnualKwh: sys.measuredAnnualKwh,
      simulatedAnnualKwh: Number(totalSimulatedAnnualKwh.toFixed(1)),
      mapePercent: mape,
      rmseKwh: rmse,
      monthlyComparison,
    };
  });
}
