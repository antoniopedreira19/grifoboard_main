import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PmpSetorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (setor: string) => void;
  isSaving?: boolean;
}

export const PmpSetorModal = React.memo(function PmpSetorModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: PmpSetorModalProps) {
  const [newSetor, setNewSetor] = useState("");

  const handleSave = () => {
    if (!newSetor.trim()) return;
    onSave(newSetor.trim());
    setNewSetor("");
  };

  const handleClose = () => {
    setNewSetor("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogTitle>Novo Setor</DialogTitle>
        <Input
          value={newSetor}
          onChange={(e) => setNewSetor(e.target.value)}
          placeholder="Nome do setor"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            }
          }}
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving || !newSetor.trim()}>
            {isSaving ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
