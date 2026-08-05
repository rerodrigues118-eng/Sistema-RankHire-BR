import Sidebar from "@/components/sidebar";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePage="dashboard" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
