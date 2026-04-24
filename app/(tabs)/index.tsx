import DashboardScreen from "@/features/dashboard/components/section/dashboard/AdminDashBoard";
import EmployeeDashboardScreen from "@/features/dashboard/components/section/dashboard/EmployeeDashboard";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";

export default function Dashboard() {
  const { data: user } = useCurrentUser();
  if (!user) {
    return null;
  }
  if (user?.role === "Admin" || user.role === "SuperAdmin") {
    return <DashboardScreen />
  } else {
    return <EmployeeDashboardScreen />
  }
}