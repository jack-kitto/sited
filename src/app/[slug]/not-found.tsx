import Link from "next/link";
import { Building2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Rendered when a `/{slug}/...` route resolves to no real Company (ADR-0004) —
 * an unknown or malformed Company Slug. Never exposes any Company's data.
 */
export default function CompanyNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Building2Icon className="size-8" />
          </div>
          <CardTitle className="text-xl">Company not found</CardTitle>
          <CardDescription>
            We couldn&apos;t find a company for this link. Check the Company Slug
            with your admin, or scan your Site Tag instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/clock">Enter a company slug</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
