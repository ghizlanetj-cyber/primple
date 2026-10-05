import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired page: the old URL permanently points to the closest remaining page.
export const Route = createFileRoute("/enterprise")({
  beforeLoad: () => {
    throw redirect({ to: "/contact", statusCode: 301 });
  },
});
