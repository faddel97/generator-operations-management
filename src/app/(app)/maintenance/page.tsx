import { ModuleIndexPage } from "@/components/module/module-pages";

type ModuleSearchParams = {
  actionError?: string;
  saved?: string;
};

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<ModuleSearchParams> }) {
  const { actionError, saved } = await searchParams;
  return <ModuleIndexPage moduleKey="maintenance-records" actionError={actionError} saved={saved} />;
}
