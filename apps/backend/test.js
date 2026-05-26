const { marked } = require('marked');
function formatMarkdownTitles(text) {
  if (!text) return text;
  let formatted = text.replace(/(?:^|\s+)\*\*([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]+)\*\*\s+/g, '\n\n**$1**\n');
  formatted = formatted.replace(/(?:^|\s+)\*\*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+:)\*\*\s+/g, '\n\n**$1**\n');
  return formatted.replace(/\n{3,}/g, '\n\n').trim();
}
const text = '**CONTEXTO** La aggregation de métricas de reclutamiento filtra `archived: { $ne: true }` pero el campo `archived` no existe en `recruitment.schema.ts`. Es un no-op completo hoy. **INFORMACIÓN TÉCNICA** - `metrics.service.ts` línea ~634 - El schema no tiene campo `archived` **SOLUCIÓN PROPUESTA** Remover `archived`. **CRITERIOS DE ACEPTACIÓN** - El `$match` de recruitment no incluye filtros. **DEPENDENCIAS** Ninguna. Limpieza pura.';

console.log('Formatted:');
console.log(formatMarkdownTitles(text));
