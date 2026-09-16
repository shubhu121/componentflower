import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Floral Bloom Cards',
  description: 'Interactive card component demo where painterly watercolor flowers bloom on hover using custom shaders and artistic generative brushes.',
  openGraph: {
    title: 'Floral Bloom Cards',
    description: 'Interactive card component demo where painterly watercolor flowers bloom on hover using custom shaders and artistic generative brushes.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Floral Bloom Cards',
    description: 'Interactive card component demo where painterly watercolor flowers bloom on hover using custom shaders and artistic generative brushes.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
