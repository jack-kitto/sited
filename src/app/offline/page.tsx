import { WifiOffIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="bg-muted text-muted-foreground mx-auto mb-2 flex size-14 items-center justify-center rounded-full">
            <WifiOffIcon className="size-8" />
          </div>
          <CardTitle className="text-xl">You&apos;re offline</CardTitle>
          <CardDescription>
            Sited needs a connection to confirm you&apos;re on site. Move to an
            area with signal and try again — your last action was not lost.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-center text-sm">
          This page will reconnect automatically once you&apos;re back online.
        </CardContent>
      </Card>
    </main>
  );
}
