interface ReviewSchemaProps {
  itemName: string;
  itemType?: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
  description?: string;
  url?: string;
}

export default function ReviewSchema({
  itemName,
  itemType = "Organization",
  ratingValue,
  reviewCount,
  bestRating = 5,
  worstRating = 1,
  description,
  url
}: ReviewSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": itemType,
    "name": itemName,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue,
      "reviewCount": reviewCount,
      "bestRating": bestRating,
      "worstRating": worstRating
    }
  };

  if (description) {
    (schema as any).description = description;
  }

  if (url) {
    (schema as any).url = url;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}
