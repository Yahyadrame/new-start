/**
 * En-têtes de sécurité de toutes les pages (NS-603). Pas de Content-Security-Policy ici : elle demande un nonce
 * pour les scripts de Next.js, ticket à part. Le micro reste permis pour le site (dictée, appels), pas la caméra ni la position.
 * @returns {{ source: string; headers: { key: string; value: string }[] }[]}
 */
export function securityHeaders() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      ],
    },
  ];
}
