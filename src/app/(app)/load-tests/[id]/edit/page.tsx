import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditLoadTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="load-tests" id={id} />;
}
