"use client";

import { AlertDialog, Button, useOverlayState } from "@heroui/react";
import { Trash2Icon } from "lucide-react";

interface ConfirmDeleteProps {
  itemLabel: string;
  description: string;
  onConfirm: () => void;
}

/** Icon button that opens a confirmation dialog before a permanent delete. */
export function ConfirmDelete({ itemLabel, description, onConfirm }: ConfirmDeleteProps) {
  const state = useOverlayState();

  return (
    <>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Delete ${itemLabel}`} onPress={state.open}>
        <Trash2Icon className="size-4 text-muted" />
      </Button>
      <AlertDialog isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container size="sm">
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>Delete permanently?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-muted">{description}</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="tertiary" onPress={state.close}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    state.close();
                    onConfirm();
                  }}
                >
                  Delete
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
