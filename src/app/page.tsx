import { getHeroDemos } from '@/lib/search'
import { SearchClient } from '@/components/SearchClient'

export default function Home() {
  const heroes = getHeroDemos()
  return <SearchClient initialHeroes={heroes} />
}
