import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

function privateVariantLoader({ src, width, quality }: ImageLoaderProps) {
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  const url = new URL(src);
  url.searchParams.set("width", String(width));
  if (quality) url.searchParams.set("quality", String(quality));
  return url.toString();
}

export function Img({ alt, ...props }: ImageProps) {
  return <Image loader={privateVariantLoader} alt={alt} {...props} />;
}
