"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChartIcon, HomeIcon, ListIcon, PlusIcon } from "./Icons";

const TABS = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/calendar", label: "캘린더", Icon: CalendarIcon },
  { href: "/new", label: "추가", Icon: PlusIcon, primary: true },
  { href: "/list", label: "목록", Icon: ListIcon },
  { href: "/stats", label: "통계", Icon: ChartIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {TABS.map(({ href, label, Icon, primary }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`tab${active ? " active" : ""}${primary ? " primary" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="tab-icon">
              <Icon size={primary ? 24 : 22} />
            </span>
            <span className="tab-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
