"use client";

import { ApplicationCreateForm } from "@/components/applications/application-create-form";

export default function NewApplicationPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <ApplicationCreateForm />
    </main>
  );
}
