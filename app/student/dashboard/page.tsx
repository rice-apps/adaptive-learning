import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/ui/sidebar"

export default function StudentDashboard() {
  return (
    <SidebarProvider>
      <Sidebar />
      <main>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  )
}