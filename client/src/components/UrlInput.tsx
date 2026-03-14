import React, { useState } from "react";
import { Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UrlInputProps {
  placeholder?: string;
  onSubmit: (url: string) => void;
  loading?: boolean;
  compact?: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({
  placeholder = "Paste a URL or social media post link…",
  onSubmit,
  loading = false,
  compact = false,
}) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
        <Link className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0 text-muted-foreground`} />
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          required
        />
      </div>
      <Button type="submit" disabled={loading || !url.trim()} className="w-full">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Link className="mr-2 h-4 w-4" />
        )}
        {loading ? "Scanning…" : "Scan URL"}
      </Button>
    </form>
  );
};

export default UrlInput;
