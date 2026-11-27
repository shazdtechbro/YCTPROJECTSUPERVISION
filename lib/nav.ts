import {
  BarChart3,
  CalendarClock,
  FolderKanban,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short label for the mobile bottom tab bar. */
  short?: string;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Grouped sidebar per role. URLs are namespaced by role so route groups never collide. */
export const NAV_GROUPS: Record<Role, NavGroup[]> = {
  student: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", short: "Home", href: "/student/dashboard", icon: LayoutDashboard },
        { label: "My project", short: "Project", href: "/student/project", icon: FolderKanban },
        { label: "Defence", href: "/student/defence", icon: CalendarClock },
      ],
    },
  ],
  supervisor: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", short: "Home", href: "/supervisor/dashboard", icon: LayoutDashboard },
        { label: "Projects", href: "/supervisor/projects", icon: FolderKanban },
      ],
    },
    {
      label: "Review",
      items: [{ label: "Students", short: "Students", href: "/supervisor/roster", icon: Users }, { label: "Defence", href: "/supervisor/defence", icon: CalendarClock }],
    },
  ],
  hod: [
    {
      label: "Department",
      items: [
        { label: "Overview", short: "Home", href: "/hod/dashboard", icon: LayoutDashboard },
        { label: "Projects", href: "/hod/projects", icon: FolderKanban },
        { label: "Supervisors", href: "/hod/supervisors", icon: Users },
        { label: "Reports", href: "/hod/reports", icon: BarChart3 },
        { label: "Defence", href: "/hod/defence", icon: CalendarClock },
      ],
    },
  ],
};

/** Flat list (kept for any caller that wants every destination). */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: NAV_GROUPS.student.flatMap((g) => g.items),
  supervisor: NAV_GROUPS.supervisor.flatMap((g) => g.items),
  hod: NAV_GROUPS.hod.flatMap((g) => g.items),
};
