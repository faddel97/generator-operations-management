import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="weekly-inspections" id={id} />;
}
