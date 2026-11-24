import type { MetadataRoute } from 'next';

/** Manifeste de l'application installée (écran d'accueil). Les PNG sont pleins, sans transparence. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'New Start',
    short_name: 'New Start',
    description: 'Apprends à parler anglais en discutant avec des contacts IA.',
    lang: 'fr',
    start_url: '/chats',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
