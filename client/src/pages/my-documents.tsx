import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  FileImage,
  Upload,
  Trash2,
  ExternalLink,
  Download,
  Loader2,
  FolderOpen,
  Search,
  X,
} from "lucide-react";

interface UserDocument {
  id: number;
  itemId: number;
  itemTitle: string;
  requestId: number | null;
  uploaderUserId: string;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  createdAt: string | null;
}

interface GroupedDocs {
  itemId: number;
  itemTitle: string;
  requestId: number | null;
  documents: UserDocument[];
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
    return <FileImage className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  }
  return <FileText className="h-4 w-4 text-amber-500 flex-shrink-0" />;
}

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_CERT_SIZE = 5 * 1024 * 1024;

function ReUploadDialog({ doc }: { doc: UserDocument }) {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload();
  const [open, setOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"photo" | "certificate">(
    doc.fileType === "photo" ? "photo" : "certificate"
  );

  const replaceMutation = useMutation({
    mutationFn: async ({ fileName, fileUrl, fileType, fileSize }: {
      fileName: string; fileUrl: string; fileType: string; fileSize: number;
    }) => {
      await apiRequest("DELETE", `/api/items/${doc.itemId}/documents/${doc.id}`);
      const res = await apiRequest("POST", `/api/items/${doc.itemId}/documents`, {
        fileName,
        fileUrl,
        fileType,
        fileSize,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items", doc.itemId, "documents"] });
      setOpen(false);
      toast({ title: "Document replaced successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Replace failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = uploadType === "photo" ? MAX_PHOTO_SIZE : MAX_CERT_SIZE;
    const limitMB = maxSize / (1024 * 1024);
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `"${file.name}" exceeds the ${limitMB}MB limit.`,
        variant: "destructive",
      });
      return;
    }
    const result = await uploadFile(file);
    if (result) {
      replaceMutation.mutate({
        fileName: file.name,
        fileUrl: result.objectPath,
        fileType: uploadType,
        fileSize: file.size,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          data-testid={`button-reupload-${doc.id}`}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Replace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Replacement Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">What are you uploading?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={uploadType === "photo" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setUploadType("photo")}
                type="button"
                data-testid={`reupload-type-photo-${doc.id}`}
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
                data-testid={`reupload-type-cert-${doc.id}`}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Certificate (max 5MB)
              </Button>
            </div>
          </div>
          <label
            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
            data-testid={`reupload-zone-${doc.id}`}
          >
            {isUploading || replaceMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to select a file</p>
                <p className="text-xs text-muted-foreground">
                  {uploadType === "photo" ? "Images (max 10MB)" : "Images or PDF (max 5MB)"}
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading || replaceMutation.isPending}
              data-testid={`input-reupload-${doc.id}`}
            />
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentRow({ doc }: { doc: UserDocument }) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/items/${doc.itemId}/documents/${doc.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items", doc.itemId, "documents"] });
      toast({ title: "Document removed" });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to remove document",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
      data-testid={`doc-row-${doc.id}`}
    >
      <DocIcon fileType={doc.fileType} fileName={doc.fileName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" data-testid={`doc-name-${doc.id}`}>
          {doc.fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 mr-1.5">
            {doc.fileType === "photo" ? "Photo" : "Certificate"}
          </Badge>
          {doc.fileSize ? formatBytes(doc.fileSize) : ""}
          {doc.createdAt
            ? ` · ${new Date(doc.createdAt).toLocaleDateString("fr-FR")}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <a
          href={`/api/items/${doc.itemId}/documents/${doc.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Download"
          data-testid={`button-download-${doc.id}`}
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
        </a>
        <ReUploadDialog doc={doc} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-doc-${doc.id}`}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove document?</AlertDialogTitle>
              <AlertDialogDescription>
                "{doc.fileName}" will be permanently removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid={`button-cancel-delete-${doc.id}`}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid={`button-confirm-delete-${doc.id}`}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

type TypeFilter = "all" | "photo" | "certificate";

export default function MyDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { data: documents, isLoading } = useQuery<UserDocument[]>({
    queryKey: ["/api/documents"],
  });

  const filteredDocuments = (documents ?? []).filter((doc) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      doc.fileName.toLowerCase().includes(q) ||
      doc.itemTitle.toLowerCase().includes(q);
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "photo" && doc.fileType === "photo") ||
      (typeFilter === "certificate" && doc.fileType !== "photo");
    return matchesSearch && matchesType;
  });

  const grouped: GroupedDocs[] = [];
  {
    const map = new Map<number, GroupedDocs>();
    for (const doc of filteredDocuments) {
      if (!map.has(doc.itemId)) {
        map.set(doc.itemId, {
          itemId: doc.itemId,
          itemTitle: doc.itemTitle,
          requestId: doc.requestId,
          documents: [],
        });
      }
      map.get(doc.itemId)!.documents.push(doc);
    }
    grouped.push(...Array.from(map.values()));
  }

  const hasDocuments = (documents ?? []).length > 0;
  const hasResults = grouped.length > 0;
  const isFiltering = searchQuery.trim() !== "" || typeFilter !== "all";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">My Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All documents you've uploaded, grouped by item.
        </p>
      </div>

      {!isLoading && hasDocuments && (
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by file name or item…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              data-testid="input-search-docs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Type:</span>
            {(["all", "photo", "certificate"] as TypeFilter[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={typeFilter === t ? "default" : "outline"}
                className="h-7 px-3 text-xs capitalize"
                onClick={() => setTypeFilter(t)}
                data-testid={`filter-type-${t}`}
              >
                {t === "all" ? (
                  "All"
                ) : t === "photo" ? (
                  <><FileImage className="h-3.5 w-3.5 mr-1" />Photo</>
                ) : (
                  <><FileText className="h-3.5 w-3.5 mr-1" />Certificate</>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="docs-loading">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading documents...</span>
        </div>
      ) : !hasDocuments ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="docs-empty">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No documents uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload photos or certificates from your item pages.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="docs-no-results">
          <Search className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No documents match your search</p>
          {isFiltering && (
            <Button
              variant="link"
              className="text-sm mt-2"
              onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}
              data-testid="button-clear-filters"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6" data-testid="docs-list">
          {grouped.map((group) => (
            <div key={group.itemId} data-testid={`doc-group-${group.itemId}`}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-sm truncate" data-testid={`group-title-${group.itemId}`}>
                  {group.itemTitle}
                </h2>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {group.documents.length} doc{group.documents.length !== 1 ? "s" : ""}
                </Badge>
                {group.requestId && (
                  <Link
                    href={`/requests/${group.requestId}`}
                    className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    data-testid={`link-request-${group.requestId}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View request
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {group.documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
