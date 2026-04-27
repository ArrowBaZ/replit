import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, FileText, Upload, FileImage, Download, MessageSquare, ChevronDown, ChevronUp, X, ExternalLink, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
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

function isPdf(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() === "pdf";
}

function isImageFile(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
}

function DocIcon({ fileType, fileName }: { fileType: string; fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (fileType === "photo" || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return <FileImage className="h-4 w-4 text-blue-500" />;
  }
  return <FileText className="h-4 w-4 text-amber-500" />;
}

interface LightboxPhoto {
  url: string;
  fileName: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const current = photos[currentIndex];
  const hasMultiple = photos.length > 1;

  const goToPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (hasMultiple && e.key === "ArrowLeft") goToPrev();
      if (hasMultiple && e.key === "ArrowRight") goToNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, hasMultiple, goToPrev, goToNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full mb-2 px-1">
          <p className="text-white text-sm font-medium truncate flex-1 pr-2" data-testid="lightbox-filename">
            {current.fileName}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasMultiple && (
              <span className="text-white/70 text-xs font-mono" data-testid="lightbox-counter">
                {currentIndex + 1} / {photos.length}
              </span>
            )}
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors p-1 rounded"
              title="Open in new tab"
              data-testid="lightbox-open-tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={current.url}
              download={current.fileName}
              className="text-white/80 hover:text-white transition-colors p-1 rounded"
              title="Download"
              data-testid="lightbox-download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded"
              title="Close"
              data-testid="lightbox-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative w-full flex items-center justify-center">
          {hasMultiple && (
            <button
              onClick={goToPrev}
              className="absolute left-0 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors -translate-x-1 focus:outline-none"
              title="Previous photo"
              data-testid="lightbox-prev"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div className="w-full flex items-center justify-center rounded-lg overflow-hidden bg-black/40">
            <img
              key={current.url}
              src={current.url}
              alt={current.fileName}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              data-testid="lightbox-image"
            />
          </div>

          {hasMultiple && (
            <button
              onClick={goToNext}
              className="absolute right-0 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors translate-x-1 focus:outline-none"
              title="Next photo"
              data-testid="lightbox-next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
  const [lightboxDoc, setLightboxDoc] = useState<{ photos: LightboxPhoto[]; initialIndex: number } | null>(null);

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
      {lightboxDoc && (
        <Lightbox
          photos={lightboxDoc.photos}
          initialIndex={lightboxDoc.initialIndex}
          onClose={() => setLightboxDoc(null)}
        />
      )}

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
                      {(() => {
                        const photoDocs = documents.filter((d) => d.fileType === "photo");
                        const photoList: LightboxPhoto[] = photoDocs.map((d) => ({
                          url: `/api/items/${item.id}/documents/${d.id}/download`,
                          fileName: d.fileName,
                        }));
                        return photoDocs.map((doc, idx) => {
                          const docUrl = photoList[idx].url;
                          return (
                          <button
                            key={doc.id}
                            onClick={() => setLightboxDoc({ photos: photoList, initialIndex: idx })}
                            className="relative aspect-square rounded overflow-hidden border bg-muted group cursor-zoom-in"
                            data-testid={`doc-photo-${doc.id}`}
                            title={`Preview ${doc.fileName}`}
                          >
                            <img
                              src={docUrl}
                              alt={doc.fileName}
                              className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                              <ZoomIn className="h-5 w-5 text-white drop-shadow" />
                            </div>
                          </button>
                        );
                        });
                      })()}
                    </div>
                    {/* Audit log for photo entries */}
                    <div className="space-y-1">
                      {documents.filter((d) => d.fileType === "photo").map((doc) => {
                        const docUrl = `/api/items/${item.id}/documents/${doc.id}/download`;
                        return (
                          <div key={doc.id} className="flex items-center justify-between text-xs text-muted-foreground" data-testid={`doc-audit-${doc.id}`}>
                            <span className="truncate flex-1">
                              <span className="font-medium text-foreground">{doc.fileName}</span>
                              {" · "}{doc.uploaderName}
                              {doc.createdAt ? ` · ${new Date(doc.createdAt).toLocaleDateString("fr-FR")}` : ""}
                              {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ""}
                            </span>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0"
                              data-testid={`doc-download-${doc.id}`}
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </div>
                        );
                      })}
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
                    {documents.filter((d) => d.fileType === "certificate").map((doc) => {
                      const docUrl = `/api/items/${item.id}/documents/${doc.id}/download`;
                      const isDocPdf = isPdf(doc.fileName);
                      const isDocImage = isImageFile(doc.fileName);
                      return (
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isDocPdf && (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-muted transition-colors"
                                data-testid={`doc-view-pdf-${doc.id}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                                View PDF
                              </a>
                            )}
                            {isDocImage && (
                              <button
                                onClick={() => setLightboxDoc({ photos: [{ url: docUrl, fileName: doc.fileName }], initialIndex: 0 })}
                                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="Preview image"
                                data-testid={`doc-preview-${doc.id}`}
                              >
                                <ZoomIn className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-muted transition-colors"
                              data-testid={`doc-download-${doc.id}`}
                            >
                              <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
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
