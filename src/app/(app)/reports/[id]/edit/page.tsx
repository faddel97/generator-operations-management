import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="reports" id={id} />;
}
