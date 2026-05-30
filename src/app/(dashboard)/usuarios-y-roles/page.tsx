import { AdminPage } from "@/features/admin/pages/AdminPage";

export const metadata = {
  title: "Usuarios y Roles | SSTEPI",
  description: "Administración de profesionales clínicos, roles y permisos de acceso",
};

export default function AdminRoute() {
  return <AdminPage />;
}
