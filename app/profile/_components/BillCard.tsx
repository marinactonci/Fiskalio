import { Bill } from "@/convex/schema";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";

interface BillCardProps {
  bill: Bill;
}

function BillCard({ bill }: BillCardProps) {
  return (
    <Link href={`/bill/${bill._id}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card backdrop-blur-sm border-muted/20 hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {bill.name}
            </CardTitle>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-green-500/15 to-green-600/15 dark:from-green-400/25 dark:to-green-500/25 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
            >
              {bill.billInstanceCount} instances
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {bill.eBill?.link && (
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 truncate">
              🌐 {bill.eBill.link}
            </p>
          )}
          {bill.eBill?.username && (
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2">
              👤 {bill.eBill.username}
            </p>
          )}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground dark:text-slate-400">
              Created {format(bill._creationTime, "PPP")}
            </div>
            <div className="text-xs text-primary font-medium group-hover:text-primary/80 transition-colors">
              View Details →
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default BillCard;
