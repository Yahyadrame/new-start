/**
 * Service worker de New Start (NS-611) : il ne gère que les notifications push.
 * Le cache hors connexion viendra avec NS-305 ; ces deux gestionnaires seront alors déplacés dans le worker généré.
 * Le payload vient de l'API : { title, body, url? }.
 */

/** N'accepte qu'un chemin du site : jamais une adresse externe ni `//hôte`. */
function safePath(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}

self.addEventListener('push', (event) => {
  let payload;
  try {
    payload = event.data?.json();
  } catch {
    return;
  }
  if (!payload || typeof payload.title !== 'string') return;
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: typeof payload.body === 'string' ? payload.body : undefined,
      data: { url: safePath(payload.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = safePath(event.notification.data?.url);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows[0];
      if (!open) return self.clients.openWindow(url);
      return open.navigate(url).then((client) => (client ?? open).focus());
    }),
  );
});
