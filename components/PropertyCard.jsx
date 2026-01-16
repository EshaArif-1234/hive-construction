import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default function PropertyCard({
  id,
  imageSrc,
  imageLabel,
  title,
  location,
  price,
  status,
}) {
  const statusText = status ?? "Available";
  const isAvailable = statusText === "Available";
  const isInProgress = statusText === "In Progress";
  const detailsHref = id ? `/properties/${id}` : "/properties";
  const primaryText = title ?? location;

  return (
    <div className="overflow-hidden rounded-2xl border border-hive-taupe/20 bg-hive-light shadow-sm">
      <div className="relative h-44 w-full bg-gradient-to-br from-hive-slate to-hive-charcoal">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={primaryText ?? "Property image"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-hive-light/80">
              {imageLabel ?? "Property Image"}
            </span>
          </div>
        )}

        <div className="absolute left-4 top-4">
          <StatusBadge status={statusText} />
        </div>
      </div>

      <div className="p-6">
        {primaryText ? (
          <p className="text-sm font-semibold text-hive-charcoal">
            {primaryText}
          </p>
        ) : null}

        {location && title ? (
          <p className="mt-1 text-sm text-hive-slate">{location}</p>
        ) : null}

        {price ? (
          <p className="mt-3 text-sm font-semibold text-hive-charcoal">
            {price}
          </p>
        ) : (
          <p className="mt-2 text-sm text-hive-slate">
            Residential development opportunity with secured investor
            protection.
          </p>
        )}

        <div className="mt-5">
          <Link
            href={detailsHref}
            className="inline-flex w-full items-center justify-center rounded-md bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
