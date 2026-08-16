interface WallyMarkProps {
  className?: string
}

/** Marca geométrica: círculo + W. Color vía `currentColor`. */
export function WallyMark({ className = "size-10" }: WallyMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <path
        d="M8.2 10.2h3.05l1.72 8.05 2.08-6.35h1.9l2.08 6.35 1.72-8.05H23.8L20.4 21.8h-2.2L16 15.4l-2.2 6.4h-2.2L8.2 10.2Z"
        fill="var(--wally-counter, #ffefb3)"
      />
    </svg>
  )
}
