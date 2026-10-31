import { clsx } from 'clsx'
export default function Card({ children, className }: any) {
  return <div className={clsx('glass rounded-3xl p-5', className)}>{children}</div>
}
