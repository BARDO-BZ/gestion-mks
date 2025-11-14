import { EppDetailView } from "@/features/epps/components";

export default async function EppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EppDetailView id={id} />;
}
