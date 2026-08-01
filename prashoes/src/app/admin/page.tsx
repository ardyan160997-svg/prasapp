import AdminDashboardPage from "@/features/admin/components/AdminDashboardPage";
import AdminLoginPage from "@/features/admin/components/AdminLoginPage";
import { getCurrentAdminSession, isAdminAuthConfigured } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin | Prashoes",
  description: "Dashboard admin Prashoes untuk memantau pesanan dan permintaan antar jemput.",
};

export default async function AdminPage() {
  const isConfigured = isAdminAuthConfigured();
  const session = isConfigured ? await getCurrentAdminSession() : null;

  if (!session) {
    return <AdminLoginPage isConfigured={isConfigured} />;
  }

  return <AdminDashboardPage adminUsername={session.username} />;
}
