import AdminShellPage from "@/features/admin/components/AdminShellPage";
import { getSession } from "@/lib/admin-auth";

export default async function AdminBillingPage() {
  const session = await getSession();

  return <AdminShellPage session={session} />;
}
