/*
 * `input[type=color]` no acepta el tratamiento de vidrio de los demás campos
 * (el navegador dibuja la muestra), así que se le da un marco consistente y
 * se deja la muestra a pantalla completa dentro del control.
 */
export const colorInputClass = [
  "mt-3 h-11 w-full cursor-pointer rounded-xl border border-zinc-950/12 bg-(--glass-field) p-1",
  "transition-[border-color,box-shadow] duration-150 ease-glass",
  "hover:border-zinc-950/22",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
  "dark:border-butter/18 dark:bg-ink/20 dark:hover:border-butter/30 dark:focus-visible:outline-butter",
  "[&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0",
  "[&::-webkit-color-swatch-wrapper]:p-0",
  "[&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-0",
].join(" ")
