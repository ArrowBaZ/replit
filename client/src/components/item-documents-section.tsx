import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Upload, FileImage, Download, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import type { Item, Profile } from "@shared/schema";

interface ItemDocument {
  id: number;
  itemId: number;
  uploaderUserId: string;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  createdAt: string | null;
  uploaderName: string;
}

interface ItemDocumentsSectionProps {
  item: Item;
  profile: Profile | undefined;
  userId: string | undefined;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ fileType, fileName }: { fileType: string; fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (fileType === "photo" || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return <FileImage className="h-4 w-4 text-blue-500" />;
  }
  return <FileText className="h-4 w-4 text-amber-500" />;
}

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_CERT_SIZE = 5 * 1024 * 1024;

export function ItemDocumentsSection({ item, profile, userId }: ItemDocumentsSectionProps) {
  const { toast } = useToast();
  const [showDocs, setShowDocs] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [docRequestSent, setDocRequestSent] = useState(false);
  const [uploadType, setUploadType] = useState<"photo" | "certificate">("photo");
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const canView =
    profile?.role === "admin" ||
    item.sellerId === userId ||
    item.reusseId === userId;

  const { data: documents, isLoading: docsLoading } = useQuery<ItemDocument[]>({
    queryKey: ["/api/items", item.id, "documents"],
    enabled: canView && showDocs,
  });

  const isReseller = profile?.role === "reusse" && item.reusseId === userId;

  const { data: docRequestStatus } = useQuery<{ requested: boolean; requestedAt: string | null }>({
    queryKey: ["/api/items", item.id, "document-request-status"],
    enabled: canView && isReseller,
  });

  const { uploadFile, isUploading } = useUpload();

  const uploadDocMutation = useMutation({
    mutationFn: async ({ fileName, fileUrl, fileType, fileSize }: {
      fileName: string; fileUrl: string; fileType: string; fileSize: number;
    }) => {
      const res = await apiRequest("POST", `/api/items/${item.id}/documents`, {
        fileName,
        fileUrl,
        fileType,
        fileSize,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items", item.id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const requestDocsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/items/${item.id}/document-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (res.status === 409) {
        return { alreadyRequested: true };
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to send request");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setDocRequestSent(true);
      queryClient.invalidateQueries({ queryKey: ["/api/items", item.id, "document-request-status"] });
      if (!data?.alreadyRequested) {
        toast({
          title: "Document request sent",
          description: "The seller has been notified to upload additional documentation.",
        });
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to send request",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = uploadType === "photo" ? MAX_PHOTO_SIZE : MAX_CERT_SIZE;
    const limitMB = maxSize / (1024 * 1024);

    let anySucceeded = false;
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `"${file.name}" exceeds the ${limitMB}MB limit for ${uploadType === "photo" ? "photos" : "certificates"}.`,
          variant: "destructive",
        });
        continue;
      }
      const result = await uploadFile(file);
      if (result) {
        try {
          await uploadDocMutation.mutateAsync({
            fileName: file.name,
            fileUrl: result.objectPath,
            fileType: uploadType,
            fileSize: file.size,
          });
          anySucceeded = true;
        } catch (err: any) {
          const serverMsg = err?.message || err?.response?.data?.message || null;
          toast({
            title: "Upload failed",
            description: serverMsg ? `"${file.name}": ${serverMsg}` : `Failed to save "${file.name}". Please try again.`,
            variant: "destructive",
          });
        }
      }
    }
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    setShowUploadDialog(false);
    if (anySucceeded) toast({ title: "Documents uploaded successfully" });
  };

  if (!canView) return null;

  const isSeller = profile?.role === "seller" && item.sellerId === userId;
  const docAlreadyRequested = docRequestStatus?.requested || docRequestSent;

  return (
    <div className="ml-[4.25rem] mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          onClick={() => setShowDocs(!showDocs)}
          data-testid={`button-toggle-docs-${item.id}`}
        >
          <FileText className="h-3.5 w-3.5 mr-1" />
          Documents
          {showDocs ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>

        {isSeller && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                data-testid={`button-add-docs-${item.id}`}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Add Photos / Documents
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Photos / Documents</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">What are you uploading?</p>
                  <div className="flex gap-2" data-testid={`upload-type-selector-${item.id}`}>
                    <Button
                      size="sm"
                      variant={uploadType === "photo" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setUploadType("photo")}
                      type="button"
                      data-testid={`upload-type-photo-${item.id}`}
                    >
                      <FileImage className="h-3.5 w-3.5 mr-1.5" />
                      Photo (max 10MB)
                    </Button>
                    <Button
                      size="sm"
                      variant={uploadType === "certificate" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setUploadType("certificate")}
                      type="button"
                      data-testid={`upload-type-cert-${item.id}`}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Certificate (max 5MB)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {uploadType === "photo"
                      ? "Item photos — JPEG, PNG, WebP, GIF, max 10MB each"
                      : "Authenticity certificates or receipts — images or PDF, max 5MB each"}
                  </p>
                </div>
                <label
                  className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
                  data-testid={`upload-zone-${item.id}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to select files</p>
                      <p className="text-xs text-muted-foreground">
                        {uploadType === "photo" ? "Images (max 10MB)" : "Images or PDF (max 5MB)"}
                      </p>
                    </div>
                  )}
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleUploadFiles}
                    disabled={isUploading}
                    data-testid={`input-doc-upload-${item.id}`}
                  />
                </label>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {isReseller && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={() => requestDocsMutation.mutate()}
            disabled={docAlreadyRequested || requestDocsMutation.isPending}
            data-testid={`button-request-docs-${item.id}`}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            {docAlreadyRequested ? "Request Sent" : "Request Documents"}
          </Button>
        )}
      </div>

      {showDocs && (
        <div className="rounded-md border bg-muted/20 p-3 space-y-2">
          {docsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading documents...
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {documents.length} document{documents.length > 1 ? "s" : ""}
              </p>

              {/* Photo gallery for image-type documents */}
              {documents.filter((d) => d.fileType === "photo").length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Photos</p>
                  <div className="space-y-2" data-testid={`photo-gallery-${item.id}`}>
                    <div className="grid grid-cols-3 gap-1.5">
                      {documents.filter((d) => d.fileType === "photo").map((doc) => (
                        <a
                          key={doc.id}
                          href={`/api/items/${item.id}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded overflow-hidden border bg-muted group"
                          data-testid={`doc-photo-${doc.id}`}
                          title={doc.fileName}
                        >
                          <img
                            src={`/api/items/${item.id}/documents/${doc.id}/download`}
                            alt={doc.fileName}
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                    {/* Audit log for photo entries */}
                    <div className="space-y-1">
                      {documents.filter((d) => d.fileType === "photo").map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between text-xs text-muted-foreground" data-testid={`doc-audit-${doc.id}`}>
                          <span className="truncate flex-1">
                            <span className="font-medium text-foreground">{doc.fileName}</span>
                            {" · "}{doc.uploaderName}
                            {doc.createdAt ? ` · ${new Date(doc.createdAt).toLocaleDateString("fr-FR")}` : ""}
                            {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ""}
                          </span>
                          <a
                            href={`/api/items/${item.id}/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0"
                            data-testid={`doc-download-${doc.id}`}
                          >
                            <Download className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* List view for certificate-type documents */}
              {documents.filter((d) => d.fileType === "certificate").length > 0 && (
                <div>
                  {documents.filter((d) => d.fileType === "photo").length > 0 && (
                    <p className="text-xs text-muted-foreground mb-1.5">Certificates & Documents</p>
                  )}
                  <div className="space-y-1.5">
                    {documents.filter((d) => d.fileType === "certificate").map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-background border text-xs"
                        data-testid={`doc-item-${doc.id}`}
                      >
                        <DocIcon fileType={doc.fileType} fileName={doc.fileName} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" data-testid={`doc-name-${doc.id}`}>{doc.fileName}</p>
                          <p className="text-muted-foreground">
                            {doc.uploaderName}
                            {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ""}
                            {doc.createdAt ? ` · ${new Date(doc.createdAt).toLocaleDateString("fr-FR")}` : ""}
                          </p>
                        </div>
                        <a
                          href={`/api/items/${item.id}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-muted transition-colors"
                          data-testid={`doc-download-${doc.id}`}
                        >
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {isSeller && (
                <p className="text-xs text-muted-foreground">
                  You can add more photos or documents at any time.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
