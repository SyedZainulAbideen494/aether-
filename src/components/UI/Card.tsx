import { clsx } from 'clsx'
export default function Card({ children, className }: any) {
  return <div className={clsx('bg-elevated border border-line rounded-2xl p-5', className)}>{children}</div>
}
