import Image from 'next/image'
import { sponsors } from '../../data/sponsors'

export function SponsorStrip() {
  return <section className="sponsor-strip" aria-labelledby="sponsor-strip-title">
    <div className="sponsor-strip-heading">
      <span className="eyebrow">PARTENAIRES CONFIRMÉS</span>
      <h2 id="sponsor-strip-title">Ils font vivre<br /><span>le Mboa.</span></h2>
    </div>
    <div className="sponsor-logos">
      {sponsors.map((sponsor) => <div className={`sponsor-logo ${sponsor.featured ? 'sponsor-logo-featured' : ''}`} key={sponsor.id}>
        <Image src={sponsor.image} alt={sponsor.alt} width={900} height={900} sizes="(max-width: 600px) 90vw, 420px" />
        <span className="sponsor-tier">{sponsor.tier}</span><strong>{sponsor.name}</strong>
      </div>)}
    </div>
  </section>
}
