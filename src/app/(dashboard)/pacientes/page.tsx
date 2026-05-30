import { PatientsPage } from "@/features/patients/pages/PatientsPage";

export const metadata = {
  title: "Pacientes | SSTEPI",
  description: "Directorio Demográfico de Expedientes Clínicos SSTEPI",
};

export default function PatientsRoute() {
  return <PatientsPage />;
}
