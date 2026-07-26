import { NextRequest, NextResponse } from 'next/server';

const CATEGORY_MAPPING: Record<string, string> = {
  // Frios e Laticínios
  'manteiga': 'Frios e Laticínios',
  'queijo': 'Frios e Laticínios',
  'leite': 'Frios e Laticínios',
  'iogurte': 'Frios e Laticínios',
  'laticínio': 'Frios e Laticínios',
  'creme de leite': 'Frios e Laticínios',
  'margarina': 'Frios e Laticínios',
  'requeijão': 'Frios e Laticínios',

  // Carnes
  'carne': 'Carnes',
  'frango': 'Carnes',
  'ave': 'Carnes',
  'peixe': 'Carnes',
  'suíno': 'Carnes',
  'bovino': 'Carnes',
  'presunto': 'Frios e Laticínios',
  'linguiça': 'Carnes',
  'salsicha': 'Carnes',

  // Bebidas
  'bebida': 'Bebidas',
  'suco': 'Bebidas',
  'refrigerante': 'Bebidas',
  'cerveja': 'Bebidas',
  'vinho': 'Bebidas',
  'água': 'Bebidas',
  'néctar': 'Bebidas',
  'chá': 'Bebidas',
  'café': 'Mercearia',

  // Padaria
  'pão': 'Padaria',
  'bolo': 'Padaria',
  'torrada': 'Padaria',
  'doce de padaria': 'Padaria',

  // Doces e Snacks
  'chocolate': 'Doces e Snacks',
  'biscoito': 'Doces e Snacks',
  'bolacha': 'Doces e Snacks',
  'salgadinho': 'Doces e Snacks',
  'bala': 'Doces e Snacks',
  'doce': 'Doces e Snacks',
  'goma': 'Doces e Snacks',
  'snack': 'Doces e Snacks',
  'bombom': 'Doces e Snacks',

  // Hortifruti
  'fruta': 'Hortifruti',
  'verdura': 'Hortifruti',
  'legume': 'Hortifruti',
  'hortaliça': 'Hortifruti',

  // Higiene Pessoal
  'sabonete': 'Higiene Pessoal',
  'shampoo': 'Higiene Pessoal',
  'condicionador': 'Higiene Pessoal',
  'desodorante': 'Higiene Pessoal',
  'creme dental': 'Higiene Pessoal',
  'pasta de dente': 'Higiene Pessoal',
  'fio dental': 'Higiene Pessoal',
  'absorvente': 'Higiene Pessoal',
  'fralda': 'Higiene Pessoal',

  // Utilidades (Limpeza / Casa)
  'detergente': 'Utilidades',
  'amaciante': 'Utilidades',
  'sabão': 'Utilidades',
  'desinfetante': 'Utilidades',
  'limpador': 'Utilidades',
  'esponja': 'Utilidades',
  'papel higiênico': 'Utilidades',

  // Congelados
  'congelado': 'Congelados',
  'pizza': 'Congelados',
  'lasanha': 'Congelados',
  'hambúrguer': 'Congelados',
};

function mapCategory(categoriesText: string = ''): string {
  const text = categoriesText.toLowerCase();
  
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  return 'Mercearia'; // Default fallback
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ean: string }> }
) {
  try {
    const { ean } = await params;

    if (!ean || ean.length < 8 || ean.length > 14) {
      return NextResponse.json({ error: 'Código de barras inválido' }, { status: 400 });
    }

    const url = `https://br.openfoodfacts.org/api/v2/product/${ean}.json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'MeApp - Android/iOS - Version 1.0 - developers@meapp.com',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao consultar serviço de código de barras' }, { status: 502 });
    }

    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: 'Produto não cadastrado na base de dados' }, { status: 404 });
    }

    const product = data.product;
    
    // Build a nice clean name
    const brand = product.brands ? product.brands.split(',')[0].trim() : '';
    const rawName = product.product_name || product.product_name_pt || '';
    
    let name = rawName.trim();
    if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
      name = `${brand} ${name}`;
    }

    // Capitalize first letter
    if (name) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Detect unit based on quantity or product metadata if available
    let unit = 'UN';
    const quantityText = (product.quantity || '').toLowerCase();
    if (quantityText.includes('kg') || quantityText.includes('quilo')) {
      unit = 'KG';
    } else if (quantityText.includes(' g') || quantityText.includes('grama')) {
      unit = 'UN'; // still count units for packages (ex: package of cookies)
    } else if (quantityText.includes(' l') || quantityText.includes('litro')) {
      unit = 'L';
    }

    const detectedCategory = mapCategory(product.categories || product.categories_tags?.join(' ') || '');

    return NextResponse.json({
      success: true,
      name,
      category: detectedCategory,
      unit,
      brand,
      image_url: product.image_url || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Falha ao processar código de barras: ${msg}` }, { status: 500 });
  }
}
