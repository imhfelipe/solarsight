import { runValidationAnalysis } from "@/lib/solar-calculator";
import { testSolarCalculatorEngine } from "@/__tests__/solar-calculator.test";
import { testRoofImageAnalysisEngine } from "@/__tests__/roof-image-analysis.test";
import { testGeminiApiIntegration } from "@/__tests__/gemini-api.test";

console.log("========================================================================");
console.log("1. EXECUÇÃO DOS TESTES UNITÁRIOS DO SISTEMA SOLARSIGHT");
console.log("========================================================================\n");

testSolarCalculatorEngine();
testRoofImageAnalysisEngine();
testGeminiApiIntegration();

console.log("\n========================================================================");
console.log("2. EXECUÇÃO DIRETA DO MÉTODO runValidationAnalysis() SOBRE validation-systems.json");
console.log("========================================================================\n");

const results = runValidationAnalysis();

results.forEach((sys) => {
  console.log(`Usina: ${sys.name}`);
  console.log(`  - Potência Instalada em JSON: ${sys.installedCapacityKwp} kWp`);
  console.log(`  - Geração Anual Real Medida: ${sys.measuredAnnualKwh.toLocaleString("pt-BR")} kWh`);
  console.log(`  - Geração Anual Simulada SolarSight: ${sys.simulatedAnnualKwh.toLocaleString("pt-BR")} kWh`);
  console.log(`  - Erro Percentual Médio (MAPE): ${sys.mapePercent}%`);
  console.log(`  - Erro Quadrático Médio (RMSE): ${sys.rmseKwh} kWh\n`);
});
console.log("========================================================================");
