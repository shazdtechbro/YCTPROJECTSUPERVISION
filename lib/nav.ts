import {
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Per-role sidebar. URLs are namespaced by role so route groups never collide. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "My project", href: "/student/project", icon: FolderKanban },
  ],
  supervisor: [
    {
      label: "Dashboard",
      href: "/supervisor/dashboard",
      icon: LayoutDashboard,
    },
    { label: "Projects", href: "/supervisor/projects", icon: FolderKanban },
    { label: "Students", href: "/supervisor/roster", icon: Users },
  ],
  hod: [
    { label: "Dashboard", href: "/hod/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/hod/projects", icon: FolderKanban },
    { label: "Supervisors", href: "/hod/supervisors", icon: Users },
    { label: "Reports", href: "/hod/reports", icon: ListChecks },
  ],
};
