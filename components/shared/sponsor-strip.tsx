import Image from 'next/image'
import { sponsors } from '../../data/sponsors'

export function SponsorStrip() {
  return <section className="sponsor-strip" aria-labelledby="sponsor-strip-title">
    <div className="sponsor-strip-heading">
      <span className="eyebrow">PARTENAIRES CONFIRMÉS</span>
      <h2 id="sponsor-strip-title">Ils font vivre<br /><span>le Mboa.</span></h2>
    </div>
    <div className="sponsor-logos">
      {sponsors.map((sponsor) => <div className="sponsor-logo" key={sponsor.id}>
        <Image src={sponsor.image} alt={sponsor.alt} width={420} height={220} sizes="(max-width: 600px) 42vw, 220px" />
        <span>{sponsor.name}</span>
      </div>)}
    </div>
  </section>
}
