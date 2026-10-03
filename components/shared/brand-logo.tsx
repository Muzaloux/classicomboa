import Image from 'next/image'

export function BrandLogo() {
  return <><Image className="brand-logo" src="/classico-mboa-logo-transparent.png" alt="" width={48} height={48} sizes="48px" /><span className="brand-name">EL CLASSICO <b>MBOA</b></span></>
}
