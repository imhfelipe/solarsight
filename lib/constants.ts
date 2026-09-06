/**
 * SolarSight - TCC Engenharia da Computação (FAESA - Centro Universitário)
 * Plataforma de Previsão de Geração Solar e Diagnóstico de Perdas Fotovoltaicas
 * 
 * NOTA ACADÊMICA PARA A BANCA FAESA:
 * Os modelos estatísticos e parâmetros de geometria solar foram ajustados para a 
 * Região Metropolitana de Vitória/ES (Latitude ~20.3°S), levando em consideração 
 * inclinação (tilt), azimute, irradiação incidente no plano do gerador (POA) e perdas por sujeira/maresia.
 */

// Instituição de Ensino
export const INSTITUTION_NAME = "FAESA - Centro Universitário";
export const TCC_TITLE = "SolarSight: Previsão de Geração & Diagnóstico Fotovoltaico";

// Limiares de Diagnóstico
export const NORMAL_DEVIATION_THRESHOLD = 0.05; // 5% tolerância operacional (IEC 61724)
export const SOILING_LOSS_THRESHOLD = 0.11; // 11% perda sustentada por sujidade/maresia
export const CLOUDINESS_CUTOFF_RATIO = 0.40; // 40% da irradiação mediana (filtro de nebulosidade)
export const SHADING_RECURRENCE_MIN_DAYS = 3; // Mínimo de 3 dias com queda pontual para sombreamento fixo
export const SHADING_DROP_THRESHOLD = 0.25; // 25% de queda horária abrupta

// Padrões de Geometria Solar para Vitória/ES
export const DEFAULT_TILT_DEGREES = 20; // Inclinação ideal próxima à latitude local (~20°)
export const DEFAULT_AZIMUTH_DEGREES = 0; // 0° = Norte (Orientação ideal no Hemisfério Sul)
export const DEFAULT_PERFORMANCE_RATIO = 0.80; // Performance Ratio padrão de 80%

// Localização padrão de fallback: FAESA Campus Monte Belo / Vitória - ES
export const DEFAULT_LOCATION = {
  lat: -20.311279122941556,
  lon: -40.31432813971878,
  displayName: "Campus FAESA - Av. Vitória, Monte Belo, Vitória - ES",
  city: "Vitória",
  state: "ES",
};

// Médias históricas mensais de irradiação global horizontal (GHI) em kWh/m²/dia para Vitória/ES (Fonte: LABREN / INPE / NASA)
export const VITORIA_MONTHLY_GHI_KWH_M2 = [
  5.85, // Jan
  6.10, // Fev
  5.40, // Mar
  4.75, // Abr
  4.15, // Mai
  3.80, // Jun
  3.95, // Jul
  4.50, // Ago
  4.85, // Set
  5.20, // Out
  5.50, // Nov
  5.70, // Dez
];

export const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
