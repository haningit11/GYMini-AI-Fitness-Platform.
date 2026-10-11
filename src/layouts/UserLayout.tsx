import { Outlet } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";

const UserLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
