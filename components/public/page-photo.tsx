import { getEventPhoto } from '../../data/event-photos'
import { EventPhoto } from '../shared/event-photo'
import { photoRatio } from '../../lib/photo-ratio'
const placements: Record<string,string> = { '/classico':'teams-together','/teams':'teams-together','/players':'warmup','/programme':'entertainment','/tickets':'stands','/vote':'rivalry','/stands':'crowd','/partner':'team-memory','/contact':'supporters' }
export function PagePhoto({path}: {path:string}) {
 const id=placements[path]
 if(!id) return null
 const photo=getEventPhoto(id)
 return <figure className="page-event-photo"><div style={photoRatio(photo)}><EventPhoto photo={photo} sizes="(max-width: 720px) 100vw, 1100px" /></div><figcaption>{photo.caption} · Archives Classico Mboa</figcaption></figure>
}
