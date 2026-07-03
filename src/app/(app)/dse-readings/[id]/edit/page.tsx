import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditDseReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="dse-readings" id={id} />;
}
