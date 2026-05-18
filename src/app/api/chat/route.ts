import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { generateText, type ModelMessage } from 'ai'

import mappingData from '../../../../data/mapping.json'
import dipresData from '../../../../data/dipres_ejecucion.json'
import minsalData from '../../../../data/minsal_espera.json'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type MappingEntry = {
  display_nombre: string
  tipo: string
  servicio_salud_id: string
  servicio_salud_nombre: string
  region: string
  comunas?: string[]
  search_terms?: string[]
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

type ServicioContext = {
  servicio_id: string
  nombre: string
  region: string | null
  presupuesto: DipresServicio | null
  lista_espera_servicio: MinsalServicio | null
  establecimientos: string[]
  aliases: string[]
}

const mappingEntries = (mappingData as { entries: MappingEntry[] }).entries
const serviciosDipres = (dipresData as { servicios: Record<string, DipresServicio | null> }).servicios
const serviciosMinsal = (minsalData as { servicios: Record<string, MinsalServicio | null> }).servicios

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatMillones(mm: number | null | undefined): string {
  if (mm == null) return 'sin dato'
  if (mm >= 1_000_000) {
    return `$${(mm / 1_000_000).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} billones`
  }
  if (mm >= 1000) {
    return `$${(mm / 1000).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil millones`
  }
  return `$${mm.toLocaleString('es-CL')} millones`
}

function formatNumero(value: number | null | undefined): string {
  return value == null ? 'sin dato' : value.toLocaleString('es-CL')
}

function getServiceContexts(): ServicioContext[] {
  return Object.entries(serviciosDipres).map(([servicioId, presupuesto]) => {
    const entradasServicio = mappingEntries.filter(entry => entry.servicio_salud_id === servicioId)
    const espera = serviciosMinsal?.[servicioId] ?? null
    const nombre = presupuesto?.nombre ?? espera?.nombre_servicio ?? entradasServicio[0]?.servicio_salud_nombre ?? servicioId
    const establecimientos = entradasServicio
      .filter(entry => entry.tipo !== 'comuna')
      .slice(0, 6)
      .map(entry => entry.display_nombre)

    return {
      servicio_id: servicioId,
      nombre,
      region: presupuesto?.region ?? entradasServicio[0]?.region ?? null,
      presupuesto,
      lista_espera_servicio: espera,
      establecimientos,
      aliases: [
        nombre,
        servicioId,
        ...entradasServicio.flatMap(entry => [
          entry.display_nombre,
          entry.servicio_salud_nombre,
          entry.region,
          ...(entry.comunas ?? []),
          ...(entry.search_terms ?? []),
        ]),
      ].filter(Boolean),
    }
  })
}

function buildDataContext() {
  return JSON.stringify(
    getServiceContexts().map(servicio => ({
      servicio_id: servicio.servicio_id,
      nombre: servicio.nombre,
      region: servicio.region,
      presupuesto: servicio.presupuesto
        ? {
            presupuesto_vigente_MM: servicio.presupuesto.presupuesto_vigente_MM ?? null,
            devengado_MM: servicio.presupuesto.devengado_MM ?? null,
            pct_ejecucion: servicio.presupuesto.pct_ejecucion ?? null,
            mes_corte: servicio.presupuesto.mes_corte ?? null,
          }
        : null,
      establecimientos: servicio.establecimientos,
      lista_espera_servicio: servicio.lista_espera_servicio
        ? {
            espera_cirugia: servicio.lista_espera_servicio.espera_cirugia ?? null,
            espera_consulta_especialidad: servicio.lista_espera_servicio.espera_consulta_especialidad ?? null,
            variacion_cirugia_pct: servicio.lista_espera_servicio.variacion_cirugia_pct ?? null,
            variacion_consulta_pct: servicio.lista_espera_servicio.variacion_consulta_pct ?? null,
            fecha_corte: servicio.lista_espera_servicio.fecha_corte ?? null,
          }
        : null,
    })),
    null,
    2,
  )
}

function buildSystemPrompt() {
  return `Eres el asistente de K-milla, una app de datos públicos de salud chilena por Servicio de Salud.

DATOS DISPONIBLES:
${buildDataContext()}

REGLAS ESTRICTAS:
- Responde en español claro y breve.
- Usa exclusivamente los datos disponibles. No inventes, estimes ni redondees cifras.
- Si falta un dato o viene null, dilo explícitamente.
- El presupuesto DIPRES y las listas MINSAL son por Servicio de Salud, no por hospital individual.
- No digas que los datos son en vivo; usa el corte informado.
- Explica términos técnicos en lenguaje simple.
- Máximo 4 oraciones salvo que el usuario pida detalle.`
}

function extractMessages(rawMessages: unknown): ChatMessage[] {
  if (!Array.isArray(rawMessages)) return []

  return rawMessages
    .flatMap((message): ChatMessage[] => {
      if (!message || typeof message !== 'object') return []
      const record = message as Record<string, unknown>
      if (record.role !== 'user' && record.role !== 'assistant') return []

      if (typeof record.content === 'string') {
        return [{ role: record.role, content: record.content.slice(0, 4000) }]
      }

      if (Array.isArray(record.parts)) {
        const text = record.parts
          .filter((part): part is { type: 'text'; text: string } => {
            if (!part || typeof part !== 'object') return false
            const partRecord = part as Record<string, unknown>
            return partRecord.type === 'text' && typeof partRecord.text === 'string'
          })
          .map(part => part.text)
          .join('')

        if (text) return [{ role: record.role, content: text.slice(0, 4000) }]
      }

      return []
    })
    .slice(-12)
}

function findRelevantService(question: string) {
  const normalizedQuestion = normalizeText(question)
  const contexts = getServiceContexts()
  let best: { score: number; service: ServicioContext } | null = null

  for (const service of contexts) {
    let score = 0
    const aliases = Array.from(new Set(service.aliases.map(normalizeText)))

    for (const alias of aliases) {
      if (alias.length < 3) continue
      if (normalizedQuestion.includes(alias)) score += Math.min(30, alias.length)

      const words = alias.split(/\s+/).filter(word => word.length > 3)
      for (const word of words) {
        if (normalizedQuestion.includes(word)) score += 2
      }
    }

    if (!best || score > best.score) best = { score, service }
  }

  return best && best.score >= 4 ? best.service : null
}

function describeService(service: ServicioContext) {
  const presupuesto = service.presupuesto
  const espera = service.lista_espera_servicio
  const budgetText = presupuesto
    ? `${service.nombre} tiene presupuesto vigente de ${formatMillones(presupuesto.presupuesto_vigente_MM)} y devengado de ${formatMillones(presupuesto.devengado_MM)} al corte ${presupuesto.mes_corte ?? 'sin corte informado'}. Su ejecución es ${presupuesto.pct_ejecucion == null ? 'sin dato' : `${presupuesto.pct_ejecucion.toFixed(2)}%`}.`
    : `${service.nombre} no tiene presupuesto DIPRES cargado.`
  const waitText = espera
    ? `En MINSAL, al corte ${espera.fecha_corte ?? 'sin corte informado'}, registra ${formatNumero(espera.espera_cirugia)} personas esperando cirugía y ${formatNumero(espera.espera_consulta_especialidad)} esperando consulta de especialidad.`
    : 'No hay lista de espera MINSAL cargada para ese Servicio de Salud.'
  const hospitalText = service.establecimientos.length > 0
    ? `Hospitales/establecimientos mapeados como referencia: ${service.establecimientos.slice(0, 3).join(', ')}.`
    : ''

  return `${budgetText} ${waitText} ${hospitalText}`.trim()
}

function answerDefinition(question: string) {
  const normalized = normalizeText(question)
  if (normalized.includes('presupuesto vigente')) {
    return 'Presupuesto vigente es la plata asignada oficialmente para el año, incluyendo modificaciones durante el período. En K-milla aparece en millones de pesos chilenos y viene de DIPRES.'
  }
  if (normalized.includes('devengado') || normalized.includes('gastado')) {
    return 'Gasto devengado es la parte del presupuesto que ya quedó comprometida como gasto según la ejecución presupuestaria. En simple: es la plata que el Servicio de Salud ya usó o comprometió oficialmente.'
  }
  if (normalized.includes('ejecucion') || normalized.includes('ejecut')) {
    return 'El porcentaje de ejecución muestra qué parte del presupuesto vigente ya fue devengada. Se calcula como devengado dividido por presupuesto vigente, usando los datos DIPRES cargados.'
  }
  if (normalized.includes('lista de espera')) {
    return 'Lista de espera es la cantidad de personas esperando atención. En K-milla se muestra por Servicio de Salud completo, no por hospital individual, usando el corte MINSAL cargado.'
  }
  return null
}

function answerRanking(question: string) {
  const normalized = normalizeText(question)
  const contexts = getServiceContexts()

  if (normalized.includes('casi todo') || normalized.includes('mayor ejecucion') || normalized.includes('mas ejecuto')) {
    const ranked = contexts
      .filter(service => service.presupuesto?.pct_ejecucion != null)
      .toSorted((a, b) => (b.presupuesto?.pct_ejecucion ?? 0) - (a.presupuesto?.pct_ejecucion ?? 0))
      .slice(0, 3)

    if (ranked.length === 0) return null
    return `Los mayores porcentajes de ejecución DIPRES cargados son: ${ranked.map(service => `${service.nombre} (${service.presupuesto!.pct_ejecucion!.toFixed(2)}%)`).join('; ')}. El corte presupuestario es ${ranked[0].presupuesto?.mes_corte ?? 'sin corte informado'}.`
  }

  if (normalized.includes('mas espera') || normalized.includes('mayor lista') || normalized.includes('esperan mas')) {
    const ranked = contexts
      .filter(service => service.lista_espera_servicio?.espera_consulta_especialidad != null || service.lista_espera_servicio?.espera_cirugia != null)
      .toSorted((a, b) => {
        const totalA = (a.lista_espera_servicio?.espera_consulta_especialidad ?? 0) + (a.lista_espera_servicio?.espera_cirugia ?? 0)
        const totalB = (b.lista_espera_servicio?.espera_consulta_especialidad ?? 0) + (b.lista_espera_servicio?.espera_cirugia ?? 0)
        return totalB - totalA
      })
      .slice(0, 3)

    if (ranked.length === 0) return null
    return `Las listas de espera totales más altas cargadas son: ${ranked.map(service => `${service.nombre} (${formatNumero((service.lista_espera_servicio?.espera_consulta_especialidad ?? 0) + (service.lista_espera_servicio?.espera_cirugia ?? 0))} personas entre consultas y cirugías)`).join('; ')}. El corte MINSAL es ${ranked[0].lista_espera_servicio?.fecha_corte ?? 'sin corte informado'}.`
  }

  return null
}

function buildLocalAnswer(messages: ChatMessage[]) {
  const question = [...messages].reverse().find(message => message.role === 'user')?.content ?? ''
  const definition = answerDefinition(question)
  if (definition) return definition

  const ranking = answerRanking(question)
  if (ranking) return ranking

  const service = findRelevantService(question)
  if (service) return describeService(service)

  return 'Puedo responder con los datos locales de DIPRES y MINSAL por Servicio de Salud. Prueba con un hospital, comuna o Servicio de Salud, por ejemplo Hospital San José, Temuco o Servicio de Salud Metropolitano Norte.'
}

async function callProvider(messages: ChatMessage[]) {
  const modelMessages: ModelMessage[] = messages.map(message => ({
    role: message.role,
    content: message.content,
  }))

  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    const openrouter = createOpenAICompatible({
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
        'X-Title': 'K-milla',
      },
    })

    const result = await generateText({
      model: openrouter(process.env.OPENROUTER_MODEL ?? 'anthropic/claude-opus-4.7'),
      system: buildSystemPrompt(),
      messages: modelMessages,
      maxOutputTokens: 700,
    })

    return { text: result.text, provider: 'openrouter' }
  }

  const minimaxKey = process.env.MINIMAX_API_KEY
  if (minimaxKey) {
    const minimax = createOpenAICompatible({
      name: 'minimax',
      baseURL: 'https://api.minimax.chat/v1',
      apiKey: minimaxKey,
    })

    const result = await generateText({
      model: minimax(process.env.MINIMAX_TEXT_MODEL ?? 'MiniMax-Text-01'),
      system: buildSystemPrompt(),
      messages: modelMessages,
      maxOutputTokens: 700,
    })

    return { text: result.text, provider: 'minimax' }
  }

  return null
}

export async function POST(req: Request) {
  let body: { messages?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const messages = extractMessages(body.messages)
  if (!messages.some(message => message.role === 'user')) {
    return Response.json({ error: 'La solicitud debe incluir al menos un mensaje de usuario.' }, { status: 400 })
  }

  try {
    const providerResult = await callProvider(messages)
    if (providerResult?.text) {
      return Response.json(providerResult)
    }
  } catch (error) {
    console.error('Chat provider error:', error)
  }

  return Response.json({ text: buildLocalAnswer(messages), provider: 'local' })
}
