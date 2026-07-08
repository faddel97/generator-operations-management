import { redirect } from "next/navigation";

export default async function EventLogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/event-logs/${id}`);
}
