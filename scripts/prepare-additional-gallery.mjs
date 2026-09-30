import fs from 'node:fs/promises'
import sharp from 'sharp'

const selections = [
  ['archive-6662', 'IMG_6662.JPG', 'Football'],
  ['archive-6663', 'IMG_6663.JPG', 'Football'],
  ['archive-6667-2', 'IMG_6667 2.JPG', 'Équipes'],
  ['archive-6670', 'IMG_6670.JPG', 'Football'],
  ['archive-6672', 'IMG_6672.JPG', 'Ambiance'],
  ['archive-6673', 'IMG_6673.JPG', 'Football'],
  ['archive-6674', 'IMG_6674.JPG', 'Football'],
  ['archive-6675', 'IMG_6675.JPG', 'Football'],
  ['archive-6679', 'IMG_6679.JPG', 'Football'],
  ['archive-6680', 'IMG_6680.JPG', 'Football'],
  ['archive-6681', 'IMG_6681.JPG', 'Football'],
  ['archive-6682', 'IMG_6682.JPG', 'Football'],
  ['archive-6683', 'IMG_6683.JPG', 'Football'],
  ['archive-6684', 'IMG_6684.JPG', 'Football'],
  ['archive-6685', 'IMG_6685.JPG', 'Football'],
  ['archive-6686', 'IMG_6686.JPG', 'Équipes'],
  ['archive-6689', 'IMG_6689.JPG', 'Ambiance'],
  ['archive-6690', 'IMG_6690.JPG', 'Ambiance'],
  ['archive-6691', 'IMG_6691.JPG', 'Ambiance'],
]

const descriptions = {
  'archive-6662': ['Football', 'Les couleurs du Barça', 'Un joueur en maillot bleu et rouge, numéro 10, sur la pelouse.'],
  'archive-6663': ['Ambiance', 'La passion dans les tribunes', 'Des spectateurs suivent le match depuis les gradins.'],
  'archive-6667-2': ['Équipes', 'Le Barça réuni', 'Les joueurs en bleu et rouge posent ensemble sur le terrain.'],
  'archive-6670': ['Équipes', 'Avant le coup d’envoi', 'Des joueurs et les arbitres posent au centre du terrain.'],
  'archive-6672': ['Ambiance', 'Le Classico côté public', 'Des spectateurs discutent et suivent la rencontre dans les tribunes.'],
  'archive-6673': ['Ambiance', 'Entre supporters', 'Deux spectateurs au premier plan dans les gradins du stade.'],
  'archive-6674': ['Ambiance', 'Un rendez-vous partagé', 'Le public installé dans les tribunes du stade.'],
  'archive-6675': ['Ambiance', 'Au premier rang', 'Des spectatrices assises dans les gradins pendant le Classico.'],
  'archive-6679': ['Équipes', 'Ensemble avant le match', 'Une équipe en maillots orange pose dans un espace intérieur.'],
  'archive-6680': ['Équipes', 'L’entrée des joueurs', 'Des joueurs en tenue sombre descendent un escalier.'],
  'archive-6681': ['Équipes', 'Sous les projecteurs', 'Une équipe en maillots sombres pose sur la pelouse de nuit.'],
  'archive-6682': ['Équipes', 'L’équipe en orange', 'Des joueurs en maillots orange posent ensemble sur le terrain de nuit.'],
  'archive-6683': ['Célébrations', 'Le trophée à l’honneur', 'Deux personnes en tee-shirts verts tiennent un trophée sur le terrain.'],
  'archive-6684': ['Célébrations', 'Un souvenir de victoire', 'Un homme en costume tient un trophée aux côtés des participants.'],
  'archive-6685': ['Football', 'Prêts à jouer', 'Trois joueurs en orange attendent près du ballon sur la pelouse.'],
  'archive-6686': ['Football', 'En place sur le terrain', 'Des joueurs en maillots clairs se rassemblent pendant la rencontre.'],
  'archive-6689': ['Équipes', 'Le Real réuni', 'Une équipe en maillots blancs pose devant les tribunes jaunes.'],
  'archive-6690': ['Équipes', 'La photo d’équipe', 'Une équipe en maillots dorés pose sur le terrain.'],
  'archive-6691': ['Ambiance', 'Les tribunes vivent le match', 'Des supporters debout dans les gradins du stade.'],
}

await fs.mkdir('public/images/events', { recursive: true })
const photos = []
for (const [id, source] of selections) {
  const [category, caption, alt] = descriptions[id]
  const input = `Event Images/${source}`
  const output = `public/images/events/${id}.webp`
  const result = await sharp(input).rotate().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(output)
  const blur = await sharp(output).resize(16).webp({ quality: 40 }).toBuffer()
  photos.push({
    id,
    src: `/images/events/${id}.webp`,
    source,
    category,
    alt,
    caption,
    position: id === 'archive-6663' ? '50% 42%' : '50% 50%',
    width: result.width,
    height: result.height,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  })
}

await fs.writeFile('data/additional-event-photos.ts', `import type { EventPhotoData } from './event-photos'\n\nexport const additionalEventPhotos: EventPhotoData[] = ${JSON.stringify(photos, null, 2)}\n\nexport function getAdditionalEventPhoto(id: string): EventPhotoData {\n  const photo = additionalEventPhotos.find((photo) => photo.id === id)\n  if (!photo) throw new Error('Unknown archive photo: ' + id)\n  return photo\n}\n`)
console.log(`Prepared ${photos.length} additional gallery photos.`)
