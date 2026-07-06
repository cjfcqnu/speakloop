import type { ReactNode } from "react";
import { Icon } from "./Icons";

type NavItem = {
  path: string;
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
};

const navItems: NavItem[] = [
  { path: "/", label: "首页", icon: "home" },
  { path: "/materials", label: "素材", icon: "book" },
  { path: "/practice", label: "练习", icon: "mic" },
  { path: "/review", label: "复习", icon: "calendar" },
  { path: "/settings", label: "设置", icon: "settings" },
];

export function AppShell({
  route,
  navigate,
  children,
}: {
  route: string;
  navigate: (path: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-frame">
      <header className="top-bar">
        <button className="brand-button" onClick={() => navigate("/")} type="button">
          <span className="brand-mark">S</span>
          <span>SpeakLoop</span>
        </button>
      </header>
      <main className="app-content">{children}</main>
      <nav className="bottom-nav" aria-label="主导航">
        {navItems.map((item) => {
          const isActive = route === item.path || (item.path !== "/" && route.startsWith(item.path));
          return (
            <button
              className={isActive ? "active" : ""}
              key={item.path}
              onClick={() => navigate(item.path)}
              type="button"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
