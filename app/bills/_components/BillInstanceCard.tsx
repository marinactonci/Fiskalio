import { useMutation } from "convex/react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle,
  Clock,
  NotebookTabs,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { BillInstance } from "@/convex/schema";
import { EditBillInstanceDialog } from "./EditBillInstanceDialog";
import DeleteBillInstanceAlertDialog from "./DeleteBillInstanceAlertDialog";

interface BillInstanceCardProps {
  billInstance: BillInstance;
}

export function BillInstanceCard({ billInstance }: BillInstanceCardProps) {
  const [loading, setLoading] = useState(false);
  const togglePaidStatus = useMutation(
    api.billInstances.toggleBillInstancePaidStatus,
  );

  const isOverdue = new Date(billInstance.dueDate) < new Date();

  const handleTogglePaidStatus = async () => {
    setLoading(true);
    try {
      await togglePaidStatus({ id: billInstance._id });
      toast.success(
        billInstance.isPaid
          ? "Bill instance marked as unpaid"
          : "Bill instance marked as paid",
      );
    } catch {
      toast.error("Failed to update bill instance status");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyles = () => {
    if (billInstance.isPaid) {
      return "border-green-200 bg-green-50 text-green-700";
    }
    if (isOverdue) {
      return "border-red-200 bg-red-50 text-red-700";
    }
    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  const getStatusIcon = () => {
    if (billInstance.isPaid) {
      return <CheckCircle className="h-3 w-3" />;
    }
    if (isOverdue) {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  const getBadgeText = () => {
    if (billInstance.isPaid) {
      return "Paid";
    }
    if (isOverdue) {
      return "Overdue";
    }
    return "Pending";
  };

  const getButtonText = () => {
    if (!loading) {
      if (billInstance.isPaid) {
        return (
          <>
            <X className="h-4 w-4" />
            Mark Unpaid
          </>
        );
      }
      return (
        <>
          <Check className="h-4 w-4" />
          Mark Paid
        </>
      );
    }

    return (
      <div className="h-4 w-4 animate-spin rounded-full border-current border-b-2" />
    );
  };

  return (
    <Card className="border hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <NotebookTabs className="h-5 w-5 text-muted-foreground" />
            <span>{billInstance.amount.toFixed(2)}€</span>
          </CardTitle>
          <Badge className={getBadgeStyles()} variant={"outline"}>
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span>{getBadgeText()}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <CalendarClock className="h-4 w-4" />
            <span>Due: {format(billInstance.dueDate, "PPP")}</span>
          </div>

          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            <span>Month: {format(billInstance.month, "MMMM yyyy")}</span>
          </div>

          {billInstance.description && (
            <p className="line-clamp-2 text-muted-foreground text-sm">
              {billInstance.description}
            </p>
          )}

          <div className="flex items-center justify-between border-t pt-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <EditBillInstanceDialog billInstance={billInstance} />
              <DeleteBillInstanceAlertDialog billInstance={billInstance} />
            </div>

            <Button
              className={
                billInstance.isPaid
                  ? "hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
              disabled={loading}
              onClick={handleTogglePaidStatus}
              size="sm"
              variant={billInstance.isPaid ? "outline" : "default"}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
