import { computeGeometricFallback } from "../lib/roof-image-analysis";
import { isWebAssemblySupported } from "../lib/opencv-loader";

/**
 * Teste Unitário do Módulo de Análise de Imagem do Telhado & Cumeeira
 * Valida a heurística geométrica de fallback, os rumos de azimute candidatos
 * e a verificação de suporte ao WebAssembly.
 */
export function testRoofImageAnalysisEngine() {
  console.log("🧪 Rodando Teste Unitário: Análise de Imagem & Fallback de Cumeeira...");

  // Coordenadas de um telhado retangular em Vitória-ES orientados Leste-Oeste
  // P1: [-40.312, -20.315], P2: [-40.310, -20.315], P3: [-40.310, -20.316], P4: [-40.312, -20.316]
  const rectangularRoofCoords: [number, number][] = [
    [-40.312, -20.315],
    [-40.310, -20.315],
    [-40.310, -20.316],
    [-40.312, -20.316],
    [-40.312, -20.315],
  ];

  const fallbackResult = computeGeometricFallback(rectangularRoofCoords);

  // Assert 1: O método retornado deve ser 'geometric'
  if (fallbackResult.method !== "geometric") {
    throw new Error(`[FAIL] Esperado método 'geometric', obtido ${fallbackResult.method}`);
  }

  // Assert 2: Devem existir exatamente 2 candidatos a azimute (Face A / Face B)
  if (!fallbackResult.candidateAzimuths || fallbackResult.candidateAzimuths.length !== 2) {
    throw new Error(`[FAIL] Candidatos a azimute devem ser 2 valores, obtido ${fallbackResult.candidateAzimuths}`);
  }

  // Assert 3: As duas faces devem ser opostas (diferença de 180°)
  const [faceA, faceB] = fallbackResult.candidateAzimuths;
  const diffAzim = Math.abs((faceA - faceB + 360) % 360);
  if (diffAzim !== 180) {
    throw new Error(`[FAIL] As duas faces sugeridas devem ser opostas em 180°. Face A: ${faceA}°, Face B: ${faceB}°`);
  }

  // Assert 4: Os azimutes devem estar no intervalo [0, 359]
  if (faceA < 0 || faceA >= 360 || faceB < 0 || faceB >= 360) {
    throw new Error(`[FAIL] Azimutes fora do intervalo [0, 359]: ${faceA}°, ${faceB}°`);
  }

  // Assert 5: A linha de cumeeira calculada deve ter 2 pontos [lat, lng]
  if (!fallbackResult.ridgeLinePoints || fallbackResult.ridgeLinePoints.length !== 2) {
    throw new Error(`[FAIL] Pontos da cumeeira devem conter 2 pontos LatLng.`);
  }

  // Assert 6: Testar função de suporte a WebAssembly
  const isWasm = isWebAssemblySupported();
  if (typeof isWasm !== "boolean") {
    throw new Error(`[FAIL] isWebAssemblySupported() deve retornar boolean.`);
  }

  console.log("✅ [SUCCESS] Todos os testes unitários do módulo de cumeeira passaram com sucesso!");
}

// Executar teste diretamente
testRoofImageAnalysisEngine();
