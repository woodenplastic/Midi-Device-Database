import React from 'react'
import './globals.css'

export const metadata = {
  title: 'MIDI Device Database Editor',
  description: 'Edit MIDI device parameters and upload icons',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      </head>
      <body>
        <header style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>MIDI Device Database Editor</h1>
        </header>
        <main style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
          {children}
        </main>
      </body>
    </html>
  )
}