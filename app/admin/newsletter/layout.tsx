"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

export const dynamic = "force-dynamic";

const coreNav = [
    {href: "/admin", label: "Genel Bakış", emoji: "📊"},
    {href: "/admin?tab=categories", label: "Kategoriler", emoji: "🗂️"},
    {href: "/admin?tab=products", label: "Ürünler", emoji: "🧺"},
    {href: "/admin?tab=settings", label: "Ayarlar", emoji: "⚙️"},
];

const newsletterNav = [
    {href: "/admin/newsletter", label: "Aboneler", emoji: "📧"},
    {href: "/admin/newsletter/campaign", label: "Kampanyalar", emoji: "📢"},
];

function NavLink({
                     href,
                     label,
                     emoji,
                     active,
                     onClick,
                 }: {
    href: string;
    label: string;
    emoji: string;
    active: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={
                "w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border " +
                (active ? "bg-black text-white border-black" : "hover:bg-neutral-50")
            }
            aria-current={active ? "page" : undefined}
        >
            <span className="text-base select-none">{emoji}</span>
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}

export default function NewsletterLayout({children}: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        // /admin rotaları query ile tab değiştiriyor; burada sadece path'e bakıyoruz.
        if (href === "/admin") return pathname === "/admin";
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <div className="relative">
            {/* Header */}
            <div className="bg-gradient-to-b from-neutral-50 to-transparent h-32"/>
            <div className="container-tight -mt-24">
                <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Yönetim Paneli</h1>
                            <p className="text-sm text-neutral-600">
                                İçeriğinizi ve ayarlarınızı buradan yönetin.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-[220px,1fr] gap-4 md:gap-6">
                        {/* Sidebar */}
                        <aside className="hidden md:block">
                            <div className="space-y-2">
                                {coreNav.map((n) => (
                                    <NavLink key={n.href} {...n} active={isActive(n.href)}/>
                                ))}

                                <div className="my-3 h-px bg-neutral-200"/>

                                {newsletterNav.map((n) => (
                                    <NavLink key={n.href} {...n} active={isActive(n.href)}/>
                                ))}
                            </div>
                        </aside>

                        {/* Content */}
                        <section className="min-h-[60vh]">{children}</section>
                    </div>
                </div>
            </div>
        </div>
    );
}
