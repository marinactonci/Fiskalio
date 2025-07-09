"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { BillInstance } from "@/convex/schema";
import { QuickEditInstanceDialog } from "./QuickEditBillInstanceDialog";

interface CalendarGridProps {
  currentDate: Date;
  billInstances: (BillInstance & { billName: string })[];
}

export function CalendarGrid({
  currentDate,
  billInstances,
}: CalendarGridProps) {
  const [selectedInstance, setSelectedInstance] = useState<
    (BillInstance & { billName: string }) | null
  >(null);
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getInstancesForDay = (day: Date) => {
    return billInstances.filter((instance) =>
      isSameDay(new Date(instance.dueDate), day),
    );
  };

  const handleInstanceClick = (
    instance: BillInstance & { billName: string },
  ) => {
    setSelectedInstance(instance);
    setShowQuickEdit(true);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <>
      <Card className="bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {/* Header row with day names */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const dayInstances = getInstancesForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] p-2 border rounded-lg transition-colors ${
                    isCurrentMonth
                      ? "bg-background/50 border-border/50"
                      : "bg-muted/20 border-muted/30"
                  } ${isToday ? "ring-2 ring-primary/50" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    } ${isToday ? "text-primary font-bold" : ""}`}
                  >
                    {format(day, "d")}
                  </div>

                  <div className="space-y-1">
                    {dayInstances.map((instance) => {
                      const isOverdue =
                        !instance.isPaid &&
                        new Date(instance.dueDate) < new Date();

                      return (
                        <div
                          key={instance._id}
                          onClick={() => handleInstanceClick(instance)}
                          className={`p-1 rounded text-xs cursor-pointer transition-all hover:scale-105 hover:shadow-sm ${
                            instance.isPaid
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : isOverdue
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          <div className="font-medium truncate">
                            {instance.description}
                          </div>
                          <div className="flex items-center justify-between">
                            <span>${instance.amount.toFixed(0)}</span>
                            {instance.isPaid && <span>✓</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedInstance && (
        <QuickEditInstanceDialog
          open={showQuickEdit}
          onOpenChange={setShowQuickEdit}
          billInstance={selectedInstance}
        />
      )}
    </>
  );
}
