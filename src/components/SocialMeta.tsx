interface SocialMetaProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: 'website' | 'article' | 'video' | 'music';
  siteName?: string;
  locale?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

export default function SocialMeta({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'Komplexáci',
  locale = 'cs_CZ',
  twitterCard = 'summary_large_image',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = []
}: SocialMetaProps) {
  // Ensure image is absolute URL
  const absoluteImage = image.startsWith('http') ? image : `https://www.komplexaci.cz${image}`;
  const absoluteUrl = url.startsWith('http') ? url : `https://www.komplexaci.cz${url}`;

  return (
    <>
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:url" content={absoluteUrl} />
      <meta name="twitter:site" content="@komplexaci" />
      <meta name="twitter:creator" content="@mpenkava1337" />

      {/* WhatsApp specific meta tags */}
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:secure_url" content={absoluteImage} />
      
      {/* Additional meta tags for better sharing */}
      <meta name="theme-color" content="#6e4ff6" />
      <meta name="msapplication-TileColor" content="#6e4ff6" />
      
      {/* Telegram specific */}
      <meta property="telegram:channel" content="@komplexaci" />
    </>
  );
}
