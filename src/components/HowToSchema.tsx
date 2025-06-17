interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  image?: string;
  totalTime?: string; // e.g., "PT10M" for 10 minutes
  estimatedCost?: {
    currency: string;
    value: string;
  };
  supply?: string[];
  tool?: string[];
  steps: HowToStep[];
}

export default function HowToSchema({
  name,
  description,
  image,
  totalTime,
  estimatedCost,
  supply = [],
  tool = [],
  steps
}: HowToSchemaProps) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { "image": step.image }),
      ...(step.url && { "url": step.url })
    }))
  };

  if (image) schema.image = image;
  if (totalTime) schema.totalTime = totalTime;
  if (estimatedCost) schema.estimatedCost = estimatedCost;
  if (supply.length > 0) schema.supply = supply;
  if (tool.length > 0) schema.tool = tool;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}
