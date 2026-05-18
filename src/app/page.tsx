import { getHeroDemos, getDipresPeriodo, getMinsalPeriodo, getNationalStats } from '@/lib/search'
import { SearchClient } from '@/components/SearchClient'

export default function Home() {
  const heroes = getHeroDemos()
  const dipresPeriodo = getDipresPeriodo()
  const minsalPeriodo = getMinsalPeriodo()
  const stats = getNationalStats()
  return (
    <SearchClient
      initialHeroes={heroes}
      dipresPeriodo={dipresPeriodo}
      minsalPeriodo={minsalPeriodo}
      stats={stats}
    />
  )
}
