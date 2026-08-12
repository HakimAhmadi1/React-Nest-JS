import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Search,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApi, postApi } from "@/services/api";
import { assetUrl } from "@/utils/assetUrl";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const MediaPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  const {
    data: media = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["media"],
    queryFn: () => getApi("upload"),
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      // No explicit Content-Type: axios must set it so the multipart boundary
      // is included. Setting it by hand made every upload fail to parse.
      return postApi("upload/image", formData);
    },
    onSuccess: () => {
      toast.success("Media uploaded");
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (err) => toast.error(err.message || "Upload failed"),
  });

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    event.target.value = "";
  };

  // Cleared on unmount / re-copy.
  useEffect(() => {
    if (!copiedId) return;
    const timer = setTimeout(() => setCopiedId(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedId]);

  const copyToClipboard = async (url, id) => {
    try {
      await navigator.clipboard.writeText(assetUrl(url));
      setCopiedId(id);
      toast.success("URL copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const filteredMedia = media
    // Optional chaining: one entry without a filename used to crash the page.
    .filter((item) =>
      item?.filename?.toLowerCase().includes(debouncedSearch.toLowerCase()),
    )
    .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / 1024 ** index).toFixed(2))} ${units[index]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your uploaded assets and images.
          </p>
        </div>

        {/*
          A real <button> that forwards to a hidden input. The previous markup
          nested a <button> inside a <label>, which swallowed the click and
          never opened the file picker.
        */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploadMutation.isPending ? (
              <span
                aria-hidden="true"
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              />
            ) : (
              <Upload size={14} aria-hidden="true" />
            )}
            {uploadMutation.isPending ? "Uploading…" : "Upload media"}
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        <Search
          size={18}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="search"
          aria-label="Search media filenames"
          placeholder="Search filenames..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
        />
      </div>

      {isError && (
        <p
          role="alert"
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
        >
          {error.message || "Failed to load media."}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-2xl bg-gray-900 animate-pulse border border-gray-800"
            />
          ))}
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <figure
              key={item.filename}
              className="group relative aspect-square rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-primary-500/50 transition-all flex flex-col"
            >
              <div className="flex-1 relative overflow-hidden bg-black/20">
                <img
                  src={assetUrl(item.url)}
                  alt={item.filename}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.url, item.filename)}
                    aria-label={`Copy URL for ${item.filename}`}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                  >
                    {copiedId === item.filename ? (
                      <Check size={18} className="text-green-400" aria-hidden="true" />
                    ) : (
                      <Copy size={18} aria-hidden="true" />
                    )}
                  </button>
                  <a
                    href={assetUrl(item.url)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${item.filename} in a new tab`}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                  >
                    <ExternalLink size={18} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <figcaption className="p-3 bg-gray-900 border-t border-gray-800">
                <p
                  className="text-[11px] font-medium text-gray-300 truncate"
                  title={item.filename}
                >
                  {item.filename}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                    {formatSize(item.size)}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {new Date(item.mtime).toLocaleDateString()}
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 mb-4 border border-gray-800">
            <ImageIcon className="text-gray-600" size={32} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-white">No media found</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">
            Upload an asset to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
