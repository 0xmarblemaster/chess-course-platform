import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        progress: "#32CD32",
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'chess-gold': '#C2A580',
        'chess-maroon': '#5F192B',
      },
      fontFamily: {
        unbounded: ['var(--font-unbounded)'],
      },
    },
  },
  plugins: [],
}
export default config
