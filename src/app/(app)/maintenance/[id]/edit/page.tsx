import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditMaintenancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="maintenance-records" id={id} />;
}
