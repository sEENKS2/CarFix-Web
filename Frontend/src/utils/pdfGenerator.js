import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORES = {
  primario: [2, 132, 199],      // #0284c7 (Azul CarFix)
  textoOscuro: [15, 23, 42],    // #0f172a
  textoGris: [100, 116, 139],   // #64748b
  fondoGris: [248, 250, 252],   // #f8fafc
  borde: [226, 232, 240]        // #e2e8f0
};

// Encabezado membretado compartido
function dibujarEncabezado(doc, tituloDocumento, subtitulo) {
  // Franja decorativa superior
  doc.setFillColor(...COLORES.primario);
  doc.rect(0, 0, 210, 5, 'F');

  // Logo / Nombre del Taller
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORES.primario);
  doc.text('CarFix', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.textoGris);
  doc.text('Servicio Mecánico Integral & Diagnóstico Computarizado', 14, 25);
  doc.text('Av. Pellegrini 1234, Rosario, Santa Fe | Tel: (0341) 555-0199', 14, 29);

  // Título a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORES.textoOscuro);
  doc.text(tituloDocumento.toUpperCase(), 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.textoGris);
  doc.text(subtitulo, 196, 25, { align: 'right' });

  // Línea divisoria
  doc.setDrawColor(...COLORES.borde);
  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);
}

/**
 * 1. REMITO DE RECEPCIÓN / CHECK-IN DE VEHÍCULO (Hoja de Ingreso)
 */
export function generarPdfRemitoIngreso(ticket) {
  const doc = new jsPDF();
  const fecha = new Date(ticket.fechaCreacion || Date.now()).toLocaleDateString('es-AR');

  dibujarEncabezado(doc, 'Remito de Recepción', `Ticket N° #${ticket.id} | Fecha: ${fecha}`);

  // Bloque: Datos del Cliente y Vehículo
  doc.setFillColor(...COLORES.fondoGris);
  doc.roundedRect(14, 40, 182, 34, 2, 2, 'F');
  doc.setDrawColor(...COLORES.borde);
  doc.roundedRect(14, 40, 182, 34, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.primario);
  doc.text('DATOS DEL TITULAR', 18, 46);
  doc.text('DATOS DE LA UNIDAD', 106, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.textoOscuro);

  const clienteNombre = ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : (ticket.nombreCompletoCliente || 'Particular');
  doc.text(`Cliente: ${clienteNombre}`, 18, 53);
  doc.text(`DNI / CUIT: ${ticket.cliente?.dni || '—'}`, 18, 59);
  doc.text(`Teléfono: ${ticket.cliente?.telefono || '—'}`, 18, 65);

  const dominio = ticket.vehiculo?.dominio || ticket.vehiculo?.patente || ticket.dominio || 'S/D';
  const marcaModelo = ticket.vehiculo ? `${ticket.vehiculo.marca} ${ticket.vehiculo.modelo}` : (ticket.nombreCompletoVehiculo || '—');
  doc.text(`Patente / Dominio: ${dominio}`, 106, 53);
  doc.text(`Marca y Modelo: ${marcaModelo}`, 106, 59);
  doc.text(`Año: ${ticket.vehiculo?.año || '—'}`, 106, 65);

  // Bloque: Motivo de Ingreso
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORES.textoOscuro);
  doc.text('Falla Reportada y Trabajos Solicitados', 14, 84);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORES.textoGris);
  const textoFalla = doc.splitTextToSize(ticket.descripcion || 'Sin descripción ingresada.', 182);
  doc.text(textoFalla, 14, 90);

  // Tabla Checklist de Recepción
  const startChecklist = 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORES.textoOscuro);
  doc.text('Inspección de Entrada (Check-in Inicial)', 14, startChecklist);

  autoTable(doc, {
    startY: startChecklist + 4,
    head: [['Punto de Control', 'Estado / Observación', 'Punto de Control', 'Estado / Observación']],
    body: [
      ['Nivel de Combustible', '[   ] 1/4   [   ] 1/2   [   ] Full', 'Kilometraje de Entrada', 'km: _________________'],
      ['Rueda de Auxilio', '[   ] Sí    [   ] No', 'Crique y Llave de Ruedas', '[   ] Sí    [   ] No'],
      ['Documentación en Guantera', '[   ] Retirada por titular', 'Frente de Estéreo / Accesorios', '[   ] Conforme'],
      ['Detalles de Carrocería', 'Rayones / Abolladuras previas:', 'Luces y Ópticas', '[   ] Funcionando']
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORES.primario, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: COLORES.textoOscuro, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold', width: 45 }, 2: { fontStyle: 'bold', width: 45 } }
  });

  // Cláusula legal de resguardo
  const yLegal = doc.lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORES.textoGris);
  const clausula = 'El taller no se responsabiliza por objetos de valor no declarados expresamente en este remito. Se autoriza al personal técnico a realizar pruebas mecánicas y de rodaje en vía pública si el diagnóstico lo requiere.';
  doc.text(doc.splitTextToSize(clausula, 182), 14, yLegal);

  // Firmas al pie
  const yFirmas = yLegal + 30;
  doc.setDrawColor(...COLORES.textoGris);
  doc.line(25, yFirmas, 80, yFirmas);
  doc.line(130, yFirmas, 185, yFirmas);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Firma del Cliente', 52, yFirmas + 5, { align: 'center' });
  doc.text('Aclaración / DNI', 52, yFirmas + 9, { align: 'center' });

  doc.text('Recepción CarFix', 157, yFirmas + 5, { align: 'center' });
  doc.text('Firma Responsable Taller', 157, yFirmas + 9, { align: 'center' });

  doc.save(`Remito_Ingreso_Ticket_${ticket.id}.pdf`);
}

/**
 * 2. FACTURA / PRESUPUESTO OFICIAL DETALLADO
 */
export function generarPdfFactura(factura, ticketRef = null) {
  const doc = new jsPDF();
  const fecha = new Date(factura.fechaEmision || Date.now()).toLocaleDateString('es-AR');

  dibujarEncabezado(doc, 'Comprobante de Servicio', `Factura: ${factura.numeroFactura} | Fecha: ${fecha}`);

  // Recuadro: Información de la Operación
  doc.setFillColor(...COLORES.fondoGris);
  doc.roundedRect(14, 40, 182, 28, 2, 2, 'F');
  doc.setDrawColor(...COLORES.borde);
  doc.roundedRect(14, 40, 182, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORES.primario);
  doc.text('DATOS DE FACTURACIÓN Y UNIDAD', 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORES.textoOscuro);

  const titular = ticketRef?.cliente ? `${ticketRef.cliente.nombre} ${ticketRef.cliente.apellido}` : (ticketRef?.nombreCompletoCliente || 'Particular');
  const auto = ticketRef?.vehiculo ? `${ticketRef.vehiculo.marca} ${ticketRef.vehiculo.modelo} (${ticketRef.vehiculo.dominio})` : (ticketRef?.nombreCompletoVehiculo || '—');

  doc.text(`Cliente: ${titular}`, 18, 53);
  doc.text(`DNI / CUIT: ${ticketRef?.cliente?.dni || 'Consumidor Final'}`, 18, 59);
  doc.text(`Ticket de Taller: #${factura.ticketId}`, 110, 53);
  doc.text(`Vehículo Atendido: ${auto}`, 110, 59);

  // Tabla con detalles discriminados
  const filas = (factura.detalles || []).map((d) => [
    d.tipo === 'ManoDeObra' ? 'Mano de Obra' : 'Repuesto',
    d.descripcion,
    String(d.cantidad),
    `$${Number(d.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    `$${(Number(d.cantidad) * Number(d.precioUnitario)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: 74,
    head: [['Rubro', 'Descripción del Trabajo / Repuesto', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: filas.length ? filas : [['—', 'Sin conceptos cargados', '1', '$0,00', '$0,00']],
    theme: 'striped',
    headStyles: { fillColor: COLORES.primario, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: COLORES.textoOscuro },
    columnStyles: {
      0: { width: 30, fontStyle: 'bold' },
      1: { width: 85 },
      2: { width: 18, halign: 'center' },
      3: { width: 25, halign: 'right' },
      4: { width: 24, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Bloque de Totales y Pagos
  const finalY = doc.lastAutoTable.finalY + 8;

  // Resumen financiero
  doc.setFillColor(...COLORES.fondoGris);
  doc.roundedRect(110, finalY, 86, 26, 2, 2, 'F');
  doc.setDrawColor(...COLORES.borde);
  doc.roundedRect(110, finalY, 86, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Total Facturado:', 115, finalY + 8);
  doc.text('Saldo Pendiente:', 115, finalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`$${Number(factura.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 190, finalY + 8, { align: 'right' });

  const saldoPend = Number(factura.saldoPendiente || 0);
  doc.setTextColor(saldoPend > 0 ? 220 : 5, saldoPend > 0 ? 38 : 150, saldoPend > 0 ? 38 : 105);
  doc.text(`$${saldoPend.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 190, finalY + 16, { align: 'right' });

  // Pie de página con validez
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.textoGris);
  doc.text('Garantía mecánica de 90 días sobre reparaciones efectuadas.', 14, 280);
  doc.text('Comprobante oficial no válido como factura fiscal AFIP/ARCA.', 196, 280, { align: 'right' });

  doc.save(`Factura_${factura.numeroFactura}.pdf`);
}