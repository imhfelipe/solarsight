# ☀️ SolarSight — Plataforma Preditiva de Geração Fotovoltaica Residencial

**TCC — Engenharia da Computação | FAESA Centro Universitário (2026)**

> **Ferramenta preditiva para dimensionamento fotovoltaico e previsão de geração solar em telhados residenciais da Região Metropolitana de Vitória - ES, sem exigir a importação de arquivos CSV de inversores.**

---

## 🚀 Tecnologias & Stack
- **Framework**: Next.js 16 + React 19 (App Router)
- **Geoprocessamento**: Turf.js (`@turf/area`, `@turf/bearing`) sobre imagens *Esri World Imagery*
- **Modelo de Transposição**: Erbs (fração difusa) + Liu-Jordan (céu isotrópico)
- **Dados Climatológicos**: NASA POWER Climatology API (GHI mensal para Vitória/ES)
- **Marco Legal GD**: Lei 14.300/2022 + Regra tarifária de transição do Fio B EDP ES

---

## 📊 Módulo de Evidência Científica (Validação Empírica)

O modelo preditivo do SolarSight foi executado e validado estatisticamente contra dados de geração real monitorados em usinas fotovoltaicas registradas no Espírito Santo:

| Usina de Referência | Capacidade (kWp) | Geração Real (Ano) | Previsão SolarSight | MAPE (Erro %) | RMSE (kWh) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Usina FAESA (Vitória/ES)** | 15.4 kWp | 21.710 kWh | 22.485,1 kWh | **4,45%** | **84,3 kWh** |
| **Usina GD Comercial (Serra/ES)** | 52.2 kWp | 73.660 kWh | 76.142,5 kWh | **4,37%** | **281,7 kWh** |

---

## 📐 Premissas & Limitações do Modelo

1. **Geração Derivada por kWp**: A geração mensal é calculada a partir da capacidade instalada efetiva ($E = \text{kWp} \times H_{\text{POA}} \times \text{PR} \times N_{\text{dias}}$), garantindo rastreabilidade dimensional limpa.
2. **Propagação de Sujeira/Maresia**: A geração líquida (`soilingMonthlyGenKwh`) com perda sustentada de $3,5\%$ (ambiente costeiro) alimenta diretamente a economia do 1º ano, as projeções financeiras de 25 anos e o cálculo do *payback*.
3. **Índice de Limpidez Fixo ($K_T = 0,58$)**: O índice de transparência atmosférica é assumido constante para a área urbana de Vitória/ES.
4. **Fator $R_b$ ao Meio-Dia Solar**: O fator de transposição da componente direta utiliza o ângulo de incidência solar ao meio-dia como heurística direcional consistente.

---

## 💻 Execução Local

```bash
# 1. Clonar o repositório
git clone https://github.com/imhfelipe/solarsight.git
cd solarsight

# 2. Instalar dependências
npm install

# 3. Executar testes unitários
npx tsx __tests__/solar-calculator.test.ts

# 4. Iniciar servidor de desenvolvimento
npm run dev

# 5. Compilar build de produção
npm run build
```

---

## 🌐 Deploy na Nuvem

- **Aplicação Online**: [https://solarsight-chi.vercel.app](https://solarsight-chi.vercel.app)
- **Hospedagem**: Vercel (Produção contínua)
