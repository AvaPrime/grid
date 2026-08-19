import { createFileRoute } from "@tanstack/react-router";
import { LibraryApp } from "@/components/library-app";

export const Route = createFileRoute("/library")({ component: LibraryPage });

function LibraryPage() {
  return <LibraryApp />;
}
