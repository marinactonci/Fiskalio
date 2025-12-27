"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { CalendarIcon, Plus } from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn, formatDateForSaving } from "@/lib/utils";
import { format } from "date-fns";
import { billInstanceSchema } from "@/schemas/billInstance";

// Extend the schema to include profileId and billId for validation in the form
const extendedSchema = billInstanceSchema.extend({
  profileId: z.string().min(1, "Profile is required"),
  billId: z.string().min(1, "Bill is required"),
});

type BillInstanceFormValues = z.infer<typeof extendedSchema>;

export function CreateBillInstanceFromCalendarDialog() {
  const [open, setOpen] = useState(false);
  const createBillInstance = useMutation(api.billInstances.createBillInstance);
  
  // Queries
  const profilesResult = useQuery(api.profiles.getProfilesForUser);
  const profiles = profilesResult?.success ? profilesResult.data : [];

  const form = useForm<BillInstanceFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      profileId: "",
      billId: "",
      month: undefined,
      amount: 0,
      dueDate: undefined,
      description: "",
    },
  });

  const selectedProfileId = form.watch("profileId");
  
  // Fetch bills when profile is selected
  const billsResult = useQuery(
    api.bills.getBillsForProfile, 
    selectedProfileId ? { profileId: selectedProfileId as Id<"profiles"> } : "skip"
  );
  const bills = billsResult?.success ? billsResult.data : [];

  // Reset bill selection when profile changes
  useEffect(() => {
    form.setValue("billId", "");
  }, [selectedProfileId, form]);

  const onSubmit = async (values: BillInstanceFormValues) => {
    try {
      const result = await createBillInstance({
        billId: values.billId as Id<"bills">,
        month: values.month.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        amount: values.amount,
        dueDate: formatDateForSaving(values.dueDate),
        description: values.description,
      });

      if (result.success) {
        toast.success("Bill instance created successfully!");
        form.reset();
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to create bill instance.");
      }
    } catch {
      toast.error("Failed to create bill instance. Please try again");
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/95 backdrop-blur-sm sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-transparent text-xl">
            Add Bill Instance
          </DialogTitle>
          <DialogDescription>
            Create a new bill instance directly from the calendar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            
            <FormField
              control={form.control}
              name="profileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a profile" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile._id} value={profile._id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedProfileId || bills?.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedProfileId ? "Select a profile first" : "Select a bill"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bills?.map((bill) => (
                        <SelectItem key={bill._id} value={bill._id}>
                          {bill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  ? "Creating..."
                  : "Create Instance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
