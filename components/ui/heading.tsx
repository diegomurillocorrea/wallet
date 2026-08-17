import clsx from 'clsx'

type HeadingProps = { level?: 1 | 2 | 3 | 4 | 5 | 6 } & React.ComponentPropsWithoutRef<
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
>

export function Heading({ className, level = 1, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`

  return (
    <Element
      {...props}
      className={clsx(className, 'font-display text-3xl uppercase leading-[0.9] tracking-tight text-current sm:text-4xl')}
    />
  )
}

/* Título de panel: el mismo tamaño en toda la app para que las columnas de una
   misma rejilla no compitan entre sí. */
export function Subheading({ className, level = 2, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`

  return (
    <Element
      {...props}
      className={clsx(className, 'font-display text-xl uppercase tracking-tight text-current sm:text-2xl')}
    />
  )
}
