import { EppDetailView } from "@/features/epps/components";

export default function EppDetailPage({ params }: { params: { id: string } }) {
  return <EppDetailView id={params.id} />;
}
