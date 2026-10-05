/**
 * Reads of the denormalised `dashboard_stats/{supervisorId}` doc.
 *
 * Supervisor and HOD dashboards call this on load instead of aggregating live
 * across every project. The doc is refreshed by a Cloud Function write-trigger
 * (see README / functions), never recomputed on the client.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { getDb } from "@/lib/firebase";
import type { ActivityPointDoc, DashboardStatsDoc } from "@/lib/types";
import { dashboardStatsConverter } from "./converters";
import { paths } from "./paths";

export async function getDashboardStats(
  supervisorId: string
): Promise<DashboardStatsDoc | null> {
  const snap = await getDoc(
    doc(getDb(), paths.dashboardStat(supervisorId)).withConverter(
      dashboardStatsConverter
    )
  );
  return snap.exists() ? snap.data() : null;
}

/**
 * HOD dashboard: every supervisor's rollup for a department. This reads the
 * pre-aggregated docs only (one small read per supervisor), not the projects.
 */
export async function getDepartmentDashboardStats(
  department: string
): Promise<DashboardStatsDoc[]> {
  const q = query(
    collection(getDb(), paths.dashboardStats).withConverter(
      dashboardStatsConverter
    ),
    where("department", "==", department),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

/**
 * HOD analytics: the department's last `days` daily activity buckets, oldest
 * first (chart-ready). Reads `activity_daily`, never a live scan.
 */
export async function getDepartmentActivity(
  department: string,
  days = 30
): Promise<ActivityPointDoc[]> {
  const q = query(
    collection(getDb(), "activity_daily"),
    where("department", "==", department),
    orderBy("day", "desc"),
    limit(days)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const x = d.data() as Partial<ActivityPointDoc>;
      return {
        day: x.day ?? "",
        submissions: x.submissions ?? 0,
        comments: x.comments ?? 0,
        tickets: x.tickets ?? 0,
      } satisfies ActivityPointDoc;
    })
    .reverse();
}
