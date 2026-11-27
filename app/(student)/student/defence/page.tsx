import { OfficialDefence } from "@/components/shared/official-defence";
import { PageHeader } from "@/components/shared/page-header";

export default function DefencePage() {
  return (
    <div>
      <PageHeader title="Defence" description="Check your department’s official defence date, time and countdown." />
      <OfficialDefence />
    </div>
  );
}
