/** Grand côté d'une photo envoyée : assez pour un écran, et bien sous les 4 Mo acceptés par l'API. */
const MAX_SIDE = 1600;

/** Réduit une photo avant l'envoi et la rend en JPEG ; null si le navigateur ne sait pas la lire. */
export async function compressImage(file: Blob): Promise<Blob | null> {
  try {
    // `from-image` : une photo prise à la verticale reste à la verticale.
    const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return null;
    // Le JPEG n'a pas de transparence : sans fond blanc, elle deviendrait noire.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  } catch {
    return null;
  }
}
