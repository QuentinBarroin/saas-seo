/**
 * Pattern d'URL sensible (espace admin, lien de partage, token, UUID).
 *
 * Distingue **slug SEO** (séparateurs `-` entre mots, ex: `/articles/comment-recruter...`)
 * de **token réel** (alphanumérique continu OU UUID v4). Évite les false positives
 * sur les pages content marketing à long slug.
 *
 * Matches :
 *  - `/admin`, `/share`, `/invite`, `/token` comme segments de path
 *  - segment alphanumérique pur ≥ 24 chars sans séparateur (`abc123XYZ...`)
 *  - UUID v4 (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
 *
 * Ne matche PAS :
 *  - `/articles/comment-recruter-product-manager` (slug avec dashes)
 *  - `/missions/freelance-data-scientist-remote` (slug court)
 */
export const SENSITIVE_URL_PATTERN =
  /(?:\/(?:admin|share|invite|token)\b|\/[A-Za-z0-9_]{24,}(?:\/|\?|$)|\/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i;
