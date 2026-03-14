import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface FileUpload {
  id: string;
  file_name: string;
  status: string;
  row_count: number | null;
  created_at: string;
}

export default function DataIngestion() {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUploads() {
      const { data } = await supabase
        .from("file_uploads")
        .select("id, file_name, status, row_count, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setUploads(data);
      setLoading(false);
    }
    fetchUploads();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload and manage your datasets for analysis.
        </p>

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

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploads yet.</p>
            ) : (
              <div className="space-y-3">
                {uploads.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.created_at)} {(file.row_count ?? 0) > 0 && `· ${file.row_count!.toLocaleString()} rows`}
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
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
