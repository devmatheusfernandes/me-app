import { NextRequest, NextResponse } from 'next/server';
import type { NfceScrapedResult } from '../scrape-nfce/route';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType = 'image/jpeg' } = body as { image?: string; mimeType?: string };

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Imagem base64 é obrigatória' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave API do Gemini (GEMINI_API_KEY) não configurada no servidor' }, { status: 500 });
    }

    // Clean up base64 string if it contains data:image/...;base64,
    const base64Data = image.includes(';base64,') ? image.split(';base64,')[1] : image;

    // Call Gemini 2.5 Flash API using REST endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
Você é um leitor especialista em notas fiscais e recibos de compras domésticas (NFC-e e cupons).
Analise a imagem da nota fiscal e extraia as informações estruturadas dos itens comprados, do mercado e do total pago.

Instruções adicionais:
1. "market_name": Extraia a Razão Social ou Nome Fantasia do estabelecimento (ex: "Supermercado Veneza").
2. "note_date": Extraia a data de emissão no formato padrão "DD/MM/YYYY" (ex: "17/07/2026"). Se não encontrar, retorne a data atual de hoje.
3. "total_amount": Extraia o valor final realmente pago pelo cliente ("Valor a pagar" ou "Valor Pago" após quaisquer descontos).
4. "items": Extraia a lista de itens. Para cada item:
   - "name": Nome do produto (ex: "REFRI PEPSI 2L TWIST"). Limpe códigos de barra ou prefixos inúteis do nome.
   - "qty": Quantidade comprada (pode ser decimal, ex: 1.098 ou 1).
   - "unit": Unidade (ex: "UN", "KG", "G", "L", "ML", "PCT", "CX"). Se não especificado, use "UN".
   - "unit_price": Preço unitário do produto.
   - "total_price": Preço total daquele produto (deve ser aproximadamente qty * unit_price).
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            market_name: { type: 'STRING', description: 'Nome fantasia ou razão social do emissor/mercado' },
            note_date: { type: 'STRING', description: 'Data da compra no formato DD/MM/YYYY' },
            total_amount: { type: 'NUMBER', description: 'Valor total a pagar após descontos' },
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING', description: 'Nome do produto limpo' },
                  qty: { type: 'NUMBER', description: 'Quantidade comprada' },
                  unit: { type: 'STRING', description: 'Unidade de medida: UN, KG, L, ML, PCT, CX' },
                  unit_price: { type: 'NUMBER', description: 'Preço unitário' },
                  total_price: { type: 'NUMBER', description: 'Valor total do item' },
                },
                required: ['name', 'qty', 'unit', 'unit_price', 'total_price'],
              },
            },
          },
          required: ['market_name', 'note_date', 'total_amount', 'items'],
        },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: 'Erro na API do Gemini ao processar imagem' }, { status: 502 });
    }

    const responseData = await res.json();
    const candidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return NextResponse.json({ error: 'Não foi possível obter resposta legível da IA para esta nota' }, { status: 422 });
    }

    // Parse JSON response from Gemini
    const resultJson = JSON.parse(candidateText.trim());

    const { market_name, note_date, total_amount, items } = resultJson as {
      market_name: string;
      note_date: string;
      total_amount: number;
      items: Array<{ name: string; qty: number; unit: string; unit_price: number; total_price: number }>;
    };

    // Sanitize item properties and ensure prices sum matching total_amount
    const sanitizedItems = items.map((item) => ({
      name: item.name.replace(/\s+/g, ' ').trim(),
      qty: Number(item.qty) || 1,
      unit: item.unit.toUpperCase().replace(/[^A-Z]/g, '') || 'UN',
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
    }));

    const itemsSum = sanitizedItems.reduce((s, i) => s + i.total_price, 0);

    // Apply proportional adjustment to match total_amount to avoid rounding discrepancies
    if (total_amount > 0 && sanitizedItems.length > 0 && Math.abs(total_amount - itemsSum) > 0.01) {
      const discountFactor = total_amount / itemsSum;
      let currentSum = 0;
      sanitizedItems.forEach((item, idx) => {
        if (idx === sanitizedItems.length - 1) {
          item.total_price = Number((total_amount - currentSum).toFixed(2));
        } else {
          item.total_price = Number((item.total_price * discountFactor).toFixed(2));
          currentSum += item.total_price;
        }
        item.unit_price = Number((item.total_price / item.qty).toFixed(2));
      });
    }

    const finalResult: NfceScrapedResult = {
      market_name: market_name || 'Mercado',
      items: sanitizedItems,
      total_amount: total_amount || itemsSum,
      note_date: note_date || new Date().toLocaleDateString('pt-BR'),
      cnpj: '',
    };

    return NextResponse.json(finalResult);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('API Error in scrape-nfce-image:', err);
    return NextResponse.json({ error: `Falha no processamento por IA: ${msg}` }, { status: 500 });
  }
}
