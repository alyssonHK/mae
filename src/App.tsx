import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_CITY = 'Joinville, Santa Catarina - Brasil';

const BRAZILIAN_STATE_ALIASES: Record<string, string> = {
  AC: 'AC',
  ACRE: 'AC',
  AL: 'AL',
  ALAGOAS: 'AL',
  AP: 'AP',
  AMAPA: 'AP',
  AM: 'AM',
  AMAZONAS: 'AM',
  BA: 'BA',
  BAHIA: 'BA',
  CE: 'CE',
  CEARA: 'CE',
  DF: 'DF',
  'DISTRITO FEDERAL': 'DF',
  ES: 'ES',
  'ESPIRITO SANTO': 'ES',
  GO: 'GO',
  GOIAS: 'GO',
  MA: 'MA',
  MARANHAO: 'MA',
  MT: 'MT',
  'MATO GROSSO': 'MT',
  MS: 'MS',
  'MATO GROSSO DO SUL': 'MS',
  MG: 'MG',
  'MINAS GERAIS': 'MG',
  PA: 'PA',
  PARA: 'PA',
  PB: 'PB',
  PARAIBA: 'PB',
  PR: 'PR',
  PARANA: 'PR',
  PE: 'PE',
  PERNAMBUCO: 'PE',
  PI: 'PI',
  PIAUI: 'PI',
  RJ: 'RJ',
  'RIO DE JANEIRO': 'RJ',
  RN: 'RN',
  'RIO GRANDE DO NORTE': 'RN',
  RS: 'RS',
  'RIO GRANDE DO SUL': 'RS',
  RO: 'RO',
  RONDONIA: 'RO',
  RR: 'RR',
  RORAIMA: 'RR',
  SC: 'SC',
  'SANTA CATARINA': 'SC',
  SP: 'SP',
  'SAO PAULO': 'SP',
  SE: 'SE',
  SERGIPE: 'SE',
  TO: 'TO',
  TOCANTINS: 'TO',
};

const COUNTRY_ALIASES: Record<string, string> = {
  BR: 'BR',
  BRA: 'BR',
  BRAZIL: 'BR',
  BRASIL: 'BR',
  EUA: 'US',
  USA: 'US',
  'ESTADOS UNIDOS': 'US',
  'UNITED STATES': 'US',
};

type NewsItem = {
  id: string;
  title: string;
  url: string;
  author: string;
};

type RecipeData = {
  name: string;
  category?: string;
  origin?: string;
  instructions: string;
  image: string;
  ingredients: Array<{ name: string; measure: string; isHeading?: boolean }>;
  source?: string;
  youtube?: string;
};

type WeatherData = {
  location: string;
  region?: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  wind: string;
  sunrise?: string;
  sunset?: string;
};

type VerseData = {
  reference: string;
  text: string;
  translation: string;
};

type AfroditeSection = {
  nome?: string | null;
  conteudo?: string[] | null;
};

type AfroditeRecipeSource = {
  nome: string;
  secao?: AfroditeSection[] | null;
};


const RECIPE_ERROR_MESSAGE = 'Nao foi possivel carregar a receita.';
const AFRODITE_ENDPOINT = 'https://raw.githubusercontent.com/adrianosferreira/afrodite.json/master/afrodite.json';
const RECIPE_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70';

let cachedAfroditeRecipes: AfroditeRecipeSource[] | null = null;

const MOTHER_TITLES = [
  'Jurássica',
  'Matusalém',
  'Peça de Museu',
  'Relíquia Ambulante',
  'Do tempo do guaraná com rolha',
  'Edição de Colecionador',
  'Coroa',
  'Testemunha da Invenção da Roda',
  'Sabe-tudo da Wikipédia',
  'Dinossaura',
  'PHD em Novela das Oito',
  'Clássica',
  'Vintage',
  'Ex-jovem',
  'Jovem há mais tempo',
  'Vivida (e revivida)',
  'Rainha do Crochê',
  'Fóssil em Formol',
  'Viu o Mar Vermelho se abrir',
  'Patrimônio Histórico',
  'Especialista em Remédio Caseiro',
  'Do tempo do epa',
  'Cheia de juventude acumulada',
  'Sabe mais que o Google',
  'Direto do Arco-da-Velha',
  'Arquivo Vivo da Humanidade',
  'Fonte inesgotável de "no meu tempo..."',
  'Mestra em tricô nivel Jedi',
  'Quando nasceu, a Kodak ainda era startup',
  'Modelo de capa da revista "Sabedoria"',
  'Pré-Histórica',
  'Testemunha da primeira pisada do homem... na Terra',
  'Véia',
  'Mãe',
  'Dona Luiza',
  'Vó',
  'Tia Luiza',
  'Bruxa',
  'Contemporânea de Cabral',
  'Nokia antigo', 
  'Tem mais rugas que mapa rodoviário', 
  'Fundadora do INSS', 
  'Manual de instruções ambulante', 
  'Aposentada pela Arca de Noé', 
  'Backup em fita cassete', 
  'Inoxidável', 
  'Recebe aposentadoria em réis'

];

function isRecipeErrorMessage(message: string): boolean {
  return message === RECIPE_ERROR_MESSAGE || message.toLowerCase().includes('receita');
}




const FALLBACK_VERSES: VerseData[] = [
  {
    reference: 'Salmos 118:24',
    text: 'Este e o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.',
    translation: 'ARA',
  },
  {
    reference: 'Lamentacoes 3:22-23',
    text: 'As misericordias do Senhor sao a causa de nao sermos consumidos; renovam-se a cada manha.',
    translation: 'ARA',
  },
  {
    reference: 'Isaias 41:10',
    text: 'Nao temas, porque eu sou contigo; nao te assombres, porque eu sou o teu Deus.',
    translation: 'ARA',
  },
  {
    reference: 'Filipenses 4:13',
    text: 'Tudo posso naquele que me fortalece.',
    translation: 'ARA',
  },
  {
    reference: 'Proverbios 3:5-6',
    text: 'Confia no Senhor de todo o teu coracao e nao te estribes no teu proprio entendimento.',
    translation: 'ARA',
  },
  {
    reference: 'Mateus 6:33',
    text: 'Buscai primeiro o Reino de Deus e a sua justica, e todas estas coisas vos serao acrescentadas.',
    translation: 'ARA',
  },
  {
    reference: 'Josue 1:9',
    text: 'Se forte e corajoso; nao temas, porque o Senhor teu Deus esta contigo.',
    translation: 'ARA',
  },
];

function getFallbackVerse(): VerseData {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % FALLBACK_VERSES.length;
  return FALLBACK_VERSES[index];
}

function toCardinalDirection(degrees?: number): string | null {
  if (typeof degrees !== 'number' || Number.isNaN(degrees)) {
    return null;
  }
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % directions.length;
  return directions[index];
}

function formatUnixTime(timestamp?: number): string | undefined {
  if (!timestamp) {
    return undefined;
  }
  return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeAliasToken(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/s+/g, ' ')
    .trim();
}

function formatStateDisplay(rawValue: string, stateCode: string): string {
  const trimmed = rawValue.trim();
  if (trimmed.length <= 3) {
    return stateCode;
  }
  return titleCase(trimmed);
}

function formatCountryDisplay(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (trimmed.length <= 3) {
    return trimmed.toUpperCase();
  }
  return titleCase(trimmed);
}

function normalizeCityInput(raw: string): { display: string; query: string } {
  const cleanedValue = raw.trim() || DEFAULT_CITY;
  const tokens = cleanedValue
    .split(/[,|-]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const cityName = titleCase(tokens[0] ?? DEFAULT_CITY);

  const rawSecond = tokens[1];
  const secondKey = normalizeAliasToken(rawSecond);
  let stateCode: string | undefined;
  let stateDisplay: string | undefined;
  let countryCode: string | undefined;
  let countryDisplay: string | undefined;

  if (secondKey) {
    const aliasState = BRAZILIAN_STATE_ALIASES[secondKey];
    if (aliasState) {
      stateCode = aliasState;
      stateDisplay = rawSecond ? formatStateDisplay(rawSecond, aliasState) : aliasState;
    } else {
      countryCode = COUNTRY_ALIASES[secondKey] ?? secondKey;
      if (rawSecond) {
        countryDisplay = formatCountryDisplay(rawSecond);
      }
    }
  }

  const rawThird = tokens[2];
  if (rawThird) {
    const thirdKey = normalizeAliasToken(rawThird);
    if (thirdKey) {
      countryCode = COUNTRY_ALIASES[thirdKey] ?? thirdKey;
    }
    countryDisplay = formatCountryDisplay(rawThird);
  }

  // Heurísticas: tentar recuperar casos com erros de digitação ou fragmentos
  // Ex: "Anta catarina" -> normaliza para 'ANTA CATARINA' (contém 'CATARINA')
  //      "Bra II" -> contém 'BRA' e deve mapear para BR
  try {
    const secondKeySafe = (secondKey || '').toUpperCase();
    const thirdKeySafe = (rawThird && normalizeAliasToken(rawThird)) || '';
    // detectar menção a 'CATARINA' no segundo token
    if (!stateCode && secondKeySafe.includes('CATARINA')) {
      stateCode = 'SC';
      stateDisplay = rawSecond ? formatStateDisplay(rawSecond, stateCode) : stateCode;
    }
    // detectar possdivel mencao a Brasil em qualquer token (ex: 'BRA', 'BRASIL', 'BRA II')
    if (!countryCode) {
      const anyKey = `${secondKey || ''} ${thirdKeySafe}`.toUpperCase();
      if (anyKey.includes(' BRA') || anyKey.startsWith('BRA') || anyKey.includes('BRASIL') || anyKey.includes('BRAZIL')) {
        countryCode = 'BR';
        countryDisplay = 'Brasil';
      }
    }
  } catch (e) {
    // falha da heurdica n e3o bloqueia o fluxo
  }

  if (!countryCode && stateCode) {
    countryCode = 'BR';
  }

  if (!countryCode && !stateCode && tokens.length <= 1) {
    countryCode = 'BR';
  }

  const displayParts = [cityName];
  if (stateDisplay) {
    displayParts.push(stateDisplay);
  }
  if (countryDisplay && (!stateDisplay || tokens.length >= 3 || !stateCode)) {
    displayParts.push(countryDisplay);
  }

  const queryParts = [cityName];
  if (stateCode) {
    queryParts.push(stateCode);
  }
  if (countryCode) {
    queryParts.push(countryCode);
  }

  return {
    display: displayParts.join(', '),
    query: queryParts.join(', '),
  };
}

async function fetchNews(): Promise<NewsItem[]> {
  const params = new URLSearchParams({
    q: 'brasil',
    language: 'pt',
    sortBy: 'publishedAt',
    pageSize: '5',
    searchIn: 'title,description',
    domains: 'g1.globo.com,terra.com.br,uol.com.br,folha.uol.com.br,oglobo.globo.com,estadao.com.br',
  });

  // Em desenvolvimento Vite serve arquivos em /api/* como estáticos (não executa funções),
  // o que faz a rota retornar o conteúdo do arquivo JS em vez de JSON (causando o erro de parse).
  // Logo, quando em DEV, faça a chamada direta ao NewsAPI usando a chave VITE_NEWSAPI_KEY.
  const isDev = Boolean(import.meta.env && import.meta.env.DEV);
  let response: Response;
  if (isDev) {
    const apiKey = import.meta.env.VITE_NEWSAPI_KEY as string | undefined;
    if (!apiKey) throw new Error('Configure sua chave do NewsAPI em .env (VITE_NEWSAPI_KEY)');
    response = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`, {
      headers: { 'X-Api-Key': apiKey },
    });
  } else {
    response = await fetch(`/api/news?${params.toString()}`);
  }

  if (!response.ok) {
    // tentar extrair detalhe do corpo (JSON) se possível
    try {
      const errJson = await response.json();
      const msg = errJson?.message || errJson?.error || JSON.stringify(errJson);
      throw new Error(String(msg) || 'Falha ao carregar noticias');
    } catch (e) {
      throw new Error('Falha ao carregar noticias');
    }
  }

  type NewsApiArticle = {
    title?: string | null;
    description?: string | null;
    url?: string | null;
    author?: string | null;
    source?: { id?: string | null; name?: string | null };
  };

  type NewsApiResponse = {
    status: 'ok' | 'error';
    totalResults?: number;
    articles?: NewsApiArticle[];
    code?: string;
    message?: string;
  };

  const data = (await response.json()) as NewsApiResponse;
  if (data.status !== 'ok' || !data.articles) {
    throw new Error(data.message ?? 'Dados de noticias indisponiveis');
  }

  const articles = data.articles
    .map((article, index) => {
      const title = (article.title ?? article.description ?? '').trim() || 'Sem titulo';
      const url = article.url ?? '';
      const source = article.source?.name ?? article.author ?? 'Fonte desconhecida';
      const id = article.url ?? article.source?.id ?? `news-${index}`;

      return {
        id,
        title,
        url,
        author: source,
      } satisfies NewsItem;
    })
    .filter((item) => Boolean(item.title) && Boolean(item.url));

  if (articles.length === 0) {
    throw new Error('Nenhuma manchete encontrada no momento');
  }

  return articles;
}

export async function loadAfroditeRecipes(): Promise<AfroditeRecipeSource[]> {
  if (cachedAfroditeRecipes && cachedAfroditeRecipes.length > 0) {
    return cachedAfroditeRecipes;
  }
  const response = await fetch(AFRODITE_ENDPOINT);
  if (!response.ok) {
    throw new Error('Falha ao carregar receitas');
  }
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhuma receita disponivel');
  }
  cachedAfroditeRecipes = data as AfroditeRecipeSource[];
  return cachedAfroditeRecipes;
}

function sanitizeAfroditeLine(value?: string | null): string {
  if (!value) {
    return '';
  }
  // Normaliza Unicode (NFC) para reduzir problemas com caracteres compostos
  try {
    // Nem todos os ambientes precisam, mas é seguro tentar.
    // @ts-ignore
    if (typeof value.normalize === 'function') value = value.normalize('NFC');
  } catch (e) {
    // ignore
  }
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function splitMergedAfroditeSegments(text: string): string[] {
  if (!text) {
    return [];
  }
  // Heurísticas para separar trechos concatenados sem quebra:
  // - mudança de camelCase / sentença (minúscula seguido de maiúscula)
  // - transição para número de passo explícito (ex: "2 -" ou "2.")
  // - transição para lista com numeral colado
  const segments: string[] = [];
  let buffer = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    buffer += char;

    const nextIsDigit = next !== undefined && /\d/.test(next);
    const charIsDigit = /\d/.test(char);
    // Mais estrito: considere boundary por dígito apenas quando o texto a partir
    // do próximo caractere começa com um padrão de passo numerado (ex: "2.", "2 -", "2)")
    const remainder = text.slice(i + 1);
    const startsNumericStep = /^\d+\s*[-\.)]/.test(remainder);
    const isBoundaryByDigit = nextIsDigit && !charIsDigit && startsNumericStep;

    const nextIsUpper = next !== undefined && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ]/.test(next);
    const charIsLower = /[a-záéíóúãõâêîôû)]/.test(char);
    const isBoundaryByCase = nextIsUpper && charIsLower;

    // also consider punctuation followed by uppercase word (e.g. ".Depois")
  const isPunctThenUpper = /[\.\-–—:,;()]$/.test(char) && nextIsUpper;

    if (isBoundaryByDigit || isBoundaryByCase || isPunctThenUpper) {
      segments.push(buffer.trim());
      buffer = '';
    }
  }
  if (buffer.trim()) segments.push(buffer.trim());
  // As entradas frequentemente contêm frases longas; garanta que cada segmento
  // comece com letra maiúscula ou número para melhorar resultados a jusante.
  return segments
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function splitAfroditeEntries(lines?: (string | null)[]): string[] {
  if (!lines) {
    return [];
  }
  const entries: string[] = [];
  for (const raw of lines) {
    const sanitized = sanitizeAfroditeLine(raw);
    if (!sanitized) {
      continue;
    }
    // Preserve explicit newlines as potential step separators, but also attempt
    // to split merged segments inside each line.
    const parts = sanitized.split(/\r?\n+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      // Se a linha inteira parecer um cabeçalho em MAIÚSCULAS, preserve-a
      const isAllUpper = /^[\sA-ZÁÉÍÓÚÃÕÂÊÎÔÛ0-9\-–—]+$/.test(trimmed) && trimmed.length <= 80;
      if (isAllUpper) {
        entries.push(trimmed);
        continue;
      }

      const segments = splitMergedAfroditeSegments(trimmed);
      if (segments.length > 1) {
        entries.push(...segments);
        continue;
      }

      // ainda tenta separar por padrões de passo numerado colados, mas de forma
      // mais estrita (apenas quando a linha começa com o padrão de passo)
      if (/^\s*\d+\s*[-\.)]/.test(trimmed)) {
        const numericParts = trimmed.split(/(?=^\s*\d+\s*[-\.)])/m).map((s) => s.trim()).filter(Boolean);
        if (numericParts.length > 1) {
          entries.push(...numericParts);
          continue;
        }
      }

      entries.push(trimmed);
    }
  }
  return entries.filter(Boolean);
}

function normalizeInstruction(line: string): string {
  const cleaned = sanitizeAfroditeLine(line).replace(/^\d+\s*[-–.)]?\s*/, '');
  return cleaned;
}

export function mapAfroditeRecipe(recipe: AfroditeRecipeSource): RecipeData {
  const sections = recipe.secao ?? [];
  const ingredientsSection = sections.find((section) => (section.nome ?? '').toLowerCase().includes('ingrediente'));
  const instructionsSection = sections.find((section) => (section.nome ?? '').toLowerCase().includes('modo'));

  const ingredientsLines = splitAfroditeEntries(ingredientsSection?.conteudo ?? []);
  const instructionLinesRaw = splitAfroditeEntries(instructionsSection?.conteudo ?? []);

  const ingredients = ingredientsLines
    .map((line) => {
      const sanitized = sanitizeAfroditeLine(line);
      if (!sanitized) {
        return null;
      }
      const isHeading = /^[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ\s]+$/.test(sanitized) && sanitized.length <= 50;
      return {
        name: sanitized,
        measure: '',
        isHeading,
      };
    })
    .filter((item): item is { name: string; measure: string; isHeading: boolean } => item !== null);

  const instructionLines = instructionLinesRaw
    .map((line) => {
      const sanitized = sanitizeAfroditeLine(line);
      if (!sanitized) {
        return null;
      }
      if (/^[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ\s]+$/.test(sanitized) && sanitized.length <= 60) {
        return sanitized;
      }
      return normalizeInstruction(sanitized);
    })
    .filter((line): line is string => Boolean(line));

  return {
    name: sanitizeAfroditeLine(recipe.nome) || 'Receita sem titulo',
    category: undefined,
    origin: undefined,
    instructions: instructionLines.join('\n') || 'Modo de preparo indisponivel.',
    image: RECIPE_PLACEHOLDER_IMAGE,
  ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Ingredientes indisponiveis.', measure: '', isHeading: false }],
    source: undefined,
    youtube: undefined,
  } satisfies RecipeData;
}

// Tradução: tenta usar VITE_TRANSLATE_API_URL (se configurado) ou fallback para
// https://libretranslate.de/translate. Se a tradução falhar, retorna o texto original.




function mapMealToRecipe(meal: any): RecipeData {
  // Extrai ingredientes/medidas do formato TheMealDB (até 20 pares)
  const ingredients: Array<{ name: string; measure: string; isHeading?: boolean }> = [];
  for (let i = 1; i <= 20; i += 1) {
    const ing = (meal[`strIngredient${i}`] ?? '') as string;
    const measure = (meal[`strMeasure${i}`] ?? '') as string;
    if (ing && ing.trim()) {
      ingredients.push({ name: ing.trim(), measure: (measure || '').trim(), isHeading: false });
    }
  }

  return {
    name: (meal.strMeal as string) || 'Receita sem titulo',
    category: meal.strCategory || undefined,
    origin: meal.strArea || undefined,
    instructions: (meal.strInstructions as string) || 'Modo de preparo indisponivel.',
    image: meal.strMealThumb || RECIPE_PLACEHOLDER_IMAGE,
    ingredients,
    source: undefined,
    youtube: meal.strYoutube || undefined,
  } satisfies RecipeData;
}

async function fetchRecipe(): Promise<RecipeData> {
  // Use local translated_meals.json (arquivo está em public/) e escolha uma receita aleatória
  try {
    const res = await fetch('/translated_meals.json');
    if (!res.ok) {
      throw new Error('Falha ao carregar receitas locais');
    }
    const data = await res.json();
    const meals = Array.isArray(data.meals) ? data.meals : [];
    if (meals.length === 0) throw new Error('Nenhuma receita disponivel no arquivo local');

    const randomIndex = Math.floor(Math.random() * meals.length);
    const meal = meals[randomIndex];
    if (!meal) throw new Error('Receita aleatoria invalida');

    // Mapear o formato TheMealDB para RecipeData sem tradução
    const mapped = mapMealToRecipe(meal);
    return mapped;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Erro ao carregar receita');
  }
}

async function fetchWeather(city: string): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('Configure sua chave do OpenWeather em .env');
  }

  const normalized = normalizeCityInput(city);
  const geoParams = new URLSearchParams({
    q: normalized.query,
    limit: '1',
    appid: apiKey,
  });
  const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?${geoParams.toString()}`);
  if (!geoResponse.ok) {
    throw new Error('Nao conseguimos localizar a cidade no OpenWeather');
  }
  type GeoResponseItem = {
    name?: string;
    state?: string;
    country?: string;
    lat: number;
    lon: number;
  };
  const geoArray = (await geoResponse.json()) as GeoResponseItem[];
  if (!Array.isArray(geoArray) || geoArray.length === 0) {
    throw new Error('Nao encontramos essa cidade no OpenWeather');
  }

  // Tentar escolher o candidato que mais se aproxima da intenção do usuário
  // Extraia possíveis state/country da query normalizada (ex: "Joinville, SC, BR")
  const queryParts = normalized.query.split(',').map((s) => s.trim()).filter(Boolean);
  const desiredState = queryParts.length >= 2 ? normalizeAliasToken(queryParts[1]) : undefined;
  const desiredCountry = queryParts.length >= 3 ? normalizeAliasToken(queryParts[2]) : undefined;

  let geoData: GeoResponseItem | undefined;
  if (desiredCountry) {
    geoData = geoArray.find((g) => (g.country ?? '').toUpperCase() === desiredCountry.toUpperCase());
  }
  if (!geoData && desiredState) {
    geoData = geoArray.find((g) => {
      const gs = (g.state ?? '').toUpperCase();
      return gs.includes((desiredState ?? '').toUpperCase());
    });
  }
  // fallback: prefer BR if present
  if (!geoData) {
    geoData = geoArray.find((g) => (g.country ?? '').toUpperCase() === 'BR');
  }
  // último recurso: primeiro retorno
  if (!geoData) geoData = geoArray[0];

  if (!geoData || typeof geoData.lat !== 'number' || typeof geoData.lon !== 'number') {
    throw new Error('Nao encontramos essa cidade no OpenWeather');
  }
  const weatherParams = new URLSearchParams({
    lat: geoData.lat.toString(),
    lon: geoData.lon.toString(),
    units: 'metric',
    lang: 'pt_br',
    appid: apiKey,
  });
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${weatherParams.toString()}`);
  if (!response.ok) {
    throw new Error('Falha ao carregar clima no OpenWeather');
  }
  type OpenWeatherResponse = {
    weather?: Array<{ description?: string }>;
    main?: {
      temp?: number;
      feels_like?: number;
      humidity?: number;
    };
    wind?: {
      speed?: number;
      deg?: number;
    };
    sys?: {
      sunrise?: number;
      sunset?: number;
    };
  };
  const data = (await response.json()) as OpenWeatherResponse;
  if (!data.main || typeof data.main.temp !== 'number') {
    throw new Error('Dados de clima indisponiveis');
  }
  const temperature = data.main.temp;
  const feelsLike = data.main.feels_like ?? temperature;
  const humidity = Math.round(data.main.humidity ?? 0);
  const rawCondition = data.weather?.[0]?.description ?? 'condicao desconhecida';
  const condition = rawCondition.charAt(0).toUpperCase() + rawCondition.slice(1);
  const windSpeedMs = data.wind?.speed ?? 0;
  const windSpeedKmh = windSpeedMs * 3.6;
  const windDirection = toCardinalDirection(data.wind?.deg);
  const wind = windSpeedKmh
    ? `${Math.round(windSpeedKmh)} km/h${windDirection ? ` ${windDirection}` : ''}`
    : '--';

  const fallbackParts = normalized.display.split(',').map((part) => part.trim());
  const locationParts = [geoData.name ?? fallbackParts[0] ?? normalized.display];
  const geoState = geoData.state ?? fallbackParts[1];
  if (geoState) {
    locationParts.push(geoState);
  }

  return {
    location: locationParts.join(', '),
    region: geoData.country ?? fallbackParts[2],
    temperature,
    feelsLike,
    condition,
    humidity,
    wind,
    sunrise: formatUnixTime(data.sys?.sunrise),
    sunset: formatUnixTime(data.sys?.sunset),
  };
}
async function fetchBibleVerse(): Promise<VerseData> {
  // Preferir o JSON ACF hospedado no repositório (mais controle e offline-friendly)
  const ACF_URL = 'https://raw.githubusercontent.com/thiagobodruk/biblia/refs/heads/master/json/acf.json';
  // cache em runtime para não baixar toda vez
  // @ts-ignore - global cache var local ao módulo
  if (!(globalThis as any)._acf_cache) {
    try {
      const res = await fetch(ACF_URL);
      if (res.ok) {
        const data = await res.json();
        // estrutura: array de livros { name, abbrev, chapters: [ [verses...] ] }
        (globalThis as any)._acf_cache = Array.isArray(data) ? data : null;
      } else {
        (globalThis as any)._acf_cache = null;
      }
    } catch (e) {
      (globalThis as any)._acf_cache = null;
    }
  }

  const acf = (globalThis as any)._acf_cache as any[] | null;
  if (acf && acf.length > 0) {
    try {
      // escolher um livro aleatorio, capitulo aleatorio e versiculo aleatorio
      const book = acf[Math.floor(Math.random() * acf.length)];
      if (!book || !Array.isArray(book.chapters) || book.chapters.length === 0) {
        throw new Error('Estrutura do ACF invalida');
      }
      const chapterIndex = Math.floor(Math.random() * book.chapters.length);
      const chapter = book.chapters[chapterIndex];
      if (!Array.isArray(chapter) || chapter.length === 0) {
        throw new Error('Capitulo vazio');
      }
      const verseIndex = Math.floor(Math.random() * chapter.length);
      const verseTextRaw = chapter[verseIndex] as string;
      const cleanedText = (verseTextRaw ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      const bookName = book.name ?? book.abbrev ?? 'Livro';
      const reference = `${bookName} ${chapterIndex + 1}:${verseIndex + 1}`;
      return {
        reference,
        text: cleanedText || 'Versiculo indisponivel.',
        translation: 'ACF',
      } satisfies VerseData;
    } catch (e) {
      // se falhar, seguir para o fallback abaixo
    }
  }

  // fallback para bible-api existente
  try {
    const response = await fetch('https://bible-api.com/?random=verse&translation=almeida');
    if (!response.ok) {
      throw new Error('Falha ao carregar versiculo');
    }
    type VerseResponse = {
      reference?: string;
      text?: string;
      translation_name?: string;
    };
    const data = (await response.json()) as VerseResponse;
    const cleanedText = data.text?.replace(/[\r\n]+/g, ' ').replace(/\?{2,}/g, '').trim();
    if (!cleanedText) {
      throw new Error('Versiculo vazio');
    }
    return {
      reference: data.reference ?? 'Versiculo do dia',
      text: cleanedText,
      translation: data.translation_name ?? 'Almeida',
    } satisfies VerseData;
  } catch (error) {
    return getFallbackVerse();
  }
}

function formatInstructions(text: string): string[] {
  if (!text) return [];
  // Primeiro, separe por quebras de linha explícitas
  const byLines = text.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean);
  const segments: string[] = [];
  for (const line of byLines) {
    // Se a linha começa com passos numerados explícitos, divida por esse padrão
    if (/^\s*\d+\s*[-\.)]/.test(line)) {
      const numericParts = line.split(/(?=^\s*\d+\s*[-\.)])/m).map((s) => s.trim()).filter(Boolean);
      for (const part of numericParts) {
        const cleaned = part.replace(/^[0-9]+\s*[-–.)]?\s*/, '').replace(/^\./, '').trim();
        if (cleaned) segments.push(cleaned);
      }
      continue;
    }

    // Caso comum: frases longas com pontos. Divida por ponto seguido de maiúscula.
    const dotParts = line.split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/).map((s) => s.trim()).filter(Boolean);
    for (const p of dotParts) {
      const cleaned = p.replace(/^[0-9]+\s*[-–.)]?\s*/, '').replace(/^\./, '').trim();
      if (cleaned) segments.push(cleaned);
    }
  }
  return segments;
}

// Exports para uso em testes locais (não altera comportamento do app)
export { splitMergedAfroditeSegments, splitAfroditeEntries, formatInstructions };
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}


const App = () => {
  const randomMotherTitle = useMemo(() => {
    const idx = Math.floor(Math.random() * MOTHER_TITLES.length);
    return MOTHER_TITLES[idx] ?? 'Mãe';
  }, []);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [inputCity, setInputCity] = useState(DEFAULT_CITY);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [isRecipeExpanded, setIsRecipeExpanded] = useState(false);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const requestIdRef = useRef(0);

  const openSettings = useCallback(() => {
    try {
      // ao abrir, normalize o valor atual do input para uma forma mais limpa
      setInputCity((prev) => normalizeCityInput(prev).display);
    } catch (e) {
      // se algo falhar, apenas abra o modal com o valor atual
    }
    setIsSettingsOpen(true);
  }, []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const toggleRecipeExpanded = useCallback(() => setIsRecipeExpanded((prev) => !prev), []);

  useEffect(() => {
    setIsRecipeExpanded(false);
  }, [recipe?.name]);

  const refreshRecipe = useCallback(async () => {
    setRecipeLoading(true);
    try {
      const newRecipe = await fetchRecipe();
      setRecipe(newRecipe);
      setIsRecipeExpanded(false);
      setErrors((prev) => prev.filter((message) => !isRecipeErrorMessage(message)));
    } catch (error) {
      console.error('Erro ao sortear receita', error);
      const message = getErrorMessage(error, RECIPE_ERROR_MESSAGE);
      setErrors((prev) => (prev.includes(message) ? prev : [...prev.filter((item) => !isRecipeErrorMessage(item)), message]));
    } finally {
      setRecipeLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async (targetCity: string) => {
    const { display } = normalizeCityInput(targetCity);
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setInputCity(display);

    const [newsResult, recipeResult, weatherResult, verseResult] = await Promise.allSettled([
      fetchNews(),
      fetchRecipe(),
      fetchWeather(display),
      fetchBibleVerse(),
    ]);

    if (requestId !== requestIdRef.current) {
      return;
    }

    const loadErrors: string[] = [];

    if (newsResult.status === 'fulfilled') {
      setNews(newsResult.value);
    } else {
      console.error('Erro ao carregar noticias', newsResult.reason);
      loadErrors.push(getErrorMessage(newsResult.reason, 'Nao foi possivel carregar as noticias.'));
    }

    if (recipeResult.status === 'fulfilled') {
      setRecipe(recipeResult.value);
      setIsRecipeExpanded(false);
      setErrors((prev) => prev.filter((message) => !isRecipeErrorMessage(message)));
    } else {
      console.error('Erro ao carregar receita', recipeResult.reason);
      loadErrors.push(getErrorMessage(recipeResult.reason, RECIPE_ERROR_MESSAGE));
    }

    if (weatherResult.status === 'fulfilled') {
      setWeather(weatherResult.value);
      setCity(weatherResult.value.location);
    } else {
      console.error('Erro ao carregar clima', weatherResult.reason);
      loadErrors.push(getErrorMessage(weatherResult.reason, 'Nao foi possivel carregar o clima.'));
      setCity(display);
    }

    if (verseResult.status === 'fulfilled') {
      setVerse(verseResult.value);
    } else {
      console.error('Erro ao carregar versiculo', verseResult.reason);
      loadErrors.push(getErrorMessage(verseResult.reason, 'Nao foi possivel carregar o versiculo.'));
    }

    setErrors(loadErrors);
    setRecipeLoading(false);
    setLoading(false);

    if (loadErrors.length < 4) {
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    loadDashboard(DEFAULT_CITY);
  }, [loadDashboard]);

  const refreshVerse = useCallback(async () => {
    setVerseLoading(true);
    try {
      const v = await fetchBibleVerse();
      setVerse(v);
    } catch (e) {
      console.error('Erro ao carregar versiculo', e);
    } finally {
      setVerseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen, closeSettings]);

  const formattedUpdatedAt = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }
    return lastUpdated.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [lastUpdated]);

  const recipeInstructions = useMemo(() => {
    if (!recipe) {
      return [];
    }
    return formatInstructions(recipe.instructions);
  }, [recipe]);

  const visibleIngredients = useMemo(() => {
    if (!recipe) {
      return [];
    }
    return isRecipeExpanded ? recipe.ingredients : recipe.ingredients.slice(0, 6);
  }, [recipe, isRecipeExpanded]);

  const visibleInstructions = useMemo(() => {
    if (recipeInstructions.length === 0) {
      return [];
    }
    return isRecipeExpanded ? recipeInstructions : recipeInstructions.slice(0, 5);
  }, [recipeInstructions, isRecipeExpanded]);

  const hasMoreIngredients = recipe ? recipe.ingredients.length > visibleIngredients.length : false;
  const hasMoreInstructions = recipeInstructions.length > visibleInstructions.length;
  const recipeExpandLabel = isRecipeExpanded ? 'Ver menos' : 'Ver completa';
  const canExpandRecipe = recipe ? hasMoreIngredients || hasMoreInstructions : false;
  const canShowRecipeExpand = !!recipe && (isRecipeExpanded || canExpandRecipe);

  return (
    <div className="app">
      <header className="header">
        <div className="header__text">
          <p className="header__eyebrow">Painel matinal</p>
          <h1>Bom dia, {randomMotherTitle}!</h1>
          <p className="header__subtitle">
            Espero que tenha um ótimo dia. Te amo!
          </p>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="alert">
          <p>Algumas informacoes nao puderam ser carregadas:</p>
          <ul>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="dashboard-grid">
        <article className="card card--verse">
          <header className="card__header card__header--with-action">
            <div className="card__header-text">
              <span className="card__eyebrow">Inspiracao</span>
              <h2>Versiculo para comecar o dia</h2>
            </div>
            <div className="card__header-actions">
              <button
                type="button"
                className="recipe-refresh"
                onClick={refreshVerse}
                disabled={verseLoading || loading}
              >
                {verseLoading ? 'Gerando...' : ''}
              </button>
            </div>
          </header>
          {verse ? (
            <blockquote className="verse">
              <p>"{verse.text}"</p>
              <footer>
                <cite>{verse.reference}</cite>
                {/* <span>{verse.translation}</span> */}
              </footer>
            </blockquote>
          ) : (
            <p className="placeholder">O versiculo do dia aparecera aqui.</p>
          )}
        </article>

        <article className="card card--recipe">
          <header className="card__header card__header--with-action">
            <div className="card__header-text">
              <span className="card__eyebrow">Receita</span>
              <h2>Inspiracao gastronomica</h2>
            </div>
            <div className="card__header-actions">
              {canShowRecipeExpand && (
                <button
                  type="button"
                  className={`recipe-expand${isRecipeExpanded ? ' recipe-expand--active' : ''}`}
                  onClick={toggleRecipeExpanded}
                  aria-expanded={isRecipeExpanded}
                  disabled={recipeLoading}
                >
                  {recipeExpandLabel}
                </button>
              )}
              <button
                type="button"
                className="recipe-refresh"
                onClick={refreshRecipe}
                aria-label="Sortear outra receita"
                disabled={recipeLoading || loading}
              >
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 5a7 7 0 0 1 6.32 4H16a1 1 0 0 0 0 2h5a1 1 0 0 0 1-1V5a1 1 0 1 0-2 0v1.26A9 9 0 0 0 3 12a1 1 0 0 0 2 0 7 7 0 0 1 7-7Zm7 7a1 1 0 0 0-1 1 7 7 0 0 1-6.32 7H16a1 1 0 1 0 0-2H5a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1.26A9 9 0 0 0 21 13a1 1 0 0 0-1-1Z"
                  />
                </svg>
              </button>
            </div>
          </header>
          {recipe ? (
            <div className="recipe">
              <img className="recipe__image" src={recipe.image} alt={recipe.name} loading="lazy" />
              <div className="recipe__content">
                <h3>{recipe.name}</h3>
                <p className="recipe__meta">
                  {recipe.category && <span>{recipe.category}</span>}
                  {recipe.origin && <span>{recipe.origin}</span>}
                </p>
                <h4>Ingredientes</h4>
                <ul className="recipe__ingredients">
                  {visibleIngredients.map((ingredient) => (
                    <li key={`${ingredient.name}-${ingredient.measure}`}>
                      {ingredient.measure ? `${ingredient.measure} ${ingredient.name}` : ingredient.name}
                    </li>
                  ))}
                </ul>
                <h4>Modo de preparo</h4>
                <ol className="recipe__steps">
                  {visibleInstructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                {!isRecipeExpanded && canExpandRecipe && (
                  <p className="recipe__more-hint">Toque em "Ver completa" para ver todos os detalhes.</p>
                )}
                <div className="recipe__links">
                  {recipe.source && (
                    <a href={recipe.source} target="_blank" rel="noopener noreferrer">
                      Ver receita original
                    </a>
                  )}
                  {recipe.youtube && (
                    <a href={recipe.youtube} target="_blank" rel="noopener noreferrer">
                      Ver video
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="placeholder">A receita do dia aparecera aqui.</p>
          )}
        </article>

        <article className="card card--news">
          <header className="card__header">
            <span className="card__eyebrow">Noticias</span>
            <h2>Principais manchetes de hoje</h2>
          </header>
          {news.length > 0 ? (
            <ul className="news-list">
              {news.map((item) => (
                <li key={item.id} className="news-item">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                  <span className="news-item__meta">Fonte: {item.author}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="placeholder">As noticias do dia aparecerao aqui.</p>
          )}
        </article>

        <article className="card card--weather">
          <header className="card__header">
            <span className="card__eyebrow">Clima</span>
            <h2>Como esta o tempo em {weather?.location ?? city}</h2>
          </header>
          {weather ? (
            <div className="weather">
              <div className="weather__main">
                <span className="weather__temp">{Math.round(weather.temperature)}°C</span>
                <div className="weather__details">
                  <p>{weather.condition}</p>
                  <p>Sensacao: {Math.round(weather.feelsLike)}°C</p>
                </div>
              </div>
              <dl className="weather__meta">
                <div>
                  <dt>Umidade</dt>
                  <dd>{weather.humidity}%</dd>
                </div>
                <div>
                  <dt>Vento</dt>
                  <dd>{weather.wind}</dd>
                </div>
                {weather.sunrise && (
                  <div>
                    <dt>Nascer do sol</dt>
                    <dd>{weather.sunrise}</dd>
                  </div>
                )}
                {weather.sunset && (
                  <div>
                    <dt>Por do sol</dt>
                    <dd>{weather.sunset}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <p className="placeholder">O clima da regiao aparecera aqui.</p>
          )}
        </article>
      </section>

      <button
        type="button"
        className={`settings-trigger${isSettingsOpen ? ' settings-trigger--active' : ''}`}
        onClick={openSettings}
        aria-haspopup="dialog"
        aria-expanded={isSettingsOpen}
        aria-controls="settings-modal"
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
          <path
            d="M10.325 4.317a1 1 0 011.35-.447l.15.083 1.272.802a1 1 0 00.823.096l.168-.064 1.335-.575a1 1 0 011.32.63l.05.168.575 1.336a1 1 0 00.52.53l.15.054 1.45.483a1 1 0 01.674.843l.008.185v1.603a1 1 0 01-.668.944l-.154.045-1.45.483a1 1 0 00-.62.536l-.057.144-.575 1.335a1 1 0 01-1.147.609l-.173-.05-1.335-.575a1 1 0 00-.79.047l-.145.082-1.272.802a1 1 0 01-1.485-.566l-.053-.169-.373-1.512a1 1 0 00-.467-.63l-.144-.074-1.335-.575a1 1 0 01-.609-1.147l.05-.173.575-1.335a1 1 0 00-.1-.858l-.094-.135-.873-1.21a1 1 0 01.024-1.21l.118-.131.873-1.21 1.335-.575a1 1 0 00.536-.62l.054-.15.373-1.513zM12 9a3 3 0 100 6 3 3 0 000-6z"
            fill="currentColor"
          />
        </svg>
        <span className="settings-trigger__label">Configuracoes</span>
      </button>

      {isSettingsOpen && (
        <div
          className="settings-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          id="settings-modal"
          onClick={closeSettings}
        >
          <div
            className="settings-modal__content"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="settings-modal__header">
              <h2 id="settings-modal-title">Configuracoes</h2>
              <button
                type="button"
                className="settings-modal__close"
                onClick={closeSettings}
                aria-label="Fechar painel de configuracoes"
              >
                ×
              </button>
            </div>
            <p className="settings-modal__description">Ajuste a regiao e atualize os dados do painel matinal.</p>
            <form
              className="location-form"
              onSubmit={(event) => {
                event.preventDefault();
                loadDashboard(inputCity);
                closeSettings();
              }}
            >
              <label htmlFor="settings-city" className="location-form__label">
                Regiao
              </label>
              <div className="location-form__controls">
                <input
                  id="settings-city"
                  type="text"
                  value={inputCity}
                  onChange={(event) => setInputCity(event.target.value)}
                  placeholder="Cidade, Estado"
                  autoComplete="organization"
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Atualizando...' : 'Aplicar'}
                </button>
              </div>
            </form>
            <div className="settings-modal__actions">
              <button
                className="refresh-button"
                type="button"
                onClick={() => loadDashboard(city)}
                disabled={loading}
              >
                Atualizar agora
              </button>
              {formattedUpdatedAt && (
                <span className="settings-modal__meta">Ultima atualizacao as {formattedUpdatedAt}</span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;




