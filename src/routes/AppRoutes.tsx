import { Routes, Route } from "react-router-dom";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { ClientView } from "@/pages/clientView/ClientView";
import { Landing } from "@/pages/landing/Landing";
import { AppLayout } from "@/layouts/AppLayout";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* App Layout Pages */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard/:token" element={<Dashboard />} />
      </Route>
        <Route path="/view/:token" element={<ClientView />} />
    </Routes>
  );
};
