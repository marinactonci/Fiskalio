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
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { BillInstance } from "@/convex/schema";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface DeleteBillInstanceAlertDialogProps {
  billInstance: BillInstance;
}

function DeleteBillInstanceAlertDialog({
  billInstance,
}: DeleteBillInstanceAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const deleteBillInstance = useMutation(api.billInstances.deleteBillInstance);

  const handleDeleteBillInstance = async () => {
    setLoading(true);
    try {
      const result = await deleteBillInstance({ id: billInstance._id as Id<"billInstances"> });

      if (result.success) {
        toast.success("Bill instance deleted successfully!");
        router.push(`/bills/${billInstance.billId}`);
      } else {
        toast.error(result.error || "Failed to delete bill instance.");
      }
    } catch (error) {
      toast.error("Failed to delete bill instance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={loading} variant="destructive" size={"sm"}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the bill
            instance and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={loading}
            onClick={handleDeleteBillInstance}
          >
            {loading ? "Deleting..." : "Delete Bill Instance"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteBillInstanceAlertDialog;
