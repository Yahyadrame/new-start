import { useEffect, useState } from 'react';

/** Une photo encore en mémoire, avant que le serveur ait la sienne. */
export function LocalPhoto({
  blob,
  alt,
  className,
}: Readonly<{ blob: Blob; alt: string; className: string }>) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const created = URL.createObjectURL(blob);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [blob]);
  // URL locale : l'optimiseur de Next n'a rien à y faire.
  return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}
