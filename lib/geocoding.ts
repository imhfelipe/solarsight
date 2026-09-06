/**
 * SolarSight - Geocoding Service (ViaCEP + OpenStreetMap Nominatim)
 * 
 * Requisito TCC: CEPs brasileiros primeiro consultam a ViaCEP para obter o endereço
 * completo (rua, bairro, cidade, UF) e depois o Nominatim para coordenadas exatas (lat/lon).
 * Endereços em texto livre consultam diretamente o Nominatim com limite de taxa (1s).
 */

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
  cep?: string;
}

// Timestamp da última requisição ao Nominatim para respeitar a política de rate limit da OSM Foundation (1 req/segundo)
let lastNominatimCallTime = 0;

async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastNominatimCallTime;
  if (timeSinceLastCall < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - timeSinceLastCall));
  }
  lastNominatimCallTime = Date.now();
}

export async function geocodeSearch(query: string): Promise<GeocodingResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error("Por favor, informe um CEP ou endereço válido.");
  }

  // Regex para CEP brasileiro: 29000-000 ou 29000000
  const cepRegex = /^(\d{5})-?(\d{3})$/;
  const cepMatch = cleanQuery.match(cepRegex);

  let searchAddress = cleanQuery;
  let viaCepData: { logradouro?: string; bairro?: string; localidade?: string; uf?: string; cep?: string } | null = null;

  if (cepMatch) {
    const formattedCep = `${cepMatch[1]}${cepMatch[2]}`;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${formattedCep}/json/`);
      if (response.ok) {
        const data = await response.json();
        if (!data.erro) {
          viaCepData = data;
          // Construir busca detalhada para o Nominatim
          searchAddress = `${data.logradouro || ""}, ${data.bairro || ""}, ${data.localidade || ""}, ${data.uf || ""}, Brasil`;
        }
      }
    } catch (e) {
      console.warn("Falha ao consultar ViaCEP, tentando Nominatim diretamente:", e);
    }
  }

  // Garantir rate-limit do Nominatim (1 req/s)
  await rateLimitDelay();

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&addressdetails=1`;

  const response = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": "SolarSight-TCC/1.0 (Engenharia da Computação UFES; contact@solarsight.ufes.br)",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error("Erro de comunicação com o serviço de geocodificação OSM.");
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    // Se a busca refinada falhou para CEP, tentar ao menos localidade + UF
    if (viaCepData?.localidade) {
      await rateLimitDelay();
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${viaCepData.localidade}, ${viaCepData.uf}, Brasil`)}&limit=1`;
      const fallbackResp = await fetch(fallbackUrl, {
        headers: { "User-Agent": "SolarSight-TCC/1.0" },
      });
      const fallbackResults = await fallbackResp.json();
      if (Array.isArray(fallbackResults) && fallbackResults.length > 0) {
        const item = fallbackResults[0];
        return {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: `${viaCepData.logradouro ? viaCepData.logradouro + ", " : ""}${viaCepData.localidade} - ${viaCepData.uf}`,
          city: viaCepData.localidade || "",
          state: viaCepData.uf || "",
          cep: viaCepData.cep,
        };
      }
    }
    throw new Error(`Endereço não localizado: "${query}". Verifique a digitação ou informe a cidade.`);
  }

  const first = results[0];
  const addr = first.address || {};

  return {
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    displayName: viaCepData?.logradouro
      ? `${viaCepData.logradouro}, ${viaCepData.bairro} - ${viaCepData.localidade}/${viaCepData.uf}`
      : first.display_name,
    street: viaCepData?.logradouro || addr.road || addr.pedestrian,
    neighborhood: viaCepData?.bairro || addr.suburb || addr.neighbourhood,
    city: viaCepData?.localidade || addr.city || addr.town || addr.municipality || "Vitória",
    state: viaCepData?.uf || addr.state || "ES",
    cep: viaCepData?.cep || addr.postcode,
  };
}
