import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'

// Data imports
import mappingData from '../../../../data/mapping.json'
import dipresData from '../../../../data/dipres_ejecucion.json'
import minsalData from '../../../../data/minsal_espera.json'

const minimax = createOpenAICompatible({
  name: 'minimax',
  baseURL: 'https://api.minimax.chat/v1',
  headers: {
    Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
  },
})

// Build context from data
function buildDataContext() {
  const servicios = Object.keys(mappingData).slice(0, 10).map(servicio => {
    const hospitales = mappingData[servicio as keyof typeof mappingData]
    const presupuesto = dipresData.find(d => d.servicio_salud === servicio)
    const esperaList = minsalData.filter(m => 
      hospitales.some(h => m.establecimiento.toLowerCase().includes(h.toLowerCase()))
    )
    
    return {
      servicio,
      hospitales: hospitales.slice(0, 3),
      presupuesto: presupuesto ? {
        vigente: presupuesto.presupuesto_vigente,
        ejecutado: presupuesto.gasto_devengado,
        porcentaje: presupuesto.porcentaje_ejecucion
      } : null,
      espera: esperaList.slice(0, 2).map(e => ({
        establecimiento: e.establecimiento,
        total: e.casos_totales_espera,
        mayor1ano: e.casos_espera_mas_1_ano
      }))
    }
  })
  
  return JSON.stringify(servicios, null, 2)
}

const SYSTEM_PROMPT = `Eres el asistente de "Salud Transparente", una aplicación que muestra datos públicos de salud de Chile.

DATOS DISPONIBLES:
${buildDataContext()}

INSTRUCCIONES:
- Responde en español chileno, de forma clara y directa
- Si preguntan por un hospital o servicio específico, busca en los datos
- Explica los términos técnicos en lenguaje simple:
  - "Presupuesto vigente" = plata asignada para el año
  - "Gasto devengado" = plata ya gastada
  - "Porcentaje de ejecución" = qué % del presupuesto se ha usado
  - "Lista de espera" = personas esperando atención
  - "Casos >1 año" = personas esperando más de un año
- Sé empático, estos datos afectan la vida de las personas
- Si no tienes el dato, dilo honestamente
- Respuestas cortas y útiles, máximo 3-4 oraciones
- Puedes sugerir que busquen un hospital específico en la app`

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: minimax('MiniMax-Text-01'),
    system: SYSTEM_PROMPT,
    messages,
    maxTokens: 500,
  })

  return result.toDataStreamResponse()
}
