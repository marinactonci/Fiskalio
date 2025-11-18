import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Check, Calendar as CalendarIcon, Euro } from "lucide-react";
import { useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import type { BillInstance } from "@/convex/schema";
import { cn, formatDateForSaving } from "@/lib/utils";
import { format } from "date-fns";
import { billInstanceSchema } from "@/schemas/billInstance";
import Link from "next/link";

type BillInstanceFormValues = z.infer<typeof billInstanceSchema>;

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
  const updateBillInstance = useMutation(api.billInstances.updateBillInstance);

  const form = useForm<BillInstanceFormValues>({
    resolver: zodResolver(billInstanceSchema),
    defaultValues: {
      month: new Date(billInstance.month),
      amount: billInstance.amount,
      dueDate: new Date(billInstance.dueDate + "T00:00:00"),
      description: billInstance.description || "",
      isPaid: billInstance.isPaid,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        month: new Date(billInstance.month),
        amount: billInstance.amount,
        dueDate: new Date(billInstance.dueDate + "T00:00:00"),
        description: billInstance.description || "",
        isPaid: billInstance.isPaid,
      });
    }
  }, [billInstance, open, form]);

  const onSubmit = async (values: BillInstanceFormValues) => {
    try {
      const result = await updateBillInstance({
        id: billInstance._id,
        amount: values.amount,
        dueDate: formatDateForSaving(values.dueDate),
        description: values.description,
        isPaid: values.isPaid,
      });

      if (result.success) {
        toast.success("Bill instance updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update bill instance");
      }
    } catch (error) {
      console.error("Error updating instance:", error);
      toast.error("Failed to update bill instance");
    }
  };

  const watchedIsPaid = form.watch("isPaid");
  const watchedDueDate = form.watch("dueDate");
  
  const isOverdue =
    !watchedIsPaid && watchedDueDate && watchedDueDate < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <Link
              className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700"
              href={`/bills/${billInstance.billId}`}
              onClick={() => onOpenChange(false)}
            >
              {billInstance.billName}
            </Link>
            <div className="flex items-center space-x-2">
              <Link
                href={`/profiles/${billInstance.profileId}`}
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "text-xs flex items-center gap-1 bg-muted",
                )}
                onClick={() => onOpenChange(false)}
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {watchedDueDate ? format(watchedDueDate, "PPP") : "No date selected"}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  watchedIsPaid
                    ? "default"
                    : isOverdue
                      ? "destructive"
                      : "secondary"
                }
                className={
                  watchedIsPaid
                    ? "bg-green-100 text-green-800 border-green-200"
                    : isOverdue
                      ? "bg-red-100 text-red-200 border-red-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }
              >
                {watchedIsPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
              </Badge>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (€)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseFloat(e.target.value) || 0)
                          }
                          className="pr-9 bg-background"
                        />
                      </div>
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
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter bill description..."
                        className="min-h-[80px] resize-none bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs bg-background">
                    <div className="space-y-0.5">
                      <FormLabel>Mark as Paid</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {billInstance.description && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-1">Original Description</p>
                <p className="text-sm text-muted-foreground">
                  {billInstance.description}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {form.formState.isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
