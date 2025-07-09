import { AlertTriangle, CheckCircle, Clock, DollarSign, Receipt } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BillInstance } from "@/convex/schema";

interface BillDashboardProps {
  instances: BillInstance[];
}

export function BillDashboard({ instances }: BillDashboardProps) {
  const currentDate = new Date();
  const currentMonth = format(currentDate, "yyyy-MM");

  // Calculate statistics
  const totalInstances = instances.length;
  const paidInstances = instances.filter(instance => instance.isPaid);
  const unpaidInstances = instances.filter(instance => !instance.isPaid);
  const overdueInstances = instances.filter(
    instance => !instance.isPaid && new Date(instance.dueDate) < currentDate
  );

  const totalAmount = instances.reduce((sum, instance) => sum + instance.amount, 0);
  const paidAmount = paidInstances.reduce((sum, instance) => sum + instance.amount, 0);
  const unpaidAmount = unpaidInstances.reduce((sum, instance) => sum + instance.amount, 0);

  // Find current month's instance
  const currentMonthInstance = instances.find(
    instance => instance.month.startsWith(currentMonth)
  );

  const stats = [
    {
      title: "Total Instances",
      value: totalInstances,
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Paid",
      value: paidInstances.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: `€${paidAmount.toFixed(2)}`,
    },
    {
      title: "Pending",
      value: unpaidInstances.length,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      subtitle: `€${unpaidAmount.toFixed(2)}`,
    },
    {
      title: "Overdue",
      value: overdueInstances.length,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  if (totalInstances === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Total Amount Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Financial Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">€{totalAmount.toFixed(2)}</p>
            </div>
            <div className="flex space-x-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="font-semibold text-green-600">€{paidAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="font-semibold text-red-600">€{unpaidAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Month Instance */}
      {currentMonthInstance && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">€{currentMonthInstance.amount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Due: {format(currentMonthInstance.dueDate, "MMM dd, yyyy")}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  currentMonthInstance.isPaid
                    ? "border-green-200 bg-green-50 text-green-700"
                    : new Date(currentMonthInstance.dueDate) < currentDate
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {currentMonthInstance.isPaid
                  ? "Paid"
                  : new Date(currentMonthInstance.dueDate) < currentDate
                  ? "Overdue"
                  : "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
