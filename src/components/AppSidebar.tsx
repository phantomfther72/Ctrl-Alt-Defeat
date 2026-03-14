import {
  BarChart3,
  LayoutDashboard,
  LineChart,
  Upload,
  Users,
  Share2,
  Lightbulb,
  Settings,
  Brain,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Data Ingestion", url: "/data-ingestion", icon: Upload },
  { title: "Insights", url: "/insights", icon: Lightbulb },
  { title: "Forecasting", url: "/forecasting", icon: LineChart },
  { title: "Audience", url: "/audience", icon: Users },
  { title: "Distribution", url: "/distribution", icon: Share2 },
];

const systemNavItems = [
  { title: "Admin", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-base font-bold text-sidebar-primary-foreground tracking-tight">
              New Era
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Insights Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] uppercase tracking-wider font-medium px-3">
            Analytics
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.url}
                    onClick={() => navigate(item.url)}
                    className="gap-3 px-3 py-2.5 text-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] uppercase tracking-wider font-medium px-3">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.url}
                    onClick={() => navigate(item.url)}
                    className="gap-3 px-3 py-2.5 text-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs text-sidebar-foreground/60">Platform v1.0</p>
          <p className="text-xs text-sidebar-foreground/40">© 2026 New Era Insights</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
