import { createFileRoute } from "@tanstack/react-router";
import { AppShell, HydrateGate } from "@/components/pathshala/shell";

export const Route = createFileRoute("/_app")({
  component: () => (
    <HydrateGate>
      <AppShell />
    </HydrateGate>
  ),
});
