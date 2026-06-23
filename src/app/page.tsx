import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Clock-In App</h1>
        <p className="text-muted-foreground mt-3">
          Workers clock in and out of fixed sites by scanning a Site Tag,
          picking their name and entering a personal PIN, and confirming they
          are physically on site.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clock</CardTitle>
            <CardDescription>
              For workers. Open this by scanning a Site Tag, which links to
              <code className="mx-1">/clock?site=&lt;siteId&gt;</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/clock">Go to clock page</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
            <CardDescription>
              For admins. Manage the roster and sites, review and export shifts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin">Go to admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
