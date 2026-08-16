import clsx from 'clsx'

type HeadingProps = { level?: 1 | 2 | 3 | 4 | 5 | 6 } & React.ComponentPropsWithoutRef<
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
>

export function Heading({ className, level = 1, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`

  return (
    <Element
      {...props}
      className={clsx(className, 'font-display text-3xl uppercase leading-[0.9] tracking-tight text-ink sm:text-4xl')}
    />
  )
}

export function Subheading({ className, level = 2, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`

  return (
    <Element
      {...props}
      className={clsx(className, 'font-display text-lg uppercase tracking-tight text-ink sm:text-base')}
    />
  )
}
