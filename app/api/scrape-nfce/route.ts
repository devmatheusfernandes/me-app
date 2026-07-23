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
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    // Support Santa Catarina's SEFAZ URLs
    const isSC =
      url.includes('sefaz.sc.gov.br') ||
      url.includes('sef.sc.gov.br') ||
      url.includes('set.sc.gov.br');

    if (!isSC) {
      return NextResponse.json(
        { error: 'Apenas notas fiscais do estado de Santa Catarina (SC) são suportadas no momento.' },
        { status: 422 }
      );
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao acessar a nota fiscal: ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const items: NfceScrapedItem[] = [];

    // Strategy 1: SEFAZ-SC sat.sef.sc.gov.br text line regex format
    // E.g.: "UVA BRANCA S/SEMENTE 500G (Código: 930910 ) Qtde.:1UN: UNVl. Unit.: 12,99 Vl. Total 12,99"
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

    // Strategy 2: standard table column parsing (fallback)
    if (items.length === 0) {
      $('.item, .produtoNota, tr.item').each((_, el) => {
        const cells = $(el).find('td');
        if (cells.length < 3) return;

        const nameParts: string[] = [];
        $(cells[0]).find('span, div, p').each((_, s) => {
          const t = $(s).text().trim();
          if (t) nameParts.push(t);
        });
        const name = nameParts.join(' ').trim() || $(cells[0]).text().trim();
        if (!name) return;

        const qtyText = $(cells[1]).text().trim();
        const unitText = $(cells[2]).text().trim();
        const unitPriceText = $(cells[3])?.text().trim() || '0';
        const totalText = $(cells[4])?.text().trim() || $(cells[cells.length - 1]).text().trim();

        items.push({
          name,
          qty: parseDecimalBR(qtyText) || 1,
          unit: unitText || 'UN',
          unit_price: parseDecimalBR(unitPriceText),
          total_price: parseDecimalBR(totalText),
        });
      });
    }

    // Parse market name and metadata
    let marketName =
      $('span.txtTopo, .NomeEmitente, h1, .razaoSocial').first().text().trim() ||
      $('#lblRazaoSocial, #lblNomeFantasia').first().text().trim() ||
      '';

    // If marketName wasn't found in typical elements, check text around CNPJ or title
    if (!marketName) {
      const title = $('title').text().trim();
      marketName = title.includes('NFCe') ? 'Mercado' : title || 'Mercado';
    }

    const cnpjMatch = $.html().match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    const cnpj = cnpjMatch ? cnpjMatch[0] : '';

    const total_amount = items.reduce((s, i) => s + i.total_price, 0);

    const noteDateMatch = $.html().match(/\d{2}\/\d{2}\/\d{4}/);
    const note_date = noteDateMatch ? noteDateMatch[0] : '';

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível extrair itens desta nota fiscal. Verifique se o link está correto.' },
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
