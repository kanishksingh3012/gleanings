"use client";

import { toast } from "@heroui/react";
import { useTransition } from "react";

/** Runs a server action in a transition and reports the outcome as a toast. */
export function useAction() {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, success?: string) {
    startTransition(async () => {
      try {
        await action();
        if (success) toast.success(success);
      } catch (err) {
        toast.danger(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return { pending, run };
}
