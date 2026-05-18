export function formatMillones(mm: number | null | undefined): string {
  if (mm === null || mm === undefined) return 'Sin dato'
  // mm está en MILLONES de pesos. 1 billón (CLP, escala larga) = 1.000.000 millones.
  if (mm >= 1_000_000) {
    const bill = mm / 1_000_000
    return `$${bill.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} billones`
  }
  if (mm >= 1000) {
    const milMM = mm / 1000
    return `$${milMM.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil millones`
  }
  return `$${mm.toLocaleString('es-CL')} millones`
}

// Versión ultra-compacta para hero stats / chips, donde el ancho es limitado.
// Usa abreviaturas: "MM" = millones, "MMM" = miles de millones, "B" = billones.
export function formatMillonesCompact(mm: number | null | undefined): string {
  if (mm === null || mm === undefined) return '—'
  if (mm >= 1_000_000) {
    return `$${(mm / 1_000_000).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} B`
  }
  if (mm >= 1000) {
    return `$${(mm / 1000).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MMM`
  }
  return `$${mm.toLocaleString('es-CL')} MM`
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

  if ((esperaCirugia !== null || esperaConsulta !== null) && fechaCorteMinsal) {
    texto += ` Al corte ${fechaCorteMinsal}, la lista de espera de toda la red del ${nombreServicio} (no solo ${nombreEstablecimiento}) era de ${esperaCirugia !== null ? `${formatNumero(esperaCirugia)} personas aguardando una cirugía` : 'cirugía sin dato'} y ${esperaConsulta !== null ? `${formatNumero(esperaConsulta)} esperando una consulta de especialidad` : 'consulta sin dato'}`

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
      texto += `, lo que representa ${varTexto.join(' y ')} respecto al mismo trimestre del año anterior`
    }

    texto += '.'
  } else {
    texto += ` No hay datos de lista de espera cargados para el ${nombreServicio} en este período.`
  }

  return texto
}
