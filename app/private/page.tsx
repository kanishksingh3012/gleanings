"use client";

import { Button, Input } from "@heroui/react";
import { useState, useTransition } from "react";
import { unlock } from "@/app/actions";

const REPO_URL = "https://github.com/kanishksingh3012/gleanings";

export default function PrivatePage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const { ok } = await unlock(password);
      if (ok) window.location.href = "/";
      else setError(true);
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center">
      <span className="text-3xl">🌾</span>
      <h1 className="text-lg font-semibold">
        This Gleanings library is private
      </h1>
      <p className="text-sm text-muted">
        It&apos;s one person&apos;s personal, password-protected reading list.
        If that&apos;s you, enter the password below. If not, this project is
        open source — you&apos;re welcome to{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          deploy your own copy
        </a>{" "}
        with your own keys.
      </p>
      <a
        href="/demo"
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        See the demo, try it out →
      </a>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-separator" /> or unlock your library{" "}
        <span className="h-px flex-1 bg-separator" />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-2"
      >
        <Input
          type="password"
          aria-label="Password"
          placeholder="Password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          fullWidth
        />
        {error && <p className="text-sm text-danger">Wrong password.</p>}
        <Button type="submit" isDisabled={!password || pending} fullWidth>
          Unlock
        </Button>
      </form>
    </div>
  );
}
