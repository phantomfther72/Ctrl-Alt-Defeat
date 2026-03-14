import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { WalkthroughTour } from "@/components/WalkthroughTour";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div data-tour="sidebar">
          <AppSidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <div data-tour="topbar">
            <TopBar />
          </div>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <WalkthroughTour />
    </SidebarProvider>
  );
}
