import { ModuleIndexPage } from "@/components/module/module-pages";

export default async function GeneratorsPage({ searchParams }: { searchParams: Promise<{ actionError?: string }> }) {
  const { actionError } = await searchParams;
  return <ModuleIndexPage moduleKey="generators" actionError={actionError} />;
}
