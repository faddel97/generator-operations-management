import { FacilityWorkspace } from "@/components/facility-map/facility-workspace";
import { requireAuthenticated } from "@/lib/auth";
import { readFacilityMapSnapshot } from "@/lib/facility-map/server";

export default async function TrackingPage() {
  const session = await requireAuthenticated();
  const snapshot = await readFacilityMapSnapshot();
  return <FacilityWorkspace initial={snapshot} role={session.role} authenticated={Boolean(session.userId)} />;
}
