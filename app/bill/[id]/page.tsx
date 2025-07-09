"use client";

import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreateBillInstanceDialog } from "@/app/bill/_components/CreateBillInstanceDialog";
import { EditBillDialog } from "@/app/bill/_components/EditBillDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BillInstanceCard } from "../_components/BillInstanceCard";
import { BillDashboard } from "../_components/BillDashboard";
import DeleteBillAlertDialog from "../_components/DeleteBillAlertDialog";

export default function Bill() {
  const { id } = useParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Queries and mutations
  const bill = useQuery(api.bills.getBill, { id: id as Id<"bills"> });
  const instances = useQuery(api.billInstances.getBillInstancesForBill, {
    billId: id as Id<"bills">,
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch {
      toast.error(`Failed to copy ${type.toLowerCase()}`);
    }
  };

  if (!(bill && instances)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <Button
          className="hover:bg-muted/50"
          onClick={() => router.push(`/profile/${bill.profileId}`)}
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
        {bill.eBill && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ebill-link" className="text-sm font-medium">
                  Website
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="ebill-link"
                    value={bill.eBill?.link || ""}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(bill.eBill?.link, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(bill.eBill?.link || "", "Link")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="ebill-username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="ebill-username"
                    value={bill.eBill?.username || ""}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(bill.eBill?.username || "", "Username")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="ebill-password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="ebill-password"
                    type={showPassword ? "text" : "password"}
                    value={bill.eBill?.password || ""}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(bill.eBill?.password || "", "Password")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
