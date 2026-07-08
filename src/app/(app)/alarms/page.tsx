import { ModuleIndexPage } from "@/components/module/module-pages";

type ModuleSearchParams = {
  actionError?: string;
  saved?: string;
};

export default async function AlarmsPage({ searchParams }: { searchParams: Promise<ModuleSearchParams> }) {
  const { actionError, saved } = await searchParams;
  return <ModuleIndexPage moduleKey="alarms" actionError={actionError} saved={saved} />;
}
