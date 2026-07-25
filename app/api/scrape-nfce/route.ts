import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface NfceScrapedItem {
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface NfceScrapedResult {
  market_name: string;
  items: NfceScrapedItem[];
  total_amount: number;
  note_date: string;
  cnpj: string;
}

function parseDecimalBR(str: string): number {
  if (!str) return 0;
  // Handle "1.234,56" → "1234.56" and "1,23" → "1.23"
  const cleaned = str.replace(/[^\d,.-]/g, '');
  // If has both dot and comma, assume BR format: 1.234,56
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // Only comma → decimal separator: 1,23
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(',', '.')) || 0;
  }
  return parseFloat(cleaned) || 0;
}

function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').replace(/^\d+\s*-\s*/, '').trim();
}

/** Detect which SEFAZ state the URL belongs to */
function detectState(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('sc.gov.br') || lower.includes('sef.sc')) return 'SC';
  if (lower.includes('sp.gov.br') || lower.includes('fazenda.sp')) return 'SP';
  if (lower.includes('pr.gov.br') || lower.includes('sefa.pr')) return 'PR';
  if (lower.includes('rs.gov.br') || lower.includes('sefaz.rs')) return 'RS';
  if (lower.includes('mg.gov.br') || lower.includes('sefaz.mg')) return 'MG';
  if (lower.includes('rj.gov.br') || lower.includes('sefaz.rj')) return 'RJ';
  if (lower.includes('ba.gov.br') || lower.includes('sefaz.ba')) return 'BA';
  if (lower.includes('pe.gov.br') || lower.includes('sefaz.pe')) return 'PE';
  if (lower.includes('ce.gov.br') || lower.includes('sefaz.ce')) return 'CE';
  if (lower.includes('go.gov.br') || lower.includes('sefaz.go')) return 'GO';
  return 'UNKNOWN';
}

/** Try to extract items from JS-embedded JSON in the HTML */
function extractFromScript(html: string): NfceScrapedItem[] {
  const items: NfceScrapedItem[] = [];

  // Pattern: some SEFAZ portals embed product data in a JS array/object
  // Try to find JSON-like structures with product info
  const jsonPatterns = [
    // { "nomeItem": "PRODUTO", "qtdItem": "1", "valorUnitario": "9.99", "valorTotal": "9.99" }
    /\{\s*"nomeItem"\s*:\s*"([^"]+)"[^}]*"qtdItem"\s*:\s*"([^"]+)"[^}]*"valorUnitario"\s*:\s*"([^"]+)"[^}]*"valorTotal"\s*:\s*"([^"]+)"[^}]*\}/gi,
    // { nome: 'PRODUTO', quantidade: '1', valorUnitario: '9,99', valorTotal: '9,99' }
    /\{\s*nome\s*:\s*['"]([^'"]+)['"][^}]*quantidade\s*:\s*['"]([^'"]+)['"][^}]*valorUnitario\s*:\s*['"]([^'"]+)['"][^}]*valorTotal\s*:\s*['"]([^'"]+)['"]/gi,
  ];

  for (const pattern of jsonPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const total = parseDecimalBR(match[4]);
      if (total > 0) {
        items.push({
          name: cleanName(match[1]),
          qty: parseDecimalBR(match[2]) || 1,
          unit: 'UN',
          unit_price: parseDecimalBR(match[3]),
          total_price: total,
        });
      }
    }
    if (items.length > 0) break;
  }

  return items;
}

/** Try to find NFC-e key in URL and build alternate consultation URLs */
function buildAlternateUrls(originalUrl: string): string[] {
  const urls: string[] = [];

  try {
    const parsed = new URL(originalUrl);
    const chNFe = parsed.searchParams.get('chNFe') || parsed.searchParams.get('p')?.split('|')[0];

    if (chNFe && chNFe.length === 44) {
      // Try ENCAT standard consultation endpoint (used by many states)
      // SP: https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?chNFe=...
      // Generic: some states accept chNFe as direct param
      const uf = chNFe.substring(0, 2); // state code is embedded in key

      const stateMap: Record<string, string> = {
        '41': 'https://www.nfce.fazenda.pr.gov.br/nfce/consulta',
        '43': 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
        '35': 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica',
        '31': 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
        '33': 'https://notacarioca.rio.rj.gov.br/nfceweb/consulta.aspx',
      };

      const baseUrl = stateMap[uf];
      if (baseUrl) {
        urls.push(`${baseUrl}?chNFe=${chNFe}`);
      }
    }
  } catch {
    // Invalid URL, skip
  }

  return urls;
}

async function fetchHtml(url: string): Promise<string | null> {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        return await res.text();
      }
    } catch {
      // try next UA
    }
  }

  return null;
}

function scrapeHtml(html: string): NfceScrapedItem[] {
  const $ = cheerio.load(html);
  const items: NfceScrapedItem[] = [];

  // ===== Strategy 1: SEFAZ-SC / standard NFC-e with id="Item..." rows =====
  $('tr[id^="Item"]').each((_, el) => {
    const name = $(el).find('.txtTit').first().text().trim();
    const qtyText = $(el).find('.Rqtd, .RCR, .RQuantidade').text().replace(/Qtde\.?:?/i, '').trim();
    const unitText = $(el).find('.RUN, .RUnidade').text().replace(/UN:?/i, '').trim();
    const unitPriceText = $(el).find('.RvlUnit, .RValorUnitario').text().replace(/Vl\.?\s*Unit\.?:?/i, '').trim();
    const totalText = $(el).find('.valor, .vTotal, .RValorTotal').first().text().trim();

    if (name && (totalText || unitPriceText)) {
      const qty = parseDecimalBR(qtyText) || 1;
      const unitPrice = parseDecimalBR(unitPriceText);
      const total = parseDecimalBR(totalText) || qty * unitPrice;
      if (total > 0 || unitPrice > 0) {
        items.push({
          name: cleanName(name),
          qty,
          unit: unitText.replace(/[^A-Za-z]/g, '').toUpperCase() || 'UN',
          unit_price: unitPrice,
          total_price: total || unitPrice,
        });
      }
    }
  });

  if (items.length > 0) return items;

  // ===== Strategy 2: SEFAZ-SP and ENCAT standard layout =====
  // Table with product rows having class "odd" or "even" or similar
  $('.odd, .even, tr.item, .item-row, tr[class*="produto"]').each((_, el) => {
    const cells = $(el).find('td');
    if (cells.length < 2) return;
    const name = $(cells[0]).text().trim();
    if (!name || name.length < 3) return;
    const totalText = $(cells[cells.length - 1]).text().trim();
    const total = parseDecimalBR(totalText);
    if (total > 0) {
      items.push({
        name: cleanName(name),
        qty: cells.length >= 3 ? parseDecimalBR($(cells[1]).text()) || 1 : 1,
        unit: cells.length >= 4 ? $(cells[2]).text().replace(/[^A-Za-z]/g, '').toUpperCase() || 'UN' : 'UN',
        unit_price: cells.length >= 5 ? parseDecimalBR($(cells[3]).text()) : 0,
        total_price: total,
      });
    }
  });

  if (items.length > 0) return items;

  // ===== Strategy 3: Generic div-based layout (modern SEFAZ portals) =====
  // Some portals use divs with specific classes
  $('[class*="nome"], [class*="produto"], [class*="descricao"]').each((_, el) => {
    const $el = $(el);
    const name = $el.text().trim();
    if (!name || name.length < 3 || name.toLowerCase().includes('descrição')) return;

    // Try to find price in siblings/parent
    const parent = $el.closest('[class*="item"], [class*="produto"], li, .row');
    const priceEl = parent.find('[class*="valor"], [class*="total"], [class*="preco"]').last();
    const totalText = priceEl.text().trim();
    const total = parseDecimalBR(totalText);

    if (total > 0) {
      items.push({
        name: cleanName(name),
        qty: 1,
        unit: 'UN',
        unit_price: total,
        total_price: total,
      });
    }
  });

  if (items.length > 0) return items;

  // ===== Strategy 4: Regex on full HTML text (last resort) =====
  // Works when items are in text blobs without proper HTML structure
  const textContent = $.text();

  // Pattern: PRODUCT NAME 1 UN R$ 9,99 or PRODUCT NAME Qtde.: 1 Vl. Unit.: R$9,99 Vl. Total R$9,99
  const linePattern = /([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÇÜÑ][A-Za-záéíóúâêîôûãõàçüñ0-9\s\-/%.]+?)\s+(\d+[,.]?\d*)\s*(UN|KG|LT|PC|CX|G|ML|L|PCT|FD|KIT|PAR|MT)\s+(?:R\$\s*)?([\d.,]+)\s+(?:R\$\s*)?([\d.,]+)/gi;
  let match;
  while ((match = linePattern.exec(textContent)) !== null) {
    const total = parseDecimalBR(match[5]);
    if (total > 0 && match[1].trim().length > 2) {
      items.push({
        name: cleanName(match[1]),
        qty: parseDecimalBR(match[2]) || 1,
        unit: match[3].toUpperCase(),
        unit_price: parseDecimalBR(match[4]),
        total_price: total,
      });
    }
  }

  return items;
}

function extractMetadata(html: string, $: ReturnType<typeof cheerio.load>) {
  let marketName =
    $('#u20, .txtTopo, .NomeEmitente, .razaoSocial, h1, #lblRazaoSocial, #lblNomeFantasia, .estabelecimento, [class*="razao"], [class*="emitente"]')
      .first()
      .text()
      .trim() || '';

  if (!marketName) {
    // Try to find market name via regex in raw HTML
    const m = html.match(/razao[Ss]ocial['":\s]+['"]([^'"]+)['"]/);
    if (m) marketName = m[1];
  }

  if (!marketName) {
    const title = $('title').text().trim();
    marketName = title && !title.toLowerCase().includes('nfce') && !title.toLowerCase().includes('consulta')
      ? title
      : 'Mercado';
  }

  marketName = marketName.split('\n')[0].replace(/\s+/g, ' ').slice(0, 60).trim() || 'Mercado';

  const cnpjMatch = html.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  const cnpj = cnpjMatch ? cnpjMatch[0] : '';

  const noteDateMatch = html.match(/\d{2}\/\d{2}\/\d{4}/);
  const note_date = noteDateMatch ? noteDateMatch[0] : '';

  return { marketName, cnpj, note_date };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    let cleanUrl = url.trim().replace(/\\/g, '/');

    // Encode special characters like pipes | in query string to avoid HTTP parsing errors
    if (cleanUrl.includes('?')) {
      const [base, search] = cleanUrl.split('?');
      const encodedSearch = search.replace(/\|/g, '%7C');
      cleanUrl = `${base}?${encodedSearch}`;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Link de nota fiscal inválido. Deve começar com http:// ou https://' },
        { status: 400 }
      );
    }

    const state = detectState(cleanUrl);

    // Build list of URLs to try (original + alternates)
    const urlsToTry = [cleanUrl, ...buildAlternateUrls(cleanUrl)];

    let html: string | null = null;
    let usedUrl = cleanUrl;

    for (const urlAttempt of urlsToTry) {
      html = await fetchHtml(urlAttempt);
      if (html && html.length > 500) {
        usedUrl = urlAttempt;
        break;
      }
    }

    if (!html || html.length < 100) {
      return NextResponse.json(
        {
          error: `Não foi possível acessar o portal da SEFAZ${state !== 'UNKNOWN' ? '-' + state : ''}. Verifique sua conexão ou tente colar o link manualmente.`,
        },
        { status: 502 }
      );
    }

    const $ = cheerio.load(html);

    // Try DOM scraping first
    let items = scrapeHtml(html);

    // If DOM scraping fails, try JS-embedded JSON
    if (items.length === 0) {
      items = extractFromScript(html);
    }

    const { marketName, cnpj, note_date } = extractMetadata(html, $);
    const total_amount = items.reduce((s, i) => s + i.total_price, 0);

    if (items.length === 0) {
      // Provide helpful error with debug info
      const debugInfo = `Estado detectado: ${state}. URL usada: ${usedUrl.substring(0, 60)}...`;
      return NextResponse.json(
        {
          error: `Não foi possível ler os itens desta nota fiscal. ${debugInfo}. Tente colar o link diretamente no campo abaixo.`,
        },
        { status: 422 }
      );
    }

    const result: NfceScrapedResult = {
      market_name: marketName,
      items,
      total_amount,
      note_date,
      cnpj,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao processar nota fiscal: ${message}` },
      { status: 500 }
    );
  }
}
