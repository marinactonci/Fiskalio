import {
  FileText,
  TrendingUp,
  Calendar,
  Globe,
  BarChart3,
  Activity,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Bill } from "@/convex/schema";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ProfileDashboardProps {
  profileId: Id<"profiles">;
  bills: Bill[];
}

export function ProfileDashboard({ profileId, bills }: ProfileDashboardProps) {
  const billInstancesWithNames = useQuery(
    api.billInstances.getBillInstancesWithBillNamesByProfile,
    { profileId },
  );

  if (!billInstancesWithNames) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Profile Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted/30 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentDate = new Date();
  const currentMonth = format(currentDate, "yyyy-MM");
  const lastMonth = format(subMonths(currentDate, 1), "yyyy-MM");

  // Calculate bill statistics
  const totalBills = bills.length;
  const billsWithEBill = bills.filter((bill) => bill.eBill).length;
  const averageInstancesPerBill =
    totalBills > 0 ? billInstancesWithNames.length / totalBills : 0;

  // Calculate monthly trends
  const currentMonthInstances = billInstancesWithNames.filter((instance) =>
    instance.month.startsWith(currentMonth),
  );
  const lastMonthInstances = billInstancesWithNames.filter((instance) =>
    instance.month.startsWith(lastMonth),
  );

  const currentMonthTotal = currentMonthInstances.reduce(
    (sum, instance) => sum + instance.amount,
    0,
  );
  const lastMonthTotal = lastMonthInstances.reduce(
    (sum, instance) => sum + instance.amount,
    0,
  );
  const monthlyChange =
    lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

  // Calculate payment performance
  const totalInstances = billInstancesWithNames.length;
  const paidInstances = billInstancesWithNames.filter(
    (instance) => instance.isPaid,
  );
  const paymentRate =
    totalInstances > 0 ? (paidInstances.length / totalInstances) * 100 : 0;

  // Get most expensive bills
  const billAmounts = bills
    .map((bill) => {
      const instances = billInstancesWithNames.filter(
        (instance) => instance.billId === bill._id,
      );
      const avgAmount =
        instances.length > 0
          ? instances.reduce((sum, instance) => sum + instance.amount, 0) /
            instances.length
          : 0;
      return { bill, avgAmount, instanceCount: instances.length };
    })
    .sort((a, b) => b.avgAmount - a.avgAmount);

  if (totalBills === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Profile Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bill Management Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Bill Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Bills
                  </span>
                  <span className="font-semibold">{totalBills}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    With E-Bill
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{billsWithEBill}</span>
                    <Badge variant="outline" className="text-xs">
                      {totalBills > 0
                        ? Math.round((billsWithEBill / totalBills) * 100)
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Instances
                  </span>
                  <span className="font-semibold">
                    {averageInstancesPerBill.toFixed(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Monthly Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    This Month
                  </span>
                  <span className="font-semibold">
                    €{currentMonthTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Month
                  </span>
                  <span className="font-semibold">
                    €{lastMonthTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Change</span>
                  <Badge
                    variant="outline"
                    className={
                      monthlyChange >= 0
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-green-200 bg-green-50 text-green-700"
                    }
                  >
                    {monthlyChange >= 0 ? "+" : ""}
                    {monthlyChange.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span>Payment Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Payment Rate
                  </span>
                  <span className="font-semibold">
                    {paymentRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={paymentRate} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{paidInstances.length} paid</span>
                  <span>{totalInstances - paidInstances.length} pending</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Bills by Amount */}
      {billAmounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Top Bills by Average Amount</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billAmounts.slice(0, 5).map((item, index) => (
                <div
                  key={item.bill._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.bill.name}</span>
                        {item.bill.eBill && (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.instanceCount} instance
                        {item.instanceCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold">
                    €{item.avgAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions for Current Month */}
      {currentMonthInstances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>This Month&apos;s Action Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentMonthInstances
                .filter((instance) => !instance.isPaid)
                .sort(
                  (a, b) =>
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime(),
                )
                .slice(0, 3)
                .map((instance) => {
                  const isOverdue = new Date(instance.dueDate) < currentDate;
                  return (
                    <div
                      key={instance._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{instance.billName}</span>
                        <p className="text-sm text-muted-foreground">
                          Due {format(instance.dueDate, "MMM dd")} • €
                          {instance.amount.toFixed(2)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          isOverdue
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {isOverdue ? "Overdue" : "Pending"}
                      </Badge>
                    </div>
                  );
                })}

              {currentMonthInstances.filter((instance) => !instance.isPaid)
                .length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +
                  {currentMonthInstances.filter((instance) => !instance.isPaid)
                    .length - 3}{" "}
                  more pending bills this month
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
