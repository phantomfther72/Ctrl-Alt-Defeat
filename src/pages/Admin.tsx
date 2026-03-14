import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Key, RefreshCw } from "lucide-react";

export default function Admin() {
  return (
    <AppLayout>
      <div data-tour="admin-section" className="space-y-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">
          Manage platform settings, API keys, and system configuration.
        </p>

        {/* API Configuration */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <CardTitle className="font-heading text-base">API Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">API Endpoint</Label>
              <Input value="https://api.newera-insights.com/v1" readOnly className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">API Key</Label>
              <div className="flex gap-2">
                <Input value="••••••••••••••••••••" readOnly className="bg-secondary" />
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Settings */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <CardTitle className="font-heading text-base">Data Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Auto-refresh data</p>
                <p className="text-xs text-muted-foreground">Automatically sync data every 15 minutes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Data retention</p>
                <p className="text-xs text-muted-foreground">Keep historical data for analysis</p>
              </div>
              <Badge variant="secondary">90 days</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">AI-powered insights</p>
                <p className="text-xs text-muted-foreground">Generate automated insights from data patterns</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="font-heading text-base">Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Session timeout</p>
                <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Badge variant="secondary">30 min</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button>Save Changes</Button>
          <Button variant="outline">Reset to Defaults</Button>
        </div>
      </div>
    </AppLayout>
  );
}
