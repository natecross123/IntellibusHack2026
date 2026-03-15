import React from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import MobileSettings from "@/pages/mobile/MobileSettings";

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  if (isMobile) return <MobileSettings />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Full Name</Label><Input value={user?.fullName ?? ""} readOnly /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} readOnly /></div>
          </div>
          <p className="text-sm text-muted-foreground">Profile details are loaded from your authenticated account.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base">{theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Notification preferences are not yet persisted, so no saved settings are shown here.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Settings;
