import { ModuleEditPage } from "@/components/module/module-pages";

export default async function EditVibrationTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleEditPage moduleKey="vibration-tests" id={id} />;
}
