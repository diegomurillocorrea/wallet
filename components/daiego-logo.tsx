import Image from "next/image"

const LOGO_SRC = "/DAIEGO.png"

type DaiegoLogoProps = {
  className?: string
  /** Ratio intrínseco; el PNG de marca es 1:1 (2048×2048). */
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
}

export const DaiegoLogo = ({
  className = "",
  width = 1024,
  height = 1024,
  priority = false,
  sizes,
}: DaiegoLogoProps) => {
  return (
    <Image
      src={LOGO_SRC}
      alt="DAIEGO"
      width={width}
      height={height}
      sizes={sizes}
      quality={95}
      className={`object-contain ${className}`}
      priority={priority}
    />
  )
}
