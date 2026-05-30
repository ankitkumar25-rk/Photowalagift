import { Helmet } from 'react-helmet-async';

/**
 * Reusable SEO Component for Photowala Gift storefront.
 * Inject dynamic titles, descriptions, open graph details, and schema JSON-LD markups.
 */
export default function SEO({
  title,
  description = 'Photowala Gift is India\'s premium platform for handcrafted personalised gifts, custom trophies, machine mementos, and luxury corporate awards. Quick shipping across India.',
  keywords = 'personalised gifts India, custom trophies, photo gift online, corporate awards, custom plaques, engraved mementos, laser marking, Photowala Gift',
  image = '/images/og-default.jpg',
  url = window.location.href,
  type = 'website',
  schemaMarkup = null
}) {
  const siteTitle = title 
    ? `${title} | Photowala Gift` 
    : 'Photowala Gift – Premium Personalised Gifts, Trophies & Mementos India';

  // Ensure absolute image URL for crawlers
  const ogImageUrl = image.startsWith('http') 
    ? image 
    : `${window.location.origin}${image}`;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph (Facebook / WhatsApp / Instagram / LinkedIn) */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content="Photowala Gift" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Structured Schema JSON-LD Markups */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}
