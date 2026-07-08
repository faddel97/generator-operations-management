import { ModuleIndexPage } from "@/components/module/module-pages";

type ModuleSearchParams = {
  actionError?: string;
  saved?: string;
};

export default async function InspectionsPage({ searchParams }: { searchParams: Promise<ModuleSearchParams> }) {
  const { actionError, saved } = await searchParams;
  return <ModuleIndexPage moduleKey="weekly-inspections" actionError={actionError} saved={saved} />;
}
