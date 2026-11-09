import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const metadata = {
  title: "Admin Portal | KRUMBISTRY Bake Shop",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutShell
      session={{
        adminId: session.adminId,
        email: session.email,
        name: session.name,
        role: session.role,
      }}
    >
      {children}
    </AdminLayoutShell>
  );
}

