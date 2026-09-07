import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json(
      {
        error:
          "Funcionalidade explicativa indisponível: GEMINI_API_KEY não foi configurada no servidor.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { promptType, userQuestion, predictionData, locationData, panelData } = body;

    if (!predictionData) {
      return NextResponse.json(
        { error: "Dados do relatório de previsão não fornecidos." },
        { status: 400 }
      );
    }

    // Build structured JSON summary of calculated metrics
    const reportSummary = {
      localizacao: {
        cidade: locationData?.city || "Vitória",
        estado: locationData?.state || "ES",
        latitude: locationData?.lat || -20.31,
        longitude: locationData?.lon || -40.31,
      },
      moduloFotovoltaico: {
        fabricante: panelData?.brand || "Tier-1",
        modelo: panelData?.model || "Painel Fotovoltaico",
        potenciaWp: panelData?.powerWp || 550,
        eficiencia: panelData?.efficiency ? `${(panelData.efficiency * 100).toFixed(1)}%` : "21.3%",
        quantidadePlacas: predictionData.estimatedModuleCount,
      },
      geradorFotovoltaico: {
        potenciaInstaladaKwp: predictionData.installedCapacityKwp,
        areaUtilTelhadoM2: predictionData.roofAreaM2 || "N/A",
        inclinacaoTiltGraus: predictionData.calculatedTiltDegrees,
        azimuteGraus: predictionData.azimuthDegrees,
        fatorTransposicaoKtrans: predictionData.transpositionFactor,
      },
      previsaoEnergia: {
        geracaoPrimeiroAnoKwh: predictionData.firstYearGenerationKwh,
        geracaoAcumulada25AnosMwh: Math.round((predictionData.twentyFiveYearGenerationKwh || 0) / 1000),
        perdaEstimadaSujeiraPercent: predictionData.estimatedSoilingLossPercent,
      },
      modeloFinanceiro: {
        economiaPrimeiroAnoBrl: predictionData.firstYearSavingsBrl,
        economiaAcumulada25AnosBrl: predictionData.twentyFiveYearSavingsBrl,
        paybackEstimadoAnos: predictionData.estimatedPaybackYears,
        regraTarifaria: "Lei 14.300/2022 (Fio B EDP-ES)",
      },
      geracaoMensal12Meses: predictionData.monthlyForecast?.map((m: any) => ({
        mes: m.monthName,
        geracaoFuturaKwh: m.idealMonthlyGenKwh,
        geracaoComSujeiraKwh: m.soilingMonthlyGenKwh,
        economiaEstimadaBrl: m.monthlySavingsBrl,
      })),
    };

    const systemInstruction = `Você é um assistente especializado que explica os resultados de um relatório preditivo de energia solar fotovoltaica para residências em Vitória - ES.

DIRETRIZES INEGOCIÁVEIS:
1. Use APENAS os números e dados fornecidos no JSON abaixo. NUNCA calcule, estime, invente ou altere nenhum valor (kWp, geração mensal em kWh, economia em R$, payback, K_trans, Tilt, etc.).
2. Todos os números do relatório são determinísticos e já calculados. Seu único papel é traduzi-los em linguagem explicativa clara e didática.
3. Se a pergunta do usuário solicitar uma métrica ou informação que não consta nos dados fornecidos, diga explicitamente que essa informação não está disponível no relatório.
4. Mantenha a resposta objetiva, didática e motivadora.

DADOS ESTRUTURADOS DO RELATÓRIO:
${JSON.stringify(reportSummary, null, 2)}`;

    let promptText = "";
    if (promptType === "summary") {
      promptText =
        "Instrução: Elabore uma explicação em linguagem simples e acessível para uma pessoa leiga, resumindo o desempenho do gerador solar, a economia estimada e como a produção se comporta ao longo dos meses do ano.";
    } else {
      promptText = `Pergunta do usuário: "${userQuestion || "Como interpretar os resultados deste relatório?"}"`;
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${systemInstruction}\n\n${promptText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    };

    // Call Gemini 2.0 Flash REST API endpoint (with fallback to 1.5 Flash)
    let apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    let response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status === 404) {
      // Fallback to gemini-1.5-flash if 2.0-flash model ID is unavailable
      apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      console.error("Gemini API HTTP Error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Não foi possível gerar a explicação agora — tente novamente em instantes." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const explanationText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!explanationText) {
      return NextResponse.json(
        { error: "Não foi possível gerar a explicação agora — tente novamente em instantes." },
        { status: 500 }
      );
    }

    return NextResponse.json({ explanation: explanationText });
  } catch (err) {
    console.error("Erro interno no handler /api/gemini:", err);
    return NextResponse.json(
      { error: "Não foi possível gerar a explicação agora — tente novamente em instantes." },
      { status: 500 }
    );
  }
}
