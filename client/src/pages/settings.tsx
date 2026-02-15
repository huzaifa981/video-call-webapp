import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/use-auth";

export default function Settings() {
  const { data: user } = useUser();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your audio, video, and account preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
                style={{ backgroundColor: user?.avatarColor }}
              >
                {user?.email?.slice(0, 2).toUpperCase() || 'NA'}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user?.email || 'No email'}</h3>
                <p className="text-sm text-muted-foreground">ID: {user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Audio & Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">HD Video Quality</Label>
                <p className="text-sm text-muted-foreground">Stream video in 720p or higher</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Noise Cancellation</Label>
                <p className="text-sm text-muted-foreground">Reduce background noise during calls</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Always Join Muted</Label>
                <p className="text-sm text-muted-foreground">Start calls with microphone off</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="w-32">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
