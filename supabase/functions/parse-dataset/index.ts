import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  // Simple CSV parser handling quoted fields
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

function parseJSON(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const parsed = JSON.parse(text);
  const data = Array.isArray(parsed) ? parsed : parsed.data ?? parsed.rows ?? [parsed];
  if (data.length === 0) return { headers: [], rows: [] };
  const headers = Object.keys(data[0]);
  return { headers, rows: data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { fileUploadId } = await req.json();
    if (!fileUploadId) {
      return new Response(JSON.stringify({ error: "fileUploadId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get file upload record
    const { data: upload, error: uploadErr } = await supabase
      .from("file_uploads")
      .select("*")
      .eq("id", fileUploadId)
      .maybeSingle();

    if (uploadErr || !upload) {
      return new Response(JSON.stringify({ error: "File upload not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await supabase
      .from("file_uploads")
      .update({ status: "processing" })
      .eq("id", fileUploadId);

    // Download file from storage
    const storagePath = `${userId}/${upload.file_name}`;
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("uploads")
      .download(storagePath);

    if (downloadErr || !fileData) {
      await supabase
        .from("file_uploads")
        .update({ status: "error", error_message: `Download failed: ${downloadErr?.message}` })
        .eq("id", fileUploadId);
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await fileData.text();
    const fileName = upload.file_name.toLowerCase();

    let headers: string[] = [];
    let rows: Record<string, unknown>[] = [];

    try {
      if (fileName.endsWith(".csv")) {
        const parsed = parseCSV(text);
        headers = parsed.headers;
        rows = parsed.rows;
      } else if (fileName.endsWith(".json")) {
        const parsed = parseJSON(text);
        headers = parsed.headers;
        rows = parsed.rows;
      } else if (fileName.endsWith(".tsv") || fileName.endsWith(".txt")) {
        // TSV parsing
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length > 0) {
          headers = lines[0].split("\t").map((h) => h.trim());
          rows = lines.slice(1).map((line) => {
            const values = line.split("\t");
            const row: Record<string, string> = {};
            headers.forEach((h, i) => {
              row[h] = (values[i] ?? "").trim();
            });
            return row;
          });
        }
      } else {
        await supabase
          .from("file_uploads")
          .update({ status: "error", error_message: "Unsupported file format. Use CSV, JSON, or TSV." })
          .eq("id", fileUploadId);
        return new Response(
          JSON.stringify({ error: "Unsupported file format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (parseError) {
      const msg = parseError instanceof Error ? parseError.message : "Parse error";
      await supabase
        .from("file_uploads")
        .update({ status: "error", error_message: `Parse error: ${msg}` })
        .eq("id", fileUploadId);
      return new Response(
        JSON.stringify({ error: `Failed to parse file: ${msg}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert parsed rows in batches of 500
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map((row, idx) => ({
        file_upload_id: fileUploadId,
        row_index: i + idx,
        data: row,
      }));
      const { error: insertErr } = await supabase.from("parsed_data").insert(batch);
      if (insertErr) {
        console.error("Batch insert error:", insertErr);
        await supabase
          .from("file_uploads")
          .update({ status: "error", error_message: `Insert error: ${insertErr.message}` })
          .eq("id", fileUploadId);
        return new Response(
          JSON.stringify({ error: "Failed to store parsed data" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update file upload with success
    await supabase
      .from("file_uploads")
      .update({ status: "processed", row_count: rows.length })
      .eq("id", fileUploadId);

    return new Response(
      JSON.stringify({
        success: true,
        headers,
        rowCount: rows.length,
        preview: rows.slice(0, 5),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-dataset error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
