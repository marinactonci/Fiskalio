import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { billSchema } from "@/schemas/bill";
import { type Bill } from "@/convex/schema";
import { decryptString, encryptString } from "@/lib/utils";

type BillFormValues = {
  name: string;
  website?: string;
  username?: string;
  password?: string;
};

interface EditBillDialogProps {
  bill: Bill;
  onBillUpdated?: () => void;
}

export function EditBillDialog({ bill, onBillUpdated }: EditBillDialogProps) {
  const [open, setOpen] = useState(false);
  const updateBill = useMutation(api.bills.updateBill);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: bill.name,
      website: bill.eBill?.link || "",
      username: bill.eBill?.username ? decryptString(bill.eBill.username) : "",
      password: bill.eBill?.password ? decryptString(bill.eBill.password) : "",
    },
  });

  const onSubmit = async (values: BillFormValues) => {
    try {
      const eBillData =
        values.website || values.username || values.password
          ? {
              link: values.website || "",
              username: values.username ? encryptString(values.username) : "",
              password: values.password ? encryptString(values.password) : "",
            }
          : undefined;

      const result = await updateBill({
        id: bill._id,
        name: values.name,
        eBill: eBillData,
      });

      if (result.success) {
        toast.success("Bill updated successfully!");
        setOpen(false);
        onBillUpdated?.();
      } else {
        toast.error(result.error || "Failed to update bill.");
      }
    } catch {
      toast.error("Failed to update bill. Please try again.");
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="hover:bg-muted/50" variant="outline">
          <Edit className="mr-1 h-4 w-4" />
          Edit Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-sm sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-transparent text-xl">
            Edit Bill
          </DialogTitle>
          <DialogDescription>
            Update the details for this bill.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Electricity, Internet, Water"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      type="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Account username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Account password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                disabled={form.formState.isSubmitting}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                disabled={form.formState.isSubmitting}
                type="submit"
              >
                {form.formState.isSubmitting ? "Updating..." : "Update Bill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
