import { AdmissionPage } from "@/features/admission/pages/AdmissionPage";

export const metadata = {
  title: "Admisión e Internación | SSTEPI",
  description: "Asistente guiado por pasos para la internación y triage clínico",
};

export default function AdmissionRoute() {
  return <AdmissionPage />;
}
