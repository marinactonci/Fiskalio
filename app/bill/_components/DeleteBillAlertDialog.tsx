import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Bill } from "@/convex/schema";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface DeleteBillAlertDialogProps {
  bill: Bill;
}

function DeleteBillAlertDialog({ bill }: DeleteBillAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const deleteBill = useMutation(api.bills.deleteBill);

  const handleDeleteBill = async () => {
    setLoading(true);
    try {
      await deleteBill({ id: bill._id as Id<"bills"> });
      toast.success("Bill deleted successfully!");
      router.push(`/profile/${bill?.profileId}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Failed to delete bill. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={loading} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Bill
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the bill
            &quot;{bill.name}&quot; and all associated bill instances.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
            onClick={handleDeleteBill}
          >
            {loading ? "Deleting..." : "Delete Bill"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteBillAlertDialog;
