export function formatMillones(mm: number | null | undefined): string {
  if (mm === null || mm === undefined) return 'Sin dato'
  if (mm >= 1000) {
    const billones = mm / 1000
    return `$${billones.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil millones`
  }
  return `$${mm.toLocaleString('es-CL')} millones`
}

export function formatVariacion(pct: number | null): string {
  if (pct === null) return 'sin datos comparativos'
  const signo = pct >= 0 ? '+' : ''
  return `${signo}${pct.toFixed(1)}%`
}

export function formatNumero(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'Sin dato'
  return n.toLocaleString('es-CL')
}

export function generarParrafo(params: {
  nombreEstablecimiento: string
  tipoEntidad: string
  nombreServicio: string
  region: string
  presupuestoVigenteMMCLP: number | null
  devengadoMMCLP: number | null
  pctEjecucion: number | null
  mesCorte: string | null
  esperaCirugia: number | null
  esperaConsulta: number | null
  variacionCirugiaPct: number | null
  variacionConsultaPct: number | null
  fechaCorteMinsal: string | null
}): string {
  const {
    nombreEstablecimiento,
    tipoEntidad,
    nombreServicio,
    presupuestoVigenteMMCLP,
    devengadoMMCLP,
    pctEjecucion,
    mesCorte,
    esperaCirugia,
    esperaConsulta,
    variacionCirugiaPct,
    variacionConsultaPct,
    fechaCorteMinsal,
  } = params

  const hasBudgetData = presupuestoVigenteMMCLP !== null && devengadoMMCLP !== null && pctEjecucion !== null

  let texto = hasBudgetData
    ? `Con los últimos datos publicados (${mesCorte ?? 'sin corte informado'}), el ${nombreServicio} — la red regional de salud a la que pertenece ${nombreEstablecimiento} — recibió un presupuesto de ${formatMillones(presupuestoVigenteMMCLP)} y ejecutó el ${pctEjecucion.toFixed(1)}% (${formatMillones(devengadoMMCLP)}).`
    : `Para ${nombreServicio} — la red regional de salud a la que pertenece ${nombreEstablecimiento} — no hay datos presupuestarios completos y trazables cargados para el período consultado.`

  if (esperaCirugia !== null && esperaConsulta !== null && fechaCorteMinsal) {
    texto += ` En ese mismo período, la lista de espera registrada en ${nombreEstablecimiento} fue de ${formatNumero(esperaCirugia)} personas aguardando una cirugía y ${formatNumero(esperaConsulta)} esperando una consulta de especialidad`

    const varTexto: string[] = []
    if (variacionCirugiaPct !== null) {
      const signo = variacionCirugiaPct >= 0 ? 'un aumento' : 'una disminución'
      varTexto.push(`${signo} del ${Math.abs(variacionCirugiaPct).toFixed(1)}% en cirugías`)
    }
    if (variacionConsultaPct !== null) {
      const signo = variacionConsultaPct >= 0 ? 'un aumento' : 'una disminución'
      varTexto.push(`${signo} del ${Math.abs(variacionConsultaPct).toFixed(1)}% en consultas`)
    }

    if (varTexto.length > 0) {
      texto += `, lo que representa ${varTexto.join(' y ')} respecto al año anterior`
    }

    texto += '.'
  } else {
    texto += ` No se encontraron datos de lista de espera para ${nombreEstablecimiento} en el Visor MINSAL para este período.`
  }

  return texto
}
