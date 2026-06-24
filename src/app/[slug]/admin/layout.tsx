import { AdminHeader } from "./admin-header";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AdminHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
