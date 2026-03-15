import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, AlertTriangle, CheckCircle, ScanLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RiskGauge from "@/components/RiskGauge";
import UrlInput from "@/components/UrlInput";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileImageDetection from "@/pages/mobile/MobileImageDetection";
import { useToast } from "@/hooks/use-toast";
import { MediaScanResponse, scanImageFile, scanImageUrl } from "@/lib/securityApi";

const ImageDetection: React.FC = () => {
  const isMobile = useIsMobile();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<MediaScanResponse | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setScannedUrl(null); }
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);

    try {
      const response = await scanImageFile(file);
      setResult(response);
    } catch (error) {
      toast({
        title: "Image scan failed",
        description: error instanceof Error ? error.message : "Unable to scan image.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleUrlScan = async (url: string) => {
    setScannedUrl(url);
    setFile(null);
    setPreview(null);
    setScanning(true);

    try {
      const response = await scanImageUrl(url);
      setResult(response);
    } catch (error) {
      toast({
        title: "Image URL scan failed",
        description: error instanceof Error ? error.message : "Unable to scan image URL.",
        variant: "destructive",
      });
      setScannedUrl(null);
    } finally {
      setScanning(false);
    }
  };

  if (isMobile) return <MobileImageDetection />;

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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyber-blue/20 to-cyber-light-blue/20">
            <ScanLine className="h-10 w-10 text-cyber-blue" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Image Detection</h1>
          <p className="text-muted-foreground mb-8">Upload an image or paste a URL to scan for AI-generated artifacts</p>
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
                <p className="font-display text-base font-semibold text-foreground">Drop an image here or click to upload</p>
                <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </TabsContent>
            <TabsContent value="url">
              <div className="glass-card rounded-2xl p-6">
                <UrlInput
                  placeholder="Paste an image URL, Instagram post, or social media link…"
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
            <h1 className="font-display text-2xl font-bold text-foreground">Deepfake Image Detection</h1>
            <p className="text-sm text-muted-foreground">
              {scannedUrl ? <>Scanned: <span className="text-primary">{scannedUrl}</span></> : "Upload an image to scan for AI-generated artifacts"}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              {!preview && !scannedUrl ? (
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
                    <TabsTrigger value="url" className="flex-1">Scan URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 transition-colors hover:border-primary/50 hover:bg-muted/50">
                      <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="font-display text-base font-semibold text-foreground">Drop an image here or click to upload</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </label>
                  </TabsContent>
                  <TabsContent value="url">
                    <UrlInput
                      placeholder="Paste an image URL, Instagram post, or social media link…"
                      onSubmit={handleUrlScan}
                      loading={scanning}
                    />
                  </TabsContent>
                </Tabs>
              ) : preview ? (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-lg overflow-hidden rounded-xl">
                    <img src={preview} alt="Uploaded" className="w-full" />
                    {scanning && (
                      <div className="absolute inset-0 bg-primary/10">
                        <div className="absolute left-0 right-0 h-1 animate-scan-line bg-primary/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setResult(null); setScannedUrl(null); }}>Clear</Button>
                    <Button onClick={() => void handleScan()} disabled={scanning}>
                      {scanning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><ImageIcon className="mr-2 h-4 w-4" /> Analyze Image</>}
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
            </CardContent>
          </Card>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-2">
                <Card><CardContent className="flex flex-col items-center py-8">
                  <RiskGauge score={result.risk_score} size={180} label="Authenticity" />
                  <p className="mt-2 font-display text-lg font-bold text-score-danger">{result.risk_label}</p>
                  <p className="mt-2 max-w-xl text-center text-sm text-muted-foreground">{result.verdict}</p>
                  {scannedUrl && <p className="mt-1 text-xs text-muted-foreground truncate max-w-[250px]">Source: {scannedUrl}</p>}
                </CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Recommendation</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-foreground">{result.recommendation}</p>
                    {typeof result.ai_generated_score === "number" && (
                      <p className="text-xs text-muted-foreground">AI-generated confidence: {Math.round(result.ai_generated_score * 100)}%</p>
                    )}
                  </CardContent></Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default ImageDetection;