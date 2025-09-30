// src/components/legal/LegalShell.tsx
import React, {ReactNode} from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function LegalShell({title, subtitle, children}: Props) {
  const items = React.Children.toArray(children); // 🔑 auto-key

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </header>

      {/* prose kaldırıldı; kartlarınızın kendi stilini bozmuyor */}
      <div className="space-y-6">
        {items}
      </div>
    </main>
  );
}
