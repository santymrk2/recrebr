import type { ReactNode } from "react";

type IconName = "birthday" | "school" | "church" | "business" | "family" | "arrow" | "chat";

export function RecrebrIcon({ name, title }: { name: IconName; title?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": title ? undefined : true };
  const paths = {
    birthday: <><path d="M4 10h16v10H4z" /><path d="M12 10v10M4 14h16M7 7c0-1.5 2-1.5 2 0s-2 1.5-2 0Zm4-2c0-1.5 2-1.5 2 0s-2 1.5-2 0Zm4 2c0-1.5 2-1.5 2 0s-2 1.5-2 0Z" /></>,
    school: <><path d="m3 10 9-5 9 5-9 5zM5 13v5M19 13v5M8 16v4h8v-4" /></>,
    church: <><path d="M12 3v5M9.5 5.5h5M5 20V11l7-4 7 4v9M9 20v-4h6v4" /></>,
    business: <><path d="M4 20V8h16v12M8 8V5h8v3M3 12h18M10 16h4" /></>,
    family: <><circle cx="8" cy="7" r="2.5" /><circle cx="16" cy="7" r="2.5" /><path d="M3.5 20v-3.5a4.5 4.5 0 0 1 9 0V20m-2-1v-2.5a4.5 4.5 0 0 1 9 0V20" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-10.8 6.7L4 20l1.8-4.6A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>,
  } satisfies Record<IconName, ReactNode>;

  return <svg {...common} role={title ? "img" : undefined}>{title ? <title>{title}</title> : null}{paths[name]}</svg>;
}
