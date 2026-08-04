import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "Swift Tech & Games — Invoice Manager",
  description: "Professional invoice generator for Swift Tech & Games",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full"
        style={{ fontFamily: "'Open Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif" }}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
