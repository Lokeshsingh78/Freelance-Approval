import { Outlet } from "react-router-dom";
import { DashboardNavbar } from "@/components/dashboardNavbar/DashboardNavbar";
import { WarningModal } from "@/components/modal/WarningModal/WarningModal";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-gray-100 font-sans flex flex-col justify-between transition-colors">
      <div>
        {/* The Clean Navbar */}
        <DashboardNavbar />

        {/* Page Content */}
        <main className="animate-in fade-in duration-500">
          <Outlet />
          <WarningModal />
        </main>
      </div>

      {/* Dashboard Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white/60 dark:bg-black/60 py-6 px-6 mt-12 text-xs text-zinc-500 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} Freelance Approval • Workspace Dashboard
          </div>
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span>Created by <strong className="text-zinc-700 dark:text-zinc-200">Lokesh Singh Tanwar</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
};
