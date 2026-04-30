import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`rounded-[var(--color-radius)] border border-border bg-card text-card-foreground overflow-hidden ${hover ? "transition-shadow hover:shadow-md" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="aspect-[3/4] bg-muted overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform hover:scale-105"
        loading="lazy"
      />
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
