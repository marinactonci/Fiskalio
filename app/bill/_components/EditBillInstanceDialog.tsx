import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { CalendarIcon, Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { MonthPicker } from "@/components/ui/monthpicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { BillInstance } from "@/convex/schema";
import { cn } from "@/lib/utils";

const billInstanceSchema = z.object({
  month: z.date({ required_error: "Month is required" }),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.date({ required_error: "Due date is required" }),
  description: z.string().optional(),
});

type BillInstanceFormValues = z.infer<typeof billInstanceSchema>;

interface EditBillInstanceDialogProps {
  billInstance: BillInstance;
}

export function EditBillInstanceDialog({
  billInstance,
}: EditBillInstanceDialogProps) {
  const [open, setOpen] = useState(false);
  const updateBillInstance = useMutation(api.billInstances.updateBillInstance);

  const form = useForm<BillInstanceFormValues>({
    resolver: zodResolver(billInstanceSchema),
    defaultValues: {
      month: new Date(billInstance.month),
      amount: billInstance.amount,
      dueDate: new Date(billInstance.dueDate),
      description: billInstance.description || "",
    },
  });

  const onSubmit = async (values: BillInstanceFormValues) => {
    try {
      await updateBillInstance({
        id: billInstance._id,
        month: values.month.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        amount: values.amount,
        dueDate: values.dueDate.toISOString().split("T")[0],
        description: values.description,
      });
      toast.success("Bill instance updated successfully!");
      setOpen(false);
    } catch {
      toast.error("Failed to update bill instance. Please try again.");
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="hover:bg-muted/50" size="sm" variant="ghost">
          <Edit className="mr-1 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-sm sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-transparent text-xl">
            Edit Bill Instance
          </DialogTitle>
          <DialogDescription>
            Update the details for this bill instance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          type="button"
                          variant="outline"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            field.value.toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })
                          ) : (
                            <span>Select month</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <MonthPicker
                          onMonthSelect={field.onChange}
                          selectedMonth={field.value}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          type="button"
                          variant="outline"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            field.value.toLocaleDateString()
                          ) : (
                            <span>Select due date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          onSelect={field.onChange}
                          selected={field.value}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Additional notes about this bill instance..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {form.formState.isSubmitting
                  ? "Updating..."
                  : "Update Instance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
