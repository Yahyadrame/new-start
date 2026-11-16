export type Session = {
  accessToken: string;
  expiresInSeconds: number;
  user: { id: string; firstName: string; goal: string; level: string };
};

// Le jeton d'accès reste en mémoire : un rechargement le perd, le cookie de rafraîchissement le rend.
let current: Session | null = null;
export const setSession = (s: Session | null) => {
  current = s;
};
export const getSession = () => current;
