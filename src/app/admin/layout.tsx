import type { Metadata } from "next";

// Keep every admin page out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
