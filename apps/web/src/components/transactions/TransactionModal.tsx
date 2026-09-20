import * as React from "react"
import {
  Dialog,
  DialogContent,
} from "@workspace/ui/components/dialog"
import { TransactionForm } from "./TransactionForm"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "add" | "edit"
}

export function TransactionModal({ isOpen, onClose, mode }: TransactionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-background text-foreground border-border shadow-lg">
        <TransactionForm mode={mode} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
