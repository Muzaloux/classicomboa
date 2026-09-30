import fs from 'node:fs/promises'
import sharp from 'sharp'
const selections = [
 ['match-action','IMG_6671.JPG','Football','Deux joueurs poursuivent le ballon sur le terrain.','Le duel sur le terrain','60% 50%'],
 ['rivalry','IMG_6659.JPG','Football','Un joueur en bleu et rouge protège le ballon face à un joueur en blanc.','Au cœur du match','50% 40%'],
 ['real-team','IMG_6665.JPG','Équipes','Une équipe en maillots blancs pose sur la pelouse.','Ensemble sur la pelouse','50% 45%'],
 ['barca-team','IMG_6669.JPG','Équipes','Une équipe en maillots bleus et rouges pose avant une rencontre.','Les couleurs du Classico','50% 45%'],
 ['teams-together','IMG_6667.JPG','Équipes','Les deux équipes réunies pour une photo sur le terrain.','Une passion partagée','50% 50%'],
 ['crowd','IMG_6668.JPG','Ambiance','Des spectateurs sourient et filment depuis les tribunes.','Le Classico se vit ensemble','50% 45%'],
 ['entertainment','IMG_6677.JPG','Ambiance','Un animateur au microphone échange avec le public.','La parole aux tribunes','40% 45%'],
 ['supporters','IMG_6676.JPG','Ambiance','Des spectateurs réunis dans les tribunes du stade.','L’énergie du public','50% 35%'],
 ['white-action','IMG_6661.JPG','Football','Un joueur en blanc frappe le ballon.','Le geste et la passion','50% 45%'],
 ['blue-action','IMG_6660.JPG','Football','Un joueur en bleu et rouge conduit le ballon.','Le ballon au pied','50% 50%'],
 ['goalkeeper','IMG_6678.JPG','Football','Un gardien s’élance devant le but.','Dans les airs','50% 45%'],
 ['warmup','IMG_6688.JPG','Football','Des joueurs en chasubles courent ensemble.','Avant le coup d’envoi','50% 50%'],
 ['stands','IMG_6691.JPG','Ambiance','Des supporters debout encouragent depuis les tribunes.','La ferveur des tribunes','50% 50%'],
 ['team-memory','IMG_6687.JPG','Équipes','Des joueurs en blanc et doré posent ensemble sur la pelouse.','Les souvenirs se construisent ensemble','50% 50%'],
]
await fs.mkdir('public/images/events',{recursive:true})
const photos=[]; let inputBytes=0,outputBytes=0
for(const [id,source,category,alt,caption,position] of selections){
 const input='Event Images/'+source, output='public/images/events/'+id+'.webp'
 inputBytes+=(await fs.stat(input)).size
 const result=await sharp(input).rotate().resize({width:1280,withoutEnlargement:true}).webp({quality:82,effort:6}).toFile(output)
 outputBytes+=result.size
 const blur=await sharp(output).resize(16).webp({quality:40}).toBuffer()
 photos.push({id,src:'/images/events/'+id+'.webp',source,category,alt,caption,position,width:result.width,height:result.height,blurDataURL:'data:image/webp;base64,'+blur.toString('base64')})
}
await fs.writeFile('data/event-photos.ts','export const eventPhotos = '+JSON.stringify(photos,null,2)+' as const\nexport interface EventPhotoData {\n id: string\n src: string\n source: string\n category: string\n alt: string\n caption: string\n position: string\n width: number\n height: number\n blurDataURL: string\n}\nexport function getEventPhoto(id: string): EventPhotoData {\n const photo = eventPhotos.find((photo) => photo.id === id)\n if (!photo) throw new Error("Unknown event photo: " + id)\n return photo\n}\n')
console.log({photos:photos.length,inputBytes,outputBytes,savedPercent:Math.round((1-outputBytes/inputBytes)*100)})
