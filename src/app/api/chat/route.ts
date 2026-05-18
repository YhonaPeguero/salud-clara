import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'

// Data imports
import mappingData from '../../../../data/mapping.json'
import dipresData from '../../../../data/dipres_ejecucion.json'
import minsalData from '../../../../data/minsal_espera.json'

type MappingEntry = {
  display_nombre: string
  tipo: string
  servicio_salud_id: string
  servicio_salud_nombre: string
  region: string
}

type DipresServicio = {
  nombre?: string | null
  region?: string | null
  presupuesto_vigente_MM?: number | null
  devengado_MM?: number | null
  pct_ejecucion?: number | null
  mes_corte?: string | null
}

type MinsalServicio = {
  nombre_servicio?: string | null
  espera_cirugia?: number | null
  espera_consulta_especialidad?: number | null
  variacion_cirugia_pct?: number | null
  variacion_consulta_pct?: number | null
  fecha_corte?: string | null
}

// Build context from data
function buildDataContext() {
  const mappingEntries = (mappingData as { entries: MappingEntry[] }).entries
  const serviciosDipres = (dipresData as { servicios: Record<string, DipresServicio | null> }).servicios
  const serviciosMinsal = (minsalData as {
    servicios: Record<string, MinsalServicio | null>
  }).servicios

  const servicios = Object.entries(serviciosDipres).map(([servicioId, presupuesto]) => {
    const entradasServicio = mappingEntries.filter(entry => entry.servicio_salud_id === servicioId)
    const espera = serviciosMinsal?.[servicioId] ?? null

    return {
      servicio_id: servicioId,
      nombre: presupuesto?.nombre ?? entradasServicio[0]?.servicio_salud_nombre ?? servicioId,
      region: presupuesto?.region ?? entradasServicio[0]?.region ?? null,
      presupuesto: presupuesto
        ? {
            presupuesto_vigente_MM: presupuesto.presupuesto_vigente_MM ?? null,
            devengado_MM: presupuesto.devengado_MM ?? null,
            pct_ejecucion: presupuesto.pct_ejecucion ?? null,
            mes_corte: presupuesto.mes_corte ?? null,
          }
        : null,
      establecimientos: entradasServicio
        .filter(entry => entry.tipo !== 'comuna')
        .slice(0, 5)
        .map(entry => entry.display_nombre),
      lista_espera_servicio: espera
        ? {
            espera_cirugia: espera.espera_cirugia ?? null,
            espera_consulta_especialidad: espera.espera_consulta_especialidad ?? null,
            variacion_cirugia_pct: espera.variacion_cirugia_pct ?? null,
            variacion_consulta_pct: espera.variacion_consulta_pct ?? null,
            fecha_corte: espera.fecha_corte ?? null,
          }
        : null,
    }
  })

  return JSON.stringify(servicios, null, 2)
}

function buildSystemPrompt() {
  return `Eres el asistente de "K-milla", una aplicación que conecta los datos públicos de presupuesto (DIPRES) y listas de espera (MINSAL) de salud en Chile, por Servicio de Salud.

DATOS DISPONIBLES:
${buildDataContext()}

INSTRUCCIONES:
- Responde en español chileno, de forma clara y directa
- Usa exclusivamente los DATOS DISPONIBLES. No inventes, estimes ni completes cifras.
- Si un dato no aparece o viene en null, di que no está disponible en los datos cargados.
- No digas que los datos son en vivo: corresponden al corte informado en cada registro.
- Si preguntan por un hospital o servicio específico, busca en los datos cargados
- Explica los términos técnicos en lenguaje simple:
  - "Presupuesto vigente" = plata asignada para el año
  - "Gasto devengado" = plata ya gastada
  - "Porcentaje de ejecución" = qué % del presupuesto se ha usado
  - "Lista de espera" = personas esperando atención (la cifra es por Servicio de Salud completo, no por hospital individual)
- Sé empático, estos datos afectan la vida de las personas
- Si no tienes el dato, dilo honestamente
- Respuestas cortas y útiles, máximo 3-4 oraciones
- Puedes sugerir que busquen un hospital específico en la app`
}

export async function POST(req: Request) {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Falta configurar MINIMAX_API_KEY.' }, { status: 503 })
  }

  let body: { messages?: UIMessage[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  if (!Array.isArray(body.messages)) {
    return Response.json({ error: 'La solicitud debe incluir messages.' }, { status: 400 })
  }

  const minimax = createOpenAICompatible({
    name: 'minimax',
    baseURL: 'https://api.minimax.chat/v1',
    apiKey,
  })

  const result = streamText({
    model: minimax('MiniMax-Text-01'),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(body.messages),
    maxOutputTokens: 500,
  })

  return result.toUIMessageStreamResponse()
}
