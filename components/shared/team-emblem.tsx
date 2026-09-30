import Image from 'next/image'
import realEmblem from '../../public/images/realmboa.png'
import barcaEmblem from '../../public/images/barcamboa.png'

const emblems = {
  'real-mboa': { image: realEmblem, name: 'Real Mboa' },
  'barca-mboa': { image: barcaEmblem, name: 'Barça Mboa' },
}

export function TeamEmblem({ team }: { team: string }) {
  const emblem = emblems[team as keyof typeof emblems]
  if (!emblem) return null
  return <Image className="team-emblem" src={emblem.image} alt={`Emblème ${emblem.name}`} sizes="(max-width: 720px) 64px, 96px" />
}
