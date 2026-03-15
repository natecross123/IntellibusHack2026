import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, Clock, Clapperboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RiskGauge from "@/components/RiskGauge";
import UrlInput from "@/components/UrlInput";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileVideoDetection from "@/pages/mobile/MobileVideoDetection";
import { useToast } from "@/hooks/use-toast";
import { MediaScanResponse, scanVideoFile, scanVideoUrl } from "@/lib/securityApi";

const VideoDetection: React.FC = () => {
  const isMobile = useIsMobile();
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<MediaScanResponse | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); setScannedUrl(null); }
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);

    try {
      const response = await scanVideoFile(file);
      setResult(response);
    } catch (error) {
      toast({
        title: "Video scan failed",
        description: error instanceof Error ? error.message : "Unable to scan video.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleUrlScan = async (url: string) => {
    setScannedUrl(url);
    setFile(null);
    setScanning(true);

    try {
      const response = await scanVideoUrl(url);
      setResult(response);
    } catch (error) {
      toast({
        title: "Video URL scan failed",
        description: error instanceof Error ? error.message : "Unable to scan video URL.",
        variant: "destructive",
      });
      setScannedUrl(null);
    } finally {
      setScanning(false);
    }
  };

  if (isMobile) return <MobileVideoDetection />;

  const showCentered = !file && !scanning && !result && !scannedUrl;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={showCentered ? "flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center" : "space-y-6"}>
      {showCentered ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyber-light-blue/20 to-cyber-blue/20">
            <Clapperboard className="h-10 w-10 text-cyber-light-blue" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Video Detection</h1>
          <p className="text-muted-foreground mb-8">Upload a video or paste a URL to analyze for deepfake indicators</p>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
              <TabsTrigger value="url" className="flex-1">Scan URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <label className="glass-card flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-display text-base font-semibold text-foreground">Drop a video here or click to upload</p>
                <p className="mt-1 text-sm text-muted-foreground">MP4, MOV, WebM up to 100MB</p>
                <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
              </label>
            </TabsContent>
            <TabsContent value="url">
              <div className="glass-card rounded-2xl p-6">
                <UrlInput
                  placeholder="Paste a video URL, YouTube link, or TikTok post…"
                  onSubmit={handleUrlScan}
                  loading={scanning}
                />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      ) : (
        <>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Deepfake Video Detection</h1>
            <p className="text-sm text-muted-foreground">
              {scannedUrl ? <>Scanned: <span className="text-primary">{scannedUrl}</span></> : "Upload a video to analyze for deepfake indicators"}
            </p>
          </div>

          <Card><CardContent className="p-6">
            {!file && !scannedUrl ? (
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
                  <TabsTrigger value="url" className="flex-1">Scan URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 transition-colors hover:border-primary/50 hover:bg-muted/50">
                    <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="font-display text-base font-semibold text-foreground">Drop a video here or click to upload</p>
                    <p className="text-sm text-muted-foreground">MP4, MOV, WebM up to 100MB</p>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
                  </label>
                </TabsContent>
                <TabsContent value="url">
                  <UrlInput
                    placeholder="Paste a video URL, YouTube link, or TikTok post…"
                    onSubmit={handleUrlScan}
                    loading={scanning}
                  />
                </TabsContent>
              </Tabs>
            ) : file ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
                  <Video className="h-8 w-8 text-cyber-light-blue" />
                  <div><p className="text-sm font-medium text-foreground">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setFile(null); setResult(null); setScannedUrl(null); }}>Clear</Button>
                  <Button onClick={handleScan} disabled={scanning}>
                    {scanning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><Video className="mr-2 h-4 w-4" /> Analyze Video</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {scanning && (
                  <>
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="font-display text-lg font-semibold text-foreground">Scanning URL…</p>
                  </>
                )}
                {!scanning && (
                  <Button variant="outline" onClick={() => { setScannedUrl(null); setResult(null); }}>Scan Another</Button>
                )}
              </div>
            )}
          </CardContent></Card>

          {scanning && file && (
            <Card><CardContent className="flex flex-col items-center py-16">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="font-display text-lg font-semibold text-foreground">Analyzing video frames…</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </CardContent></Card>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card><CardContent className="flex flex-col items-center py-8">
                  <RiskGauge score={result.risk_score} size={200} label="Authenticity" />
                  <p className="mt-2 font-display text-lg font-bold text-score-danger">{result.risk_label}</p>
                  <p className="mt-2 max-w-xl text-center text-sm text-muted-foreground">{result.verdict}</p>
                  {scannedUrl && <p className="mt-1 text-xs text-muted-foreground truncate max-w-[300px]">Source: {scannedUrl}</p>}
                </CardContent></Card>

                <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-cyber-light-blue" /> Recommendation</CardTitle></CardHeader>
                  <CardContent><div className="space-y-3">
                    <p className="text-sm text-foreground">{result.recommendation}</p>
                    {typeof result.deepfake_score === "number" && (
                      <p className="text-xs text-muted-foreground">Deepfake confidence: {Math.round(result.deepfake_score * 100)}%</p>
                    )}
                  </div></CardContent></Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default VideoDetection;