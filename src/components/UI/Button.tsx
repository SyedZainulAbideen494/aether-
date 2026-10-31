import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export default function Button({ children, onClick, variant = 'primary', className, disabled, type = 'button' }: any) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed'
  const variants: any = {
    primary: 'bg-accent text-white hover:bg-accent-strong shadow-glow',
    secondary: 'bg-white/5 text-ink hover:bg-white/10 border border-line',
    ghost: 'text-muted hover:text-ink hover:bg-white/5',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/20',
  }
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={clsx(base, variants[variant], className)}
    >
      {children}
    </motion.button>
  )
}
