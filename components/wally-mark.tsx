import Image from "next/image"
import clsx from "clsx"

const MARK_SRC = {
  butter: "/04_icon_butter_transparent.png",
  forest: "/03_icon_forest_transparent.png",
} as const

interface WallyMarkProps {
  className?: string
  /** `butter` sobre verde o negro; `forest` sobre arena o blanco */
  variant?: keyof typeof MARK_SRC
  priority?: boolean
}

export function WallyMark({
  className = "size-10",
  variant = "butter",
  priority = false,
}: WallyMarkProps) {
  return (
    <Image
      src={MARK_SRC[variant]}
      alt=""
      width={64}
      height={64}
      priority={priority}
      className={clsx("object-contain", className)}
      aria-hidden
    />
  )
}
