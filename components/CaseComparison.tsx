import Image from "next/image";

type ComparisonImage = {
  src: string;
  alt: string;
  label: string;
  detail: string;
};

type CaseComparisonProps = {
  original: ComparisonImage;
  candidate: ComparisonImage;
};

export function CaseComparison({ original, candidate }: CaseComparisonProps) {
  return (
    <figure className="case-comparison">
      <div className="case-comparison-grid">
        {[original, candidate].map((image) => (
          <div className="case-image-panel" key={image.label}>
            <div className="case-image-heading">
              <span>{image.label}</span>
              <p>{image.detail}</p>
            </div>
            <Image
              src={image.src}
              alt={image.alt}
              width={1000}
              height={1000}
              sizes="(max-width: 720px) 100vw, 50vw"
              priority
            />
          </div>
        ))}
      </div>
      <figcaption>
        Controlled comparison images approved for public Pairvu documentation. The candidate intentionally changes one
        product attribute.
      </figcaption>
    </figure>
  );
}
