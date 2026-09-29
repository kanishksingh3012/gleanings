"use client";

import { Button, Input, Modal, toast, useOverlayState } from "@heroui/react";
import { LockIcon, LockOpenIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { lock, unlock } from "@/app/actions";

interface EditLockProps {
  unlocked: boolean;
  /** False when EDIT_PASSWORD isn't set on this deployment (e.g. local dev). */
  configured: boolean;
}

export function EditLock({ unlocked, configured }: EditLockProps) {
  const state = useOverlayState();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!configured) return null;

  if (unlocked) {
    return (
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Lock editing"
        onPress={() => startTransition(async () => { await lock(); toast("Editing locked"); })}
      >
        <LockOpenIcon className="size-4" />
      </Button>
    );
  }

  function submit() {
    startTransition(async () => {
      const { ok } = await unlock(password);
      if (ok) {
        state.close();
        setPassword("");
        toast.success("Editing unlocked on this device");
      } else {
        setError(true);
      }
    });
  }

  return (
    <>
      <Button isIconOnly variant="ghost" aria-label="Unlock editing" onPress={state.open}>
        <LockIcon className="size-4" />
      </Button>
      <Modal state={state}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <Modal.Header>
                  <Modal.Heading>Unlock editing</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-2">
                  <p className="text-sm text-muted">Enter your edit password to star, note, archive and manage resources on this device.</p>
                  <Input
                    type="password"
                    aria-label="Edit password"
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    fullWidth
                  />
                  {error && <p className="text-sm text-danger">Wrong password.</p>}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="tertiary" onPress={state.close}>
                    Cancel
                  </Button>
                  <Button type="submit" isDisabled={!password || pending}>
                    Unlock
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
