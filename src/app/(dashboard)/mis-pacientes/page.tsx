import { DoctorPatientsPage } from "@/features/doctor/pages/DoctorPatientsPage";

export const metadata = {
  title: "Mis Pacientes | SSTEPI",
  description: "Pacientes internados bajo responsabilidad médica directa",
};

export default function MisPacientesRoute() {
  return <DoctorPatientsPage />;
}
