import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

const recentUploads = [
  { name: "q1-analytics-2026.csv", status: "processed", rows: 12450, date: "Mar 12, 2026" },
  { name: "social-metrics.xlsx", status: "processed", rows: 8200, date: "Mar 10, 2026" },
  { name: "audience-survey.csv", status: "error", rows: 0, date: "Mar 8, 2026" },
  { name: "content-performance.csv", status: "processed", rows: 5670, date: "Mar 5, 2026" },
];

export default function DataIngestion() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload and manage your datasets for analysis.
        </p>

        {/* Upload Area */}
        <Card
          className={`shadow-card border-2 border-dashed transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={() => setDragActive(false)}
        >
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-card-foreground mb-1">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV, XLSX, JSON files up to 50MB
            </p>
            <div className="flex gap-3">
              <Button>Browse Files</Button>
              <Input type="url" placeholder="Or paste a URL..." className="w-64" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUploads.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.date} {file.rows > 0 && `· ${file.rows.toLocaleString()} rows`}
                      </p>
                    </div>
                  </div>
                  {file.status === "processed" ? (
                    <div className="flex items-center gap-1.5 text-kpi-up">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Processed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-kpi-down">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Error</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
