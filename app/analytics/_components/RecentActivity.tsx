"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

function RecentActivity() {
  // Get recent bill instances
  const currentMonth = format(new Date(), 'yyyy-MM');
  const billInstancesResult = useQuery(api.billInstances.getBillInstancesByMonth, {
    month: currentMonth
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + "€";
  };

  if (!billInstancesResult) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!billInstancesResult.success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">{billInstancesResult.error}</p>
        </CardContent>
      </Card>
    );
  }

  const billInstances = billInstancesResult.data || [];
  const today = new Date();
  const weekFromNow = addDays(today, 7);

  // Filter for upcoming bills (due within next 7 days and unpaid)
  const upcomingBills = billInstances
    .filter(bill => {
      if (bill.isPaid) return false;

      try {
        // Handle both ISO string and regular date string formats
        const dueDate = bill.dueDate.includes('T') ? parseISO(bill.dueDate) : new Date(bill.dueDate);
        if (isNaN(dueDate.getTime())) return false; // Invalid date

        return isAfter(dueDate, today) && isBefore(dueDate, weekFromNow);
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const dateA = a.dueDate.includes('T') ? parseISO(a.dueDate) : new Date(a.dueDate);
        const dateB = b.dueDate.includes('T') ? parseISO(b.dueDate) : new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });

  // Filter for overdue bills
  const overdueBills = billInstances
    .filter(bill => {
      if (bill.isPaid) return false;

      try {
        // Handle both ISO string and regular date string formats
        const dueDate = bill.dueDate.includes('T') ? parseISO(bill.dueDate) : new Date(bill.dueDate);
        if (isNaN(dueDate.getTime())) return false; // Invalid date

        return isBefore(dueDate, today);
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const dateA = a.dueDate.includes('T') ? parseISO(a.dueDate) : new Date(a.dueDate);
        const dateB = b.dueDate.includes('T') ? parseISO(b.dueDate) : new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });

  // Recent payments (paid bills)
  const recentPayments = billInstances
    .filter(bill => bill.isPaid)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {(overdueBills.length > 0 || upcomingBills.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerts & Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueBills.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Overdue Bills ({overdueBills.length})</h4>
                <div className="space-y-2">
                  {overdueBills.slice(0, 3).map((bill) => (
                    <div key={bill._id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                      <div>
                        <p className="font-medium">{bill.billName}</p>
                        <p className="text-sm text-muted-foreground">{bill.profileName}</p>
                        <p className="text-xs text-red-600">
                          Due: {(() => {
                            try {
                              const dueDate = bill.dueDate.includes('T') ? parseISO(bill.dueDate) : new Date(bill.dueDate);
                              return format(dueDate, 'MMM dd, yyyy');
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(bill.amount)}</p>
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      </div>
                    </div>
                  ))}
                  {overdueBills.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{overdueBills.length - 3} more overdue bills
                    </p>
                  )}
                </div>
              </div>
            )}

            {upcomingBills.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">Due This Week ({upcomingBills.length})</h4>
                <div className="space-y-2">
                  {upcomingBills.slice(0, 3).map((bill) => (
                    <div key={bill._id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <div>
                        <p className="font-medium">{bill.billName}</p>
                        <p className="text-sm text-muted-foreground">{bill.profileName}</p>
                        <p className="text-xs text-orange-600">
                          Due: {(() => {
                            try {
                              const dueDate = bill.dueDate.includes('T') ? parseISO(bill.dueDate) : new Date(bill.dueDate);
                              return format(dueDate, 'MMM dd, yyyy');
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(bill.amount)}</p>
                        <Badge variant="secondary" className="text-xs">Due Soon</Badge>
                      </div>
                    </div>
                  ))}
                  {upcomingBills.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{upcomingBills.length - 3} more bills due this week
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Recently paid bills this month
          </p>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recent payments this month
            </p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((bill) => (
                <div key={bill._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{bill.billName}</p>
                      <p className="text-sm text-muted-foreground">{bill.profileName}</p>
                      {bill.description && (
                        <p className="text-xs text-muted-foreground">{bill.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(bill.amount)}</p>
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-lg font-bold text-red-600">{overdueBills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Due This Week</p>
                <p className="text-lg font-bold text-orange-600">{upcomingBills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Paid This Month</p>
                <p className="text-lg font-bold text-green-600">{recentPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RecentActivity;
