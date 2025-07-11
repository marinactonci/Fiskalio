"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, DollarSign } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { CreateBillInstanceDialog } from "@/app/bills/_components/CreateBillInstanceDialog";
import { EditBillDialog } from "@/app/bills/_components/EditBillDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isValidConvexId } from "@/lib/id-validation";
import { BillInstanceCard } from "../_components/BillInstanceCard";
import { BillDashboard } from "../_components/BillDashboard";
import DeleteBillAlertDialog from "../_components/DeleteBillAlertDialog";
import EBillCard from "../_components/EBillCard";

export default function Bill() {
  const { id } = useParams();
  const router = useRouter();

  // Check if the ID is valid before making the query
  const isValidId = typeof id === "string" && isValidConvexId(id);

  // Only make the query if the ID is valid
  const billResult = useQuery(
    api.bills.getBill,
    isValidId ? { id: id as Id<"bills"> } : "skip"
  );
  const instancesResult = useQuery(
    api.billInstances.getBillInstancesForBill,
    isValidId ? { billId: id as Id<"bills"> } : "skip"
  );

  // Handle invalid ID format
  if (!isValidId) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-4 font-semibold text-2xl">Invalid Bill ID</h2>
        <p className="text-muted-foreground mb-4">
          The bill ID in the URL is not valid. Please check the URL and try again.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!billResult || !instancesResult) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }

  if (!billResult.success) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-4 font-semibold text-2xl">Bill not found</h2>
        <p className="text-muted-foreground mb-4">{billResult.error}</p>
        <Button
          className="hover:bg-muted/50"
          onClick={() => router.push('/profiles')}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>
      </div>
    );
  }

  if (!instancesResult.success) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-4 font-semibold text-2xl">Error loading bill instances</h2>
        <p className="text-muted-foreground mb-4">{instancesResult.error}</p>
        <Button
          className="hover:bg-muted/50"
          onClick={() => router.push('/profiles')}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>
      </div>
    );
  }

  const bill = billResult.data!;
  const instances = instancesResult.data || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <Button
          className="hover:bg-muted/50"
          onClick={() => router.push(`/profiles/${bill.profileId}`)}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex-1">
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-3xl text-transparent">
            {bill.name}
          </h1>
          <p className="mt-1 text-muted-foreground">Bill Details & Instances</p>
        </div>
        <div className="flex space-x-2">
          <EditBillDialog bill={bill} />
          <DeleteBillAlertDialog bill={bill} />
        </div>
      </div>

      <BillDashboard instances={instances} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {bill.eBill && <EBillCard eBill={bill.eBill} />}

        <div className={bill.eBill ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Bill Instances</h2>
              <p className="text-muted-foreground">
                {instances.length} instance{instances.length !== 1 ? "s" : ""}{" "}
                found
              </p>
            </div>
            <CreateBillInstanceDialog billId={id as Id<"bills">} />
          </div>

          {instances.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">No bill instances yet</h3>
                  <p className="text-muted-foreground">
                    Create your first bill instance to get started.
                  </p>
                </div>
                <CreateBillInstanceDialog billId={id as Id<"bills">} />
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instances
                .sort((a, b) => {
                  // Sort by status: overdue first, then pending, then paid
                  const aOverdue = new Date(a.dueDate) < new Date();
                  const bOverdue = new Date(b.dueDate) < new Date();

                  if (aOverdue && !bOverdue) return -1;
                  if (!aOverdue && bOverdue) return 1;
                  if (!a.isPaid && b.isPaid) return -1;
                  if (a.isPaid && !b.isPaid) return 1;

                  // Then by due date
                  return (
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime()
                  );
                })
                .map((instance) => (
                  <BillInstanceCard
                    key={instance._id}
                    billInstance={instance}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
