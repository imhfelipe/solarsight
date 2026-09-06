import {
  runFutureSolarPrediction,
  SolarPanel,
  calculateLiuJordanTranspositionFactor,
} from "../lib/solar-calculator";
import { SOILING_LOSS_THRESHOLD, DEFAULT_PERFORMANCE_RATIO } from "../lib/constants";

/**
 * Teste Unitário do Motor de Cálculo Fotovoltaico (SolarSight)
 * Valida a consistência dimensional da fórmula E = kWp * POA * PR * dias (Bug #1)
 * e a propagação correta da perda por sujeira/maresia para os totais financeiros (Bug #2).
 */
export function testSolarCalculatorEngine() {
  console.log("🧪 Rodando Teste Unitário: Motor de Cálculo Fotovoltaico...");

  const mockPanel: SolarPanel = {
    id: "test-panel",
    brand: "TestBrand",
    model: "Test 500Wp",
    powerWp: 500,
    efficiency: 0.20,
    widthMeters: 1.134,
    heightMeters: 2.208,
    areaM2: 2.50,
    cellTech: "PERC",
  };

  // Telhado de 30.0 m² -> 30.0 * 0.85 = 25.5 m² / 2.5 m² = 10 módulos -> 10 * 500Wp / 1000 = 5.0 kWp exatos
  const roofAreaM2 = 30.0;
  const result = runFutureSolarPrediction(roofAreaM2, mockPanel, -20.31, -40.31, 0, DEFAULT_PERFORMANCE_RATIO);

  // Assert 1: kWp deve ser exatamente 5.0 kWp (10 módulos de 500Wp)
  if (result.estimatedModuleCount !== 10) {
    throw new Error(`[FAIL] Esperado 10 módulos, obtido ${result.estimatedModuleCount}`);
  }
  if (result.installedCapacityKwp !== 5.0) {
    throw new Error(`[FAIL] Esperado 5.0 kWp, obtido ${result.installedCapacityKwp}`);
  }

  // Assert 2: Validação manual de energia do mês de Janeiro (idx 0, 31 dias, GHI 5.85)
  const transFactor = calculateLiuJordanTranspositionFactor(-20.31, 20.3, 0);
  const expectedJanPOA = 5.85 * transFactor;
  const expectedJanIdealGen = 5.0 * expectedJanPOA * 0.80 * 31;
  const expectedJanNetGen = expectedJanIdealGen * (1 - SOILING_LOSS_THRESHOLD);

  const janForecast = result.monthlyForecast[0];
  const idealDiff = Math.abs(janForecast.idealMonthlyGenKwh - expectedJanIdealGen);
  const netDiff = Math.abs(janForecast.soilingMonthlyGenKwh - expectedJanNetGen);

  if (idealDiff > 0.5) {
    throw new Error(`[FAIL] Geração ideal de Jan (obtida ${janForecast.idealMonthlyGenKwh}) difere de esperada (${expectedJanIdealGen})`);
  }
  if (netDiff > 0.5) {
    throw new Error(`[FAIL] Geração líquida de Jan (obtida ${janForecast.soilingMonthlyGenKwh}) difere de esperada (${expectedJanNetGen})`);
  }

  // Assert 3: Bug #2 - firstYearGenerationKwh deve ser a SOMA da geração LÍQUIDA (soilingMonthlyGenKwh)
  const sumNetGen = result.monthlyForecast.reduce((acc, m) => acc + m.soilingMonthlyGenKwh, 0);
  const annualGenDiff = Math.abs(result.firstYearGenerationKwh - sumNetGen);
  if (annualGenDiff > 1.0) {
    throw new Error(`[FAIL] Bug #2 Não Corrigido! firstYearGenKwh (${result.firstYearGenerationKwh}) difere da soma líquida (${sumNetGen})`);
  }

  // Assert 4: estimatedSoilingLossPercent deve bater dinamicamente com a constante (3.5%)
  const expectedSoilingPercent = Number((SOILING_LOSS_THRESHOLD * 100).toFixed(1));
  if (result.estimatedSoilingLossPercent !== expectedSoilingPercent) {
    throw new Error(`[FAIL] Percentual de sujeira (${result.estimatedSoilingLossPercent}%) difere da constante (${expectedSoilingPercent}%)`);
  }

  console.log("✅ [SUCCESS] Todos os 4 testes unitários do motor de cálculo passaram sem erros!");
}

// Executar teste imediatamente se rodado direto
testSolarCalculatorEngine();
