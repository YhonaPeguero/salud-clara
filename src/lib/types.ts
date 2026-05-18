export interface MappingEntry {
  id: string
  display_nombre: string
  tipo: 'hospital' | 'cesfam' | 'crs' | 'otro' | 'comuna'
  servicio_salud_id: string
  servicio_salud_nombre: string
  region: string
  comunas: string[]
  search_terms: string[]
  establecimiento_principal_id?: string
  es_hero: boolean
}

export interface DipresServicio {
  nombre: string
  region: string
  presupuesto_inicial_MM: number | null
  presupuesto_vigente_MM: number | null
  devengado_MM: number | null
  pct_ejecucion: number | null
  poblacion_beneficiaria_aprox: number | null
  mes_corte: string | null
  url_fuente_real?: string | null
  es_hero: boolean
}

export interface MinsalEstablecimiento {
  nombre: string
  servicio_salud_id: string
  es_hero: boolean
}

export interface MinsalHistoricoPunto {
  trimestre: string
  espera_cirugia: number | null
  espera_consulta_especialidad: number | null
}

export interface MinsalServicio {
  nombre_servicio: string
  espera_cirugia: number | null
  espera_consulta_especialidad: number | null
  variacion_cirugia_pct: number | null
  variacion_consulta_pct: number | null
  fecha_corte: string | null
  historico?: MinsalHistoricoPunto[]
  url_fuente_real?: string | null
  nota?: string
}

export interface SearchResult {
  entry: MappingEntry
  dipres: DipresServicio
  establecimiento: MinsalEstablecimiento | null
  minsal: MinsalServicio | null
  parrafo: string
  score: number
}
