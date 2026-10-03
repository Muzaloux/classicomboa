import type { CSSProperties } from 'react'
import type { EventPhotoData } from '../data/event-photos'

export const photoRatio = (photo: EventPhotoData) => ({ '--ar': `${photo.width} / ${photo.height}`, '--arn': photo.width / photo.height }) as CSSProperties
