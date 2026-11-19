export const metadata = { title: "Cifra", description: "Datos públicos de México, listos para agentes." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 760, margin: "40px auto", padding: "0 16px", lineHeight: 1.55 }}>{children}</body></html>);
}
