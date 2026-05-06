import DashboardScreen from "@/features/dashboard/components/section/dashboard/AdminDashBoard";
import EmployeeDashboardScreen from "@/features/dashboard/components/section/dashboard/EmployeeDashboard";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import ViewLeaves from "@/features/leaves/components/ViewLeaves";

export default function Dashboard() {
//   const { data: user } = useCurrentUser();
  return (<ViewLeaves/>)
}