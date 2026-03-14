import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface FileUpload {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  status: string;
  row_count: number | null;
  error_message: string | null;
  created_at: string;
}

interface PreviewData {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

const ACCEPTED_TYPES = [
  "text/csv",
  "application/json",
  "text/tab-separated-values",
  "text/plain",
];
const ACCEPTED_EXTENSIONS = [".csv", ".json", ".tsv", ".txt"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function DataIngestion() {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchUploads = useCallback(async () => {
    const { data } = await supabase
      .from("file_uploads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setUploads(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Please upload CSV, JSON, or TSV files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 50MB.`;
    }
    if (file.size === 0) {
      return `File is empty.`;
    }
    return null;
  };

  const uploadAndParse = async (file: File) => {
    if (!user) {
      toast({ title: "Not authenticated", description: "Please log in to upload files.", variant: "destructive" });
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      toast({ title: "Invalid file", description: validationError, variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      // 1. Create file_uploads record
      const { data: uploadRecord, error: insertErr } = await supabase
        .from("file_uploads")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type || "text/plain",
          file_size: file.size,
          status: "pending",
        })
        .select()
        .single();

      if (insertErr || !uploadRecord) {
        throw new Error(insertErr?.message || "Failed to create upload record");
      }

      // 2. Upload to storage
      const storagePath = `${user.id}/${file.name}`;
      const { error: storageErr } = await supabase.storage
        .from("uploads")
        .upload(storagePath, file, { upsert: true });

      if (storageErr) {
        await supabase
          .from("file_uploads")
          .update({ status: "error", error_message: `Upload failed: ${storageErr.message}` })
          .eq("id", uploadRecord.id);
        throw new Error(`Storage upload failed: ${storageErr.message}`);
      }

      // 3. Trigger parsing
      const { data: parseResult, error: parseErr } = await supabase.functions.invoke(
        "parse-dataset",
        { body: { fileUploadId: uploadRecord.id } }
      );

      if (parseErr) {
        throw new Error(parseErr.message);
      }

      if (parseResult?.error) {
        toast({
          title: "Parsing failed",
          description: parseResult.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File parsed",
          description: `${file.name} — ${parseResult.rowCount.toLocaleString()} rows parsed. Processing analytics...`,
        });

        // Trigger downstream processing to populate analytics tables
        try {
          const { data: processResult, error: processErr } = await supabase.functions.invoke(
            "process-dataset",
            { body: { fileUploadId: uploadRecord.id } }
          );

          if (processErr || processResult?.error) {
            toast({
              title: "Processing warning",
              description: processResult?.error || processErr?.message || "Analytics processing encountered an issue.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Analytics ready",
              description: `Processed ${processResult.clean_data_count} records into ${processResult.summary_count} monthly summaries and ${processResult.prediction_count} predictions.`,
            });
          }
        } catch (processError) {
          console.error("Process error:", processError);
          toast({
            title: "Processing warning",
            description: "File was parsed but analytics processing failed. You can retry from the uploads list.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      await fetchUploads();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Process first file
    uploadAndParse(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handlePreview = async (upload: FileUpload) => {
    setPreviewFileName(upload.file_name);
    setPreviewOpen(true);
    setPreviewLoading(true);

    const { data } = await supabase
      .from("parsed_data")
      .select("data")
      .eq("file_upload_id", upload.id)
      .order("row_index", { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      const rows = data.map((r) => r.data as Record<string, unknown>);
      const headers = Object.keys(rows[0]);
      setPreviewData({ headers, rows, totalRows: upload.row_count ?? rows.length });
    } else {
      setPreviewData(null);
    }
    setPreviewLoading(false);
  };

  const handleDelete = async (upload: FileUpload) => {
    if (!user) return;
    // Delete from storage
    await supabase.storage.from("uploads").remove([`${user.id}/${upload.file_name}`]);
    // Delete record (cascade deletes parsed_data)
    await supabase.from("file_uploads").delete().eq("id", upload.id);
    toast({ title: "Deleted", description: `${upload.file_name} removed.` });
    await fetchUploads();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    processed: { icon: CheckCircle2, color: "text-kpi-up", label: "Processed" },
    processing: { icon: Loader2, color: "text-primary", label: "Processing" },
    pending: { icon: Loader2, color: "text-muted-foreground", label: "Pending" },
    error: { icon: AlertCircle, color: "text-kpi-down", label: "Error" },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload and manage your datasets for analysis.
        </p>

        {/* Upload Area */}
        <Card
          data-tour="upload-area"
          className={`shadow-card border-2 border-dashed transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-16">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="font-heading text-lg font-semibold text-card-foreground mb-1">
                  Uploading & parsing...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while your file is being processed.
                </p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground mb-1">
                  Drop files here or click to upload
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports CSV, JSON, TSV files up to 50MB
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </Button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.json,.tsv,.txt"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </CardContent>
        </Card>

        {/* Recent Uploads */}
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
              <p className="text-sm text-muted-foreground py-4 text-center">
                No uploads yet. Drop a file above to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {uploads.map((file) => {
                  const config = statusConfig[file.status] || statusConfig.error;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {file.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(file.created_at)}
                            {file.file_size ? ` · ${formatSize(file.file_size)}` : ""}
                            {(file.row_count ?? 0) > 0 && ` · ${file.row_count!.toLocaleString()} rows`}
                          </p>
                          {file.error_message && (
                            <p className="text-xs text-kpi-down mt-0.5 truncate" title={file.error_message}>
                              {file.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`flex items-center gap-1.5 ${config.color}`}>
                          <StatusIcon
                            className={`h-4 w-4 ${file.status === "processing" ? "animate-spin" : ""}`}
                          />
                          <span className="text-xs font-medium">{config.label}</span>
                        </div>
                        {file.status === "processed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handlePreview(file)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-kpi-down"
                          onClick={() => handleDelete(file)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {previewFileName}
              {previewData && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {previewData.totalRows.toLocaleString()} rows
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : previewData ? (
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-xs">#</TableHead>
                    {previewData.headers.map((h) => (
                      <TableHead key={h} className="text-xs whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {previewData.headers.map((h) => (
                        <TableCell key={h} className="text-xs max-w-[200px] truncate">
                          {String(row[h] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.totalRows > 50 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Showing first 50 of {previewData.totalRows.toLocaleString()} rows
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data available for preview.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
