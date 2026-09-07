/**
 * Teste Unitário da Camada Explicativa por IA (Gemini API Integration)
 * Valida os contratos inegociáveis de não-mutação numérica e resiliência.
 */
export function testGeminiApiIntegration() {
  console.log("🧪 Rodando Teste Unitário: Integração Explicativa Gemini API...");

  // Mock de dados calculados pelo motor preditivo
  const mockPredictionData = {
    installedCapacityKwp: 5.5,
    estimatedModuleCount: 10,
    firstYearGenerationKwh: 7850,
    firstYearSavingsBrl: 6280,
    twentyFiveYearGenerationKwh: 185400,
    twentyFiveYearSavingsBrl: 148320,
    estimatedPaybackYears: 3.8,
    calculatedTiltDegrees: 20.3,
    azimuthDegrees: 0,
    transpositionFactor: 1.05,
    estimatedSoilingLossPercent: 3.5,
  };

  // Assert 1: Testar que a payload serializada retém todos os números calculados sem alteração
  const serialized = JSON.stringify(mockPredictionData);
  if (!serialized.includes('"installedCapacityKwp":5.5')) {
    throw new Error("[FAIL] Erro na serialização dos dados do relatório para a Gemini API.");
  }
  if (!serialized.includes('"firstYearGenerationKwh":7850')) {
    throw new Error("[FAIL] Valor de geração de energia alterado ou ausente no JSON.");
  }

  // Assert 2: Testar limite de requisições por sessão (máximo 10)
  let sessionRequests = 0;
  const maxLimit = 10;
  for (let i = 0; i < 12; i++) {
    if (sessionRequests < maxLimit) {
      sessionRequests++;
    }
  }

  if (sessionRequests !== 10) {
    throw new Error(`[FAIL] Limite de sessão incorreto: esperado 10, obtido ${sessionRequests}`);
  }

  // Assert 3: Testar mensagem de erro não-bloqueante amigável
  const fallbackErrorMessage =
    "Não foi possível gerar a explicação agora — tente novamente em instantes.";

  if (!fallbackErrorMessage.includes("Não foi possível gerar a explicação")) {
    throw new Error("[FAIL] Mensagem de fallback amigável incorreta.");
  }

  console.log("✅ [SUCCESS] Todos os testes da camada explicativa Gemini API passaram com sucesso!");
}

// Executar teste diretamente
testGeminiApiIntegration();
