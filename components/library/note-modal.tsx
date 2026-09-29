"use client";

import { Button, Modal, TextArea, type useOverlayState } from "@heroui/react";
import { useState } from "react";

interface NoteModalProps {
  state: ReturnType<typeof useOverlayState>;
  title: string;
  initial: string | null;
  onSave: (note: string) => void;
}

/** Small note editor opened from a card's note icon. */
export function NoteModal({ state, title, initial, onSave }: NoteModalProps) {
  const [value, setValue] = useState(initial ?? "");

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="line-clamp-1">Note · {title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TextArea
                aria-label="Your note"
                placeholder="Why you saved this, what to try…"
                value={value}
                autoFocus
                onChange={(e) => setValue(e.target.value)}
                rows={5}
                fullWidth
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={state.close}>
                Cancel
              </Button>
              <Button
                onPress={() => {
                  if (value.trim() !== (initial ?? "").trim()) onSave(value);
                  state.close();
                }}
              >
                Save note
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
