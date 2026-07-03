import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditAlarmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="alarms" id={id} />;
}
