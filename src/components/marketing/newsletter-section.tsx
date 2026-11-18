import { NewsletterForm } from "@/components/newsletter/newsletter-form";

export function NewsletterSection() {
  return (
    <section className="border-sideline/50 border-t">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-chalk text-3xl font-bold tracking-tight sm:text-4xl">
          Get ready for draft season
        </h2>
        <p className="text-hashmark mx-auto mt-4 max-w-xl text-lg">
          New draft guides, punishment ideas and league tools, in your inbox before your league picks.
        </p>
        <NewsletterForm source="home" className="mx-auto mt-8 max-w-md text-left" />
        <p className="text-hashmark/70 mt-3 text-sm">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
