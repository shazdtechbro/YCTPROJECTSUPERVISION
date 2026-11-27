import { OfficialDefence } from "@/components/shared/official-defence";
import { PageHeader } from "@/components/shared/page-header";

export default function HodDefencePage() {
  return (
    <div>
      <PageHeader title="Defence" description="Set the official defence date and time for your department." />
      <OfficialDefence canEdit />
    </div>
  );
}
