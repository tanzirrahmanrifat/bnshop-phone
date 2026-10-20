import Image from "next/image";
import { Icon } from "@/components/Icon";

export function ProductImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, 25vw",
  priority = false,
  className = "",
}: {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`flex aspect-square w-full items-center justify-center bg-[#eceef2] text-subtle ${className}`}>
        <Icon name="image" size={40} />
        <span className="sr-only">{alt}</span>
      </div>
    );
  }
  return (
    <div className={`relative aspect-square w-full overflow-hidden bg-[#eceef2] ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
