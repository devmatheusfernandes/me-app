const fs = require('fs');
const path = require('path');
const cheerio = require('c:/Users/Mathe/Documents/Projetos/me-app/node_modules/cheerio');

const contentPath = 'C:\\Users\\Mathe\\.gemini\\antigravity-ide\\brain\\8100e3c6-a551-4ad0-a9ff-4700197de7e2\\.system_generated\\steps\\9\\content.md';
const fileContent = fs.readFileSync(contentPath, 'utf-8');

// The markdown file contains some headers, then <!DOCTYPE html> ...
const htmlStartIndex = fileContent.indexOf('<!DOCTYPE html>');
const html = fileContent.substring(htmlStartIndex);

const $ = cheerio.load(html);

console.log('--- TABLES & DIVS CONTAINING TOTALS ---');
$('table, div').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  if (text.includes('Valor total') || text.includes('Descontos') || text.includes('Valor a pagar') || text.includes('Forma de pagamento')) {
    console.log(`Tag: ${el.tagName}, ID: ${$(el).attr('id') || 'none'}, Class: ${$(el).attr('class') || 'none'}`);
    console.log(`Snippet: ${text.substring(0, 200)}`);
    console.log('------------------------------------');
  }
});
