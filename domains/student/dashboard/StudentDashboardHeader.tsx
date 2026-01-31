import Navbar from "@/components/ui/navbar";

interface StudentDashboardHeaderProps {
  student: string | null;
}

export default function StudentDashboardHeader({ student }: StudentDashboardHeaderProps) {
  return <Navbar userName={student} />;
}
