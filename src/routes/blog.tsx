import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/shared/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const title = "Printing insights & guides | Primpel Blog";
const description =
  "Practical guides on paper stocks, finishes, artwork setup and print budgets for Moroccan businesses.";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogPage,
});

const posts = [
  {
    tag: "Guides",
    title: "Choosing the right paper weight for business cards",
    excerpt: "300g, 400g or 600g? What each weight feels like in the hand and when the upgrade is worth it.",
    read: "5 min read",
  },
  {
    tag: "Artwork",
    title: "Export a print-ready PDF in five minutes",
    excerpt: "Bleed, trim marks, colour profile and image resolution — the settings that prevent reprints.",
    read: "4 min read",
  },
  {
    tag: "Finishes",
    title: "Soft touch, spot UV or foil: which finish sells",
    excerpt: "How each finish photographs, how it ages, and what it adds to your unit price.",
    read: "6 min read",
  },
  {
    tag: "Budgets",
    title: "How to plan a yearly print budget",
    excerpt: "Batch sizes, reorder cycles and the quantity breaks where the price per unit really drops.",
    read: "7 min read",
  },
  {
    tag: "Packaging",
    title: "Packaging that survives Moroccan delivery routes",
    excerpt: "Board thickness, lamination and structural choices for products that ship well.",
    read: "5 min read",
  },
  {
    tag: "Retail",
    title: "Signage that still looks new after a season outdoors",
    excerpt: "Materials, inks and mounting options for shopfronts and events.",
    read: "4 min read",
  },
];

function BlogPage() {
  const { tr } = useI18n();
  return (
    <SiteShell>
      <PageHero
        eyebrow="Blog"
        title="Print knowledge, minus the jargon."
        subtitle="Short guides from our production team on getting better print for less money."
      />

      <section className="section-shell py-16 md:py-24">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.title} delay={i * 0.05}>
              <article className="surface-card flex h-full flex-col p-6">
                <p className="eyebrow text-primary">{tr(post.tag)}</p>
                <h2 className="mt-3 text-lg">{tr(post.title)}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{tr(post.excerpt)}</p>
                <p className="mt-4 text-xs text-muted-foreground">{tr(post.read)}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="surface-card mt-12 p-8 text-center">
          <h2 className="text-2xl">{tr("Want a guide on something specific?")}</h2>
          <p className="mt-3 text-muted-foreground">{tr("Tell us the topic and our production team will write it.")}</p>
          <Button asChild size="lg" className="mt-6 rounded-full px-7">
            <Link to="/contact">{tr("Suggest a topic")}</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
