import { notFound } from "next/navigation";
import { PatientClinicalPanelWrapper } from "@/features/nursing/components/PatientClinicalPanelWrapper";

interface PatientPanelPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PatientPanelPageProps) {
  const { id } = await params;
  return {
    title: `Expediente #${id} | SSTEPI`,
    description: "Panel clínico de internación en tiempo real",
  };
}

export default async function PatientPanelPage({ params }: PatientPanelPageProps) {
  const { id } = await params;
  const internacionId = Number(id);

  if (isNaN(internacionId) || internacionId <= 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PatientClinicalPanelWrapper internacionId={internacionId} />
    </div>
  );
}
