import { Dialog, DialogContent } from "@workspace/ui/components/dialog"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import type { Transaction } from "@/data/mock-data"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "add" | "edit"
  transaction?: Transaction
}

export function TransactionModal({
  isOpen,
  onClose,
  mode,
  transaction,
}: TransactionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background p-6 text-foreground shadow-lg sm:max-w-xl">
        <TransactionForm
          key={transaction?.id ?? mode}
          mode={mode}
          onClose={onClose}
          transaction={transaction}
          transactionId={transaction?.id}
        />
      </DialogContent>
    </Dialog>
  )
}
