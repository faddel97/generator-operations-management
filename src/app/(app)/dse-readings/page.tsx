import { ModuleIndexPage } from "@/components/module/module-pages";

type ModuleSearchParams = {
  actionError?: string;
  saved?: string;
};

export default async function DseReadingsPage({ searchParams }: { searchParams: Promise<ModuleSearchParams> }) {
  const { actionError, saved } = await searchParams;
  return <ModuleIndexPage moduleKey="dse-readings" actionError={actionError} saved={saved} />;
}
