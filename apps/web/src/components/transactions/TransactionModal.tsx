import { Dialog, DialogContent } from "@workspace/ui/components/dialog"
import { TransactionForm } from "@/components/transactions/TransactionForm"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "add" | "edit"
}

export function TransactionModal({
  isOpen,
  onClose,
  mode,
}: TransactionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background p-6 text-foreground shadow-lg sm:max-w-xl">
        <TransactionForm mode={mode} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
