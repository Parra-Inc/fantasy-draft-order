import { NewDraftForm } from "./new-draft-form";

export default function NewDraftPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create a draft</h1>
        <p className="text-muted-foreground">
          Once scheduled, your draft cannot be edited. Share the link with your league.
        </p>
      </header>
      <NewDraftForm />
    </main>
  );
}
