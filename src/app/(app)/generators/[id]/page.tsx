import { GeneratorDetailPage } from "@/components/module/module-pages";

export default async function GeneratorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GeneratorDetailPage id={id} />;
}
