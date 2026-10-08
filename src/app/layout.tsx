/**
 * Root layout — passthrough only.
 * The real html/body document lives in app/[locale]/layout.tsx.
 * This exists so non-localized routes (e.g. global not-found) have a layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
