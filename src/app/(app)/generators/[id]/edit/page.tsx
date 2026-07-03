import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditGeneratorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="generators" id={id} />;
}
