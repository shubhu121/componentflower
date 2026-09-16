import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Floral Bloom Cards',
  description: 'Interactive generative botanical cards featuring watercolor wildflower meadows, nocturnal bioluminescent ferns and spores, and aquatic water lily ponds with real-time watercolor shaders.',
  openGraph: {
    title: 'Floral Bloom Cards',
    description: 'Interactive generative botanical cards featuring watercolor wildflower meadows, nocturnal bioluminescent ferns and spores, and aquatic water lily ponds with real-time watercolor shaders.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Floral Bloom Cards',
    description: 'Interactive generative botanical cards featuring watercolor wildflower meadows, nocturnal bioluminescent ferns and spores, and aquatic water lily ponds with real-time watercolor shaders.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
