import { ModuleIndexPage } from "@/components/module/module-pages";

type ModuleSearchParams = {
  actionError?: string;
  saved?: string;
};

export default async function GeneratorsPage({ searchParams }: { searchParams: Promise<ModuleSearchParams> }) {
  const { actionError, saved } = await searchParams;
  return <ModuleIndexPage moduleKey="generators" actionError={actionError} saved={saved} />;
}
