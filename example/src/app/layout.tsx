import type {Metadata} from 'next'

export const metadata: Metadata = {
  title: 'ImageKit <> Sanity demo',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
