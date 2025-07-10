import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
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
import { api } from "@/convex/_generated/api";
import type { Profile } from "@/convex/schema";

interface DeleteProfileAlertDialogProps {
  profile: Profile;
}

function DeleteProfileAlertDialog({ profile }: DeleteProfileAlertDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const deleteProfileMutation = useMutation(api.profiles.deleteProfile);

  const deleteProfile = async () => {
    setLoading(true);
    try {
      await deleteProfileMutation({ id: profile._id });
    } catch {
      toast.error("Failed to delete profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={loading} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Profile
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            profile &quot;{profile.name}&quot; and all associated bills and bill
            instances.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={loading}
            onClick={deleteProfile}
          >
            {loading ? "Deleting..." : "Delete Profile"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteProfileAlertDialog;
