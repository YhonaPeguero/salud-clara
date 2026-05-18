import { getHeroDemos, getDipresPeriodo, getMinsalPeriodo } from '@/lib/search'
import { SearchClient } from '@/components/SearchClient'

export default function Home() {
  const heroes = getHeroDemos()
  const dipresPeriodo = getDipresPeriodo()
  const minsalPeriodo = getMinsalPeriodo()
  return <SearchClient initialHeroes={heroes} dipresPeriodo={dipresPeriodo} minsalPeriodo={minsalPeriodo} />
}
