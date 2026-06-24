"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({
  slug,
  name: initialName,
  timezone: initialTimezone,
}: {
  slug: string;
  name: string;
  timezone: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // A blank password is omitted so the stored hash is left unchanged.
        body: JSON.stringify({
          name,
          timezone,
          ...(password ? { password } : {}),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to save settings");
        return;
      }
      const data = (await res.json()) as {
        company: { name: string; timezone: string };
      };
      setName(data.company.name);
      setTimezone(data.company.timezone);
      // Clear the password field after a successful save.
      setPassword("");
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h1 className="font-heading text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Company name, admin password, and timezone.
        </p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Company settings</CardTitle>
          <CardDescription>
            Changes apply to this Company only. The Company Slug is permanent and
            cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-slug">Company Slug</Label>
              <Input id="company-slug" value={slug} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                Permanent. Used in your clock and admin URLs.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="company-timezone">Timezone</Label>
              <Input
                id="company-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Asia/Tokyo"
                required
              />
              <p className="text-xs text-muted-foreground">
                IANA timezone name (e.g. Asia/Tokyo). Drives this Company&apos;s
                calendar logic.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="company-password">New admin password</Label>
              <Input
                id="company-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters. Required on the next login once changed.
              </p>
            </div>

            <Button
              type="submit"
              disabled={pending || !name.trim() || !timezone.trim()}
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
