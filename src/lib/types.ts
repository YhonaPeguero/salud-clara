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
  presupuesto_inicial_MM: number
  presupuesto_vigente_MM: number
  devengado_MM: number
  pct_ejecucion: number
  poblacion_beneficiaria_aprox: number
  mes_corte: string
  es_hero: boolean
}

export interface MinsalEstablecimiento {
  nombre: string
  servicio_salud_id: string
  espera_cirugia: number
  espera_consulta_especialidad: number
  variacion_cirugia_pct: number | null
  variacion_consulta_pct: number | null
  fecha_corte: string
  es_hero: boolean
}

export interface SearchResult {
  entry: MappingEntry
  dipres: DipresServicio
  minsal: MinsalEstablecimiento | null
  parrafo: string
  score: number
}
