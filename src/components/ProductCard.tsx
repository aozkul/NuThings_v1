import Link from "next/link";
import {Product} from "@/src/lib/types";

export default function ProductCard({p}: { p: Product }) {
  return (
    <Link href={`/products/${p.slug ?? p.id}`} className="card overflow-hidden block group">
      <img src={p.image_url || "/placeholder.png"} alt={p.image_alt || p.name}
           className="aspect-[4/3] w-full object-cover group-hover:opacity-95 transition"/>
      <div className="p-4">
        <h3 className="font-medium">{p.name}</h3>
        {typeof p.price === "number" && <p className="text-sm text-neutral-600 mt-1">{p.price.toFixed(2)} €</p>}
      </div>
    </Link>
  );
}
