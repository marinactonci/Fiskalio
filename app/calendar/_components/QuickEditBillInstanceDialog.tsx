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
import { Check, Calendar, Euro } from "lucide-react";
import type { BillInstance } from "@/convex/schema";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const [description, setDescription] = useState(
    billInstance.description || "",
  );
  const [isPaid, setIsPaid] = useState(billInstance.isPaid);
  const [loading, setLoading] = useState(false);

  const updateBillInstance = useMutation(api.billInstances.updateBillInstance);

  useEffect(() => {
    if (open) {
      setAmount(billInstance.amount.toString());
      setDescription(billInstance.description || "");
      setIsPaid(billInstance.isPaid);
    }
  }, [
    billInstance._id,
    billInstance.amount,
    billInstance.description,
    billInstance.isPaid,
    open,
  ]);

  const saveChanges = async () => {
    const newAmount = parseFloat(amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      console.log("Saving changes for instance:", billInstance._id);
      const result = await updateBillInstance({
        id: billInstance._id,
        amount: newAmount,
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
    description !== (billInstance.description || "") ||
    isPaid !== billInstance.isPaid;

  const isOverdue =
    !billInstance.isPaid && new Date(billInstance.dueDate) < new Date();

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
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(billInstance.dueDate), "PPP")}
                </p>
              </div>
            </div>
            <Badge
              variant={
                billInstance.isPaid
                  ? "default"
                  : isOverdue
                    ? "destructive"
                    : "secondary"
              }
              className={
                billInstance.isPaid
                  ? "bg-green-100 text-green-800 border-green-200"
                  : isOverdue
                    ? "bg-red-100 text-red-200 border-red-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
              }
            >
              {billInstance.isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
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
