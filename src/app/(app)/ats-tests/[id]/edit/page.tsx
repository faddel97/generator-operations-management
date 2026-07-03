import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditAtsTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="ats-tests" id={id} />;
}
