import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { CalendarIcon, Check, Edit, Euro } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { format } from "date-fns";

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
import { Switch } from "@/components/ui/switch";
import { Badge, badgeVariants } from "@/components/ui/badge";

import { api } from "@/convex/_generated/api";
import type { BillInstance } from "@/convex/schema";
import { cn, formatDateForSaving } from "@/lib/utils";
import { billInstanceSchema } from "@/schemas/billInstance";

type BillInstanceFormValues = z.infer<typeof billInstanceSchema>;

interface EditBillInstanceDialogProps {
  billInstance: BillInstance &
    Partial<{
      billName: string;
      profileName: string;
      profileColor: string;
      profileId: string;
    }>;
  variant?: "default" | "quick";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditBillInstanceDialog({
  billInstance,
  variant = "default",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: EditBillInstanceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;

  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

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
        month: values.month.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        amount: values.amount,
        dueDate: formatDateForSaving(values.dueDate),
        description: values.description,
        isPaid: values.isPaid,
      });

      if (result.success) {
        toast.success("Bill instance updated successfully!");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to update bill instance.");
      }
    } catch {
      toast.error("Failed to update bill instance. Please try again.");
    }
  };

  const watchedIsPaid = form.watch("isPaid");
  const watchedDueDate = form.watch("dueDate");
  const isOverdue =
    !watchedIsPaid && watchedDueDate && watchedDueDate < new Date();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {variant === "default" && (
        <DialogTrigger asChild>
          <Button className="hover:bg-muted/50" size="sm" variant="outline">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-background/95 backdrop-blur-sm sm:max-w-[425px]">
        <DialogHeader>
          {variant === "default" ? (
            <>
              <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-transparent text-xl">
                Edit Bill Instance
              </DialogTitle>
              <DialogDescription>
                Update the details for this bill instance.
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-4">
                <Link
                  className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700"
                  href={`/bills/${billInstance.billId}`}
                  onClick={() => setOpen(false)}
                >
                  {billInstance.billName || "Unknown Bill"}
                </Link>
                <div className="flex items-center space-x-2">
                  {billInstance.profileId && (
                    <Link
                      href={`/profiles/${billInstance.profileId}`}
                      className={cn(
                        badgeVariants({ variant: "outline" }),
                        "text-xs flex items-center gap-1 bg-muted",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: billInstance.profileColor }}
                      />
                      {billInstance.profileName}
                    </Link>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                Quick edit for{" "}
                {format(new Date(billInstance.dueDate), "MMMM yyyy")}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {variant === "quick" && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {watchedDueDate
                        ? format(watchedDueDate, "PPP")
                        : "No date selected"}
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
            )}

            {variant === "default" && (
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
                              format(field.value, "MMMM yyyy")
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
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount {variant === "quick" && "(€)"}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="0.00"
                        step="0.01"
                        className="bg-background pr-9"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
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
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          type="button"
                          variant="outline"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
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
                          initialFocus={variant === "quick"}
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
                  <FormLabel>
                    Description {variant === "default" && "(Optional)"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className={cn(
                        "resize-none bg-background",
                        variant === "quick" && "min-h-[80px]",
                      )}
                      placeholder={
                        variant === "default"
                          ? "Additional notes about this bill instance..."
                          : "Enter bill description..."
                      }
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

            {variant === "quick" && billInstance.description && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-1">Original Description</p>
                <p className="text-sm text-muted-foreground">
                  {billInstance.description}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                disabled={form.formState.isSubmitting}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                {variant === "default" ? "Cancel" : "Close"}
              </Button>

              {variant === "default" ? (
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {form.formState.isSubmitting
                    ? "Updating..."
                    : "Update Instance"}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting || !form.formState.isDirty
                  }
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
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
