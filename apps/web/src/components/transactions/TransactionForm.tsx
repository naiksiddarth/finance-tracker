import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock, Check, Trash2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import {
  TransactionTypeSelector,
  type TransactionType,
} from "./TransactionTypeSelector"

export interface TransactionFormProps {
  mode: "add" | "edit"
  onClose?: () => void
}

export function TransactionForm({ mode, onClose }: TransactionFormProps) {
  const [type, setType] = React.useState<TransactionType>(
    mode === "edit" ? "expense" : "expense"
  )
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [time, setTime] = React.useState("14:30")
  const [amount, setAmount] = React.useState(mode === "edit" ? "86.40" : "")

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">
          {mode === "add" ? "Add Transaction" : "Edit Transaction"}
        </h2>
        {mode === "add" ? (
          <Badge
            variant="outline"
            className="border-border text-[10px] font-semibold text-muted-foreground uppercase"
          >
            New
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-muted font-mono text-[10px] text-muted-foreground"
          >
            ID: #TXN-88219
          </Badge>
        )}
      </div>

      <p className="-mt-4 text-sm text-muted-foreground">
        {mode === "add"
          ? "Record a debit outflow or incoming credit to your ledger."
          : "Modify verified entries or reconcile discrepancies."}
      </p>

      {/* Transaction Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Transaction Type</Label>
        <TransactionTypeSelector value={type} onChange={setType} />
      </div>

      {/* Amount */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <Label className="text-sm font-medium">Amount</Label>
          {mode === "edit" ? (
            <div className="flex items-center gap-1 text-xs text-success">
              <Check className="h-3 w-3" />
              <span>Imported via Bank Sync</span>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              USD ($)
            </span>
          )}
        </div>
        <div className="relative">
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-lg font-medium text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            className="h-12 pl-7 font-mono text-lg font-medium"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Quick actions underneath Amount */}
        <div className="flex items-center justify-between pt-1">
          {mode === "add" ? (
            <div className="flex items-center gap-2">
              <span className="mr-1 text-xs text-muted-foreground">
                Quick add:
              </span>
              {["+$10", "+$25", "+$50", "+$100"].map((btn) => (
                <Button
                  key={btn}
                  variant="outline"
                  size="sm"
                  className="h-6 rounded-sm border-border px-2 font-mono text-xs"
                >
                  {btn}
                </Button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs text-muted-foreground">
                  Adjust:
                </span>
                {["+10% Tip", "+20% Tip", "Split 50%"].map((btn) => (
                  <Button
                    key={btn}
                    variant="outline"
                    size="sm"
                    className="h-6 rounded-sm border-border px-2 font-mono text-xs"
                  >
                    {btn}
                  </Button>
                ))}
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                Original: -$86.40
              </span>
            </>
          )}
        </div>
      </div>

      {/* Description / Merchant */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Description / Merchant</Label>
        <div className="relative">
          <Input
            placeholder={
              mode === "add" ? "e.g. Trader Joe's, Monthly MetroPass" : ""
            }
            defaultValue={mode === "edit" ? "Whole Foods Market" : ""}
          />
          {mode === "edit" && (
            <Check className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-success" />
          )}
        </div>
      </div>

      {/* Category and Source Account Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Category</Label>
          <Select defaultValue={mode === "edit" ? "groceries" : undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groceries">Groceries & Food</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-medium">Source Account</Label>
          <Select defaultValue="chase">
            <SelectTrigger>
              <SelectValue placeholder="Select account..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chase">Chase Sapphire (*4910)</SelectItem>
              <SelectItem value="checking">Main Checking (*1120)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date and Time Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-between text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                {date ? format(date, "MM/dd/yyyy") : <span>Pick a date</span>}
                <CalendarIcon className="h-4 w-4 text-muted-foreground opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-medium">Time</Label>
          <div className="relative">
            <Input
              type="time"
              className="w-full text-left font-normal uppercase"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <Clock className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <Label className="text-sm font-medium">
            {mode === "add" ? "Notes (Optional)" : "Notes & Tags"}
          </Label>
          {mode === "add" ? (
            <span className="text-xs text-muted-foreground">
              Tax receipt / memo
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Last updated today
            </span>
          )}
        </div>
        <Textarea
          placeholder={
            mode === "add"
              ? "Add specific details, reimbursement tags, or reference codes..."
              : ""
          }
          defaultValue={
            mode === "edit"
              ? "Weekly organic grocery run; includes items for team dinner gathering. Tag: #FamilyExpense"
              : ""
          }
          className="min-h-20 resize-none"
        />
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col-reverse gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {mode === "add" ? (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              Save & Add Another
            </Button>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="ghost"
                className="flex-1 sm:flex-none"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button className="flex-1 sm:flex-none">
                <Check className="mr-2 h-4 w-4" /> Save Transaction
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onClose}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Transaction
            </Button>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="ghost"
                className="flex-1 sm:flex-none"
                onClick={onClose}
              >
                Discard Changes
              </Button>
              <Button className="flex-1 sm:flex-none">
                <Check className="mr-2 h-4 w-4" /> Update Transaction
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
