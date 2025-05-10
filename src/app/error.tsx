
"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8">
      <div className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h2 className="text-3xl font-semibold text-destructive mb-4">
          Oops! Something went wrong.
        </h2>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. We apologize for the inconvenience.
          You can try to refresh the page or contact support if the problem persists.
        </p>
        {error.message && (
            <p className="text-sm bg-muted p-3 rounded-md text-left mb-6">
                <strong>Error details:</strong> {error.message}
            </p>
        )}
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          variant="default"
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
