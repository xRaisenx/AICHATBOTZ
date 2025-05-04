// components/ProductCard.tsx
import Image from 'next/image';
import { FaImage } from 'react-icons/fa';

interface ProductCardProps {
  title: string;
  description: string;
  price: string;
  image: string | null;
  landing_page: string;
}

export function ProductCard({ title, description, price, image, landing_page }: ProductCardProps) {
  return (
    <a
      href={landing_page || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="product-card" // Applied via @layer components in globals.css
      aria-label={`View product: ${title}`}
    >
      <div className="product-image-container"> {/* Applied via @layer components */}
        {image ? (
          <Image
            src={image}
            alt={`Product image for ${title}`}
            width={80}
            height={80}
            className="product-image" // Applied via @layer components
            unoptimized={image.includes('cdn.shopify.com')}
            onError={(e) => {
                console.warn(`Failed to load image: ${image}`);
                // Simple hide on error, placeholder will show behind if positioned correctly
                 (e.target as HTMLImageElement).style.opacity = '0';
                 (e.target as HTMLImageElement).style.position = 'absolute'; // Prevent layout shift
            }}
          />
        ) : (
          // Placeholder icon if image is null or fails to load (can be enhanced)
          <FaImage className="image-placeholder" aria-hidden="true" /> // Applied via @layer components
        )}
      </div>
      <div className="product-info"> {/* Applied via @layer components */}
        <div className="product-name">{title || 'Unnamed Product'}</div> {/* Applied via @layer components */}
        <div className="product-description">{description || 'No description available.'}</div> {/* Applied via @layer components */}
        {/* Conditionally render price only if valid */}
        {price && price !== "N/A" && price.trim() !== '' && (
            <div className="product-price">{price}</div> /* Applied via @layer components */
        )}
      </div>
    </a>
  );
}