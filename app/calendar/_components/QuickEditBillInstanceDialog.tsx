import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Calendar as CalendarIcon, Euro } from "lucide-react";
import type { BillInstance } from "@/convex/schema";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface QuickEditInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billInstance: BillInstance & {
    billName: string;
    profileName: string;
    profileColor: string;
    profileId: string;
  };
}

export function QuickEditInstanceDialog({
  open,
  onOpenChange,
  billInstance,
}: QuickEditInstanceDialogProps) {
  const [amount, setAmount] = useState(billInstance.amount.toString());
  const [dueDate, setDueDate] = useState(billInstance.dueDate);
  const [description, setDescription] = useState(
    billInstance.description || "",
  );
  const [isPaid, setIsPaid] = useState(billInstance.isPaid);
  const [loading, setLoading] = useState(false);

  const updateBillInstance = useMutation(api.billInstances.updateBillInstance);

  useEffect(() => {
    if (open) {
      setAmount(billInstance.amount.toString());
      setDueDate(billInstance.dueDate);
      setDescription(billInstance.description || "");
      setIsPaid(billInstance.isPaid);
    }
  }, [
    billInstance._id,
    billInstance.amount,
    billInstance.dueDate,
    billInstance.description,
    billInstance.isPaid,
    open,
  ]);

  const saveChanges = async () => {
    const newAmount = parseFloat(amount);
    if (isNaN(newAmount) || newAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!dueDate) {
      toast.error("Please select a due date");
      return;
    }

    setLoading(true);
    try {
      console.log("Saving changes for instance:", billInstance._id);
      const result = await updateBillInstance({
        id: billInstance._id,
        amount: newAmount,
        dueDate: dueDate,
        description: description.trim(),
        isPaid: isPaid,
      });

      if (result.success) {
        onOpenChange(false);
        toast.success("Bill instance updated successfully");
      } else {
        toast.error(result.error || "Failed to update bill instance");
      }
    } catch (error) {
      console.error("Error updating instance:", error);
      toast.error("Failed to update bill instance");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    amount !== billInstance.amount.toString() ||
    dueDate !== billInstance.dueDate ||
    description !== (billInstance.description || "") ||
    isPaid !== billInstance.isPaid;

  const isOverdue =
    !isPaid && new Date(dueDate) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <Link
              className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700"
              href={`/bills/${billInstance.billId}`}
            >
              {billInstance.billName}
            </Link>
            <div className="flex items-center space-x-2">
              <Link
                href={`/profiles/${billInstance.profileId}`}
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "text-xs flex items-center gap-1",
                )}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: billInstance.profileColor }}
                />
                {billInstance.profileName}
              </Link>
            </div>
          </DialogTitle>
          <DialogDescription>
            Quick edit for {format(new Date(billInstance.dueDate), "MMMM yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {dueDate ? format(new Date(dueDate), "PPP") : "No date selected"}
                </p>
              </div>
            </div>
            <Badge
              variant={
                isPaid
                  ? "default"
                  : isOverdue
                    ? "destructive"
                    : "secondary"
              }
              className={
                isPaid
                  ? "bg-green-100 text-green-800 border-green-200"
                  : isOverdue
                    ? "bg-red-100 text-red-200 border-red-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
              }
            >
              {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (€)</Label>
              <div className="relative">
                <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      format(new Date(dueDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) =>
                      date && setDueDate(format(date, "yyyy-MM-dd"))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter bill description..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="paid-status">Mark as Paid</Label>
              <Switch
                id="paid-status"
                checked={isPaid}
                onCheckedChange={setIsPaid}
                disabled={loading}
              />
            </div>
          </div>

          {billInstance.description && (
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-sm font-medium mb-1">Current Description</p>
              <p className="text-sm text-muted-foreground">
                {billInstance.description}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Close
          </Button>
          <Button
            onClick={saveChanges}
            disabled={loading || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
