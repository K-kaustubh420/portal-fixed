// Example for app/layout.tsx
import { AuthProvider } from '@/context/AuthContext'; // Adjust path
import './globals.css'; // Your global styles

// Other imports (metadata, fonts, etc.)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider> {/* Wrap with the provider */}
          {/* Your existing layout structure (Navbar might be here or in page) */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}