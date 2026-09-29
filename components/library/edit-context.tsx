"use client";

import { Button, Input, Modal, toast, useOverlayState } from "@heroui/react";
import { LockIcon, LockOpenIcon } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, useTransition } from "react";
import { lock, unlock } from "@/app/actions";

interface EditContextValue {
  editable: boolean;
  /** Runs `action` now if unlocked; otherwise asks for the password, then runs it. */
  requireEdit: (action: () => void) => void;
}

const EditContext = createContext<EditContextValue>({ editable: false, requireEdit: () => {} });

export const useEdit = () => useContext(EditContext);

interface EditProviderProps {
  initialEditable: boolean;
  configured: boolean;
  children: React.ReactNode;
}

export function EditProvider({ initialEditable, configured, children }: EditProviderProps) {
  const [editable, setEditable] = useState(initialEditable);
  const modal = useOverlayState();
  const pending = useRef<(() => void) | null>(null);

  const requireEdit = useCallback(
    (action: () => void) => {
      if (editable) return action();
      if (!configured) {
        toast.danger("Editing isn't set up — add EDIT_PASSWORD to this deployment.");
        return;
      }
      pending.current = action;
      modal.open();
    },
    [editable, configured, modal],
  );

  return (
    <EditContext.Provider value={{ editable, requireEdit }}>
      {children}
      <UnlockModal
        state={modal}
        onUnlocked={() => {
          setEditable(true);
          pending.current?.();
          pending.current = null;
        }}
      />
    </EditContext.Provider>
  );
}

export function EditLockButton() {
  const { editable, requireEdit } = useEdit();
  const [pending, startTransition] = useTransition();

  if (editable) {
    return (
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Lock editing"
        isDisabled={pending}
        onPress={() =>
          startTransition(async () => {
            await lock();
            window.location.reload();
          })
        }
      >
        <LockOpenIcon className="size-4" />
      </Button>
    );
  }
  return (
    // Unlocking flips `editable`, which re-renders this as the unlocked button.
    <Button isIconOnly variant="ghost" aria-label="Unlock editing" onPress={() => requireEdit(() => {})}>
      <LockIcon className="size-4" />
    </Button>
  );
}

function UnlockModal({ state, onUnlocked }: { state: ReturnType<typeof useOverlayState>; onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const { ok } = await unlock(password);
      if (!ok) return setError(true);
      state.close();
      setPassword("");
      toast.success("Editing unlocked on this device");
      onUnlocked();
    });
  }

  return (
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
                <p className="text-sm text-muted">Enter your edit password to star, add notes, archive and manage resources on this device.</p>
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
  );
}
