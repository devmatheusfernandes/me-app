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
  const cleaned = str.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // Ensure valid HTTP/HTTPS URL
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Link de nota fiscal inválido. Certifique-se de incluir http:// ou https://' },
        { status: 400 }
      );
    }

    // Perform fetch with browser User-Agent
    let response: Response;
    try {
      response = await fetch(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Erro de conexão';
      return NextResponse.json(
        { error: `Não foi possível acessar a SEFAZ (${msg}). Verifique sua conexão ou se a SEFAZ está acessível.` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro de resposta da SEFAZ: HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const items: NfceScrapedItem[] = [];

    // ==========================================
    // Strategy 1: SEFAZ-SC (sat.sef.sc.gov.br)
    // Regex for single line format:
    // "UVA BRANCA S/SEMENTE 500G (Código: 930910 ) Qtde.:1UN: UNVl. Unit.: 12,99 Vl. Total 12,99"
    // ==========================================
    $('tr').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const match = text.match(
        /^(.*?)\s*\(\s*Código:\s*\d+\s*\)\s*Qtde\.:\s*([\d,.]+)\s*UN:\s*([A-Za-z]+)\s*Vl\.\s*Unit\.:\s*([\d,.]+)\s*Vl\.\s*Total\s*([\d,.]+)/i
      );

      if (match) {
        items.push({
          name: match[1].trim(),
          qty: parseDecimalBR(match[2]) || 1,
          unit: match[3].toUpperCase().trim(),
          unit_price: parseDecimalBR(match[4]),
          total_price: parseDecimalBR(match[5]),
        });
      }
    });

    // ==========================================
    // Strategy 2: Standard ENCAT / SP / PR / RS / RJ / MG / BA NFC-e Layout
    // Matches #tabResult tr, .table-striped tr, table.tbl_itens tr, etc.
    // ==========================================
    if (items.length === 0) {
      $('#tabResult tr, .table-striped tr, table.tbl_itens tr, tr[id^="Item"], .produtoNota').each((_, el) => {
        const name = $(el).find('.txtTit, .RProd, .spanItemName, .txtTopo, .borda-desenhada').first().text().trim();
        const qtyText = $(el).find('.RCR, .qnt, .txtQty, td:contains("Qtd")').text().trim();
        const unitText = $(el).find('.RText, .txtUn, td:contains("UN")').text().trim();
        const totalText = $(el).find('.valor, .vTotal, .vItem, .txtValor').first().text().trim();

        if (name && totalText) {
          items.push({
            name: name.replace(/\s+/g, ' '),
            qty: parseDecimalBR(qtyText) || 1,
            unit: unitText.replace(/[^A-Za-z]/g, '').toUpperCase() || 'UN',
            unit_price: 0,
            total_price: parseDecimalBR(totalText),
          });
        }
      });
    }

    // ==========================================
    // Strategy 3: Generic Table Row Fallback
    // Matches any table row containing cells with product text + quantity + price
    // ==========================================
    if (items.length === 0) {
      $('table tbody tr, tr.item').each((_, el) => {
        const cells = $(el).find('td');
        if (cells.length < 2) return;

        const name = $(cells[0]).text().trim();
        if (!name || name.toLowerCase().includes('produto') || name.toLowerCase().includes('código') || name.length < 2) {
          return;
        }

        const totalText = $(cells[cells.length - 1]).text().trim();
        const qtyText = cells.length >= 3 ? $(cells[1]).text().trim() : '1';
        const unitText = cells.length >= 4 ? $(cells[2]).text().trim() : 'UN';

        const totalPrice = parseDecimalBR(totalText);
        if (totalPrice > 0) {
          items.push({
            name: name.replace(/\s+/g, ' '),
            qty: parseDecimalBR(qtyText) || 1,
            unit: unitText.replace(/[^A-Za-z]/g, '').toUpperCase() || 'UN',
            unit_price: 0,
            total_price: totalPrice,
          });
        }
      });
    }

    // ==========================================
    // Extract Header Metadata (Market Name, CNPJ, Date, Total)
    // ==========================================
    let marketName =
      $('span.txtTopo, .NomeEmitente, h1, .razaoSocial, #lblRazaoSocial, #lblNomeFantasia, .txtCenter .txtTit')
        .first()
        .text()
        .trim() || '';

    if (!marketName) {
      const title = $('title').text().trim();
      marketName = title.includes('NFCe') || title.includes('Consulta') ? 'Mercado' : title || 'Mercado';
    }

    // Clean up market name if it contains address or extra noise
    marketName = marketName.split('\n')[0].replace(/\s+/g, ' ').slice(0, 50).trim() || 'Mercado';

    const cnpjMatch = $.html().match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    const cnpj = cnpjMatch ? cnpjMatch[0] : '';

    let total_amount = items.reduce((s, i) => s + i.total_price, 0);
    const totalEl = $('.totalNota, .valorTotal, td:contains("Total"), .totalNFe').last();
    if (totalEl.length) {
      const parsed = parseDecimalBR(totalEl.next('td').text().trim() || totalEl.text().replace(/[^0-9,]/g, ''));
      if (parsed > 0) total_amount = parsed;
    }

    const noteDateMatch = $.html().match(/\d{2}\/\d{2}\/\d{4}/);
    const note_date = noteDateMatch ? noteDateMatch[0] : '';

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            'Não foi possível ler os itens desta nota fiscal. Certifique-se de que o QR Code lido é de uma NFC-e (Nota Fiscal de Consumidor).',
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
    return NextResponse.json({ error: `Erro ao processar nota fiscal: ${message}` }, { status: 500 });
  }
}
