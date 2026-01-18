// Role : Normaliser une URL pour s'assurer qu'elle utilise le protocole HTTPS.
// Preconditions : Aucune (accepte null/undefined).
// Postconditions : Renvoie une URL valide commencant par 'https://' ou une chaine vide si l'entree est invalide.
export const ensureHttpsUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice(7)}`;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return trimmed;
};
