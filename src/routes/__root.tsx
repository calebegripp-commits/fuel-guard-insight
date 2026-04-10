import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FleetAudit — Auditoria de Frotas" },
      { name: "description", content: "Sistema de auditoria e análise de consumo de combustível para frotas" },
      { name: "author", content: "FleetAudit" },
      { property: "og:title", content: "FleetAudit — Auditoria de Frotas" },
      { property: "og:description", content: "Sistema de auditoria e análise de consumo de combustível para frotas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "FleetAudit — Auditoria de Frotas" },
      { name: "twitter:description", content: "Sistema de auditoria e análise de consumo de combustível para frotas" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8102cec3-94eb-44dd-9832-9d08dfebfc04/id-preview-599395a1--b46f0dda-89bb-45e2-a388-4e76ce06030b.lovable.app-1775842268537.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8102cec3-94eb-44dd-9832-9d08dfebfc04/id-preview-599395a1--b46f0dda-89bb-45e2-a388-4e76ce06030b.lovable.app-1775842268537.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
