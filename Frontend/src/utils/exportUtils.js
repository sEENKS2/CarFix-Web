/**
 * Exporta un array de objetos a formato CSV compatible nativamente con Excel en español.
 * Incluye el BOM UTF-8 (\uFEFF) para garantizar acentos, eñes y caracteres especiales.
 *
 * @param {Array<Object>} data - Lista de objetos a exportar.
 * @param {Array<{ key: string, label: string }>} columns - Columnas y sus encabezados.
 * @param {string} filename - Nombre del archivo a descargar (sin o con extensión .csv).
 */
export function exportToCsv(data, columns, filename = 'exportacion') {
  if (!data || !data.length) {
    throw new Error('No hay datos disponibles para exportar.');
  }

  // 1. Encabezados (usamos ';' como separador por defecto en sistemas de habla hispana/Excel AR)
  const separator = ';';
  const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(separator);

  // 2. Filas de datos
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];

      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'number') {
        // En Excel región española, el separador decimal suele ser coma
        value = String(value).replace('.', ',');
      } else if (value instanceof Date) {
        value = value.toLocaleString('es-AR');
      } else {
        value = String(value).replace(/"/g, '""');
      }

      return `"${value}"`;
    }).join(separator);
  });

  // 3. Unir todo anteponiendo el BOM UTF-8 (\uFEFF)
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

  // 4. Crear Blob y disparar descarga
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}