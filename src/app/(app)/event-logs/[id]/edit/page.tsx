import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditEventLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="event-logs" id={id} />;
}
