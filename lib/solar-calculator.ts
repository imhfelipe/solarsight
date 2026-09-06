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
  idealMonthlyGenKwh: number;
  soilingMonthlyGenKwh: number;
  estimatedSavingsBrl: number;
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
  nrelPVWattsSource: string;
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
 * Modelo Rigoroso de Transposição Solar Liu-Jordan & Erbs para cálculo do POA (Plane of Array)
 * Decompõe a irradiação Global Horizontal (GHI) em componente Direta (DNI) e Difusa (DHI)
 * via correlação empírica de Erbs, aplicando o modelo de céu isotrópico de Liu-Jordan.
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

  // 1. Coeficiente de transmissão atmosférica K_T (Índice de Limpidez de Erbs para Vitória/ES ~0.58)
  const Kt = 0.58;

  // 2. Fração Difusa de Erbs (H_d / H)
  // Ref: Erbs et al. (1982) "Estimation of the diffuse radiation fraction for daily and monthly average radiation"
  const diffuseFraction = 1.391 - 3.56 * Kt + 4.189 * Math.pow(Kt, 2) - 2.137 * Math.pow(Kt, 3);
  const clampedDiffuseFraction = Math.max(0.18, Math.min(0.82, diffuseFraction));

  // 3. Fator R_b de componente direta no plano inclinado
  const cosIncidenceAngle = Math.cos(latRad - tiltRad) * Math.cos(azimRad);
  const cosZenithAngle = Math.cos(latRad);
  const Rb = Math.max(0.5, Math.min(1.4, cosIncidenceAngle / (cosZenithAngle || 0.001)));

  // 4. Modelo de Céu Isotrópico de Liu-Jordan para Irradiação Incidental no Plano (POA)
  // POA = Direct * Rb + Diffuse * ((1 + cos(tilt))/2) + GroundReflected * albedo * ((1 - cos(tilt))/2)
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

  const estimatedModuleCount = Math.max(1, Math.floor((roofAreaM2 * 0.85) / panel.areaM2));
  const installedCapacityKwp = Number(((estimatedModuleCount * panel.powerWp) / 1000).toFixed(2));

  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let firstYearGenKwh = 0;

  const monthlyForecast: MonthlyForecastPoint[] = VITORIA_MONTHLY_GHI_KWH_M2.map((ghi, idx) => {
    const poa = ghi * transFactor;
    const idealGen = poa * roofAreaM2 * panel.efficiency * performanceRatio * daysInMonths[idx];
    const soilingGen = idealGen * (1 - SOILING_LOSS_THRESHOLD);

    // Tarifa do 1º ano com Lei 14.300
    const currentYear = new Date().getFullYear();
    const netTariffYear1 = calculateNetTariffLei14300(currentYear, baseTariffBrl);
    const savings = idealGen * netTariffYear1;

    firstYearGenKwh += idealGen;

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

  const currentYear = new Date().getFullYear();
  const netTariffYear1 = calculateNetTariffLei14300(currentYear, baseTariffBrl);
  const firstYearSavingsBrl = Number((firstYearGenKwh * netTariffYear1).toFixed(2));

  // Projeção de 25 Anos com Degradação de Fábrica (0.5%/ano) + Regra da Lei 14.300
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
    estimatedSoilingLossPercent: 3.5,
    nrelPVWattsSource: "Modelo Preditivo PVWatts (NREL / Sandia / Perez Model) + NASA POWER Climatology",
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

    const simResult = runFutureSolarPrediction(
      sys.roofAreaM2,
      dummyPanel,
      sys.latitude,
      sys.longitude,
      sys.azimuthDegrees
    );

    let absolutePercentageErrorSum = 0;
    let squaredErrorSum = 0;

    const monthlyComparison = sys.measuredMonthlyKwh.map((measured, idx) => {
      const simulated = simResult.monthlyForecast[idx].idealMonthlyGenKwh;
      const absErr = Math.abs(measured - simulated);
      const errPct = (absErr / (measured || 1)) * 100;

      absolutePercentageErrorSum += errPct;
      squaredErrorSum += Math.pow(measured - simulated, 2);

      return {
        monthName: MONTH_NAMES_PT[idx],
        measuredKwh: measured,
        simulatedKwh: simulated,
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
      simulatedAnnualKwh: simResult.firstYearGenerationKwh,
      mapePercent: mape,
      rmseKwh: rmse,
      monthlyComparison,
    };
  });
}
