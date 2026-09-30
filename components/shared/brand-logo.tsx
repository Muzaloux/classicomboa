import Image from 'next/image'

export function BrandLogo() {
  return <><Image className="brand-logo" src="/mboalogo.PNG" alt="" width={48} height={48} sizes="48px" /><span className="brand-name">CLASSICO <b>MBOA</b></span></>
}
