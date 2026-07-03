import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditAtsManualOperationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="ats-manual-operations" id={id} />;
}
