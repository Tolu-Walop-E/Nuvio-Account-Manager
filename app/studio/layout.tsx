import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reframe Studio',
  description: 'Design the Reframe TV home layout and send it to a profile',
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
