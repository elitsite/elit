import '../globals.css';

export const metadata = {
  title: 'Admin — Elite Bloemen',
  description: 'Elite Bloemen admin panel',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
