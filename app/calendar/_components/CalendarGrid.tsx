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
import CalendarGridBillInstanceItem from "./CalendarGridBillInstanceItem";

interface CalendarGridProps {
  currentDate: Date;
  billInstances: (BillInstance & {
    billName: string;
    profileName: string;
    profileColor: string;
    profileId: string;
  })[];
}

export function CalendarGrid({
  currentDate,
  billInstances,
}: CalendarGridProps) {
  const [selectedInstance, setSelectedInstance] = useState<
    | (BillInstance & {
        billName: string;
        profileName: string;
        profileColor: string;
        profileId: string;
      })
    | null
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

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <>
      <Card className="bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm">
        <CardContent className="p-2 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Header row with day names */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-1 sm:p-2 text-center font-medium text-muted-foreground text-xs sm:text-sm"
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
                  className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border rounded-lg transition-colors ${
                    isCurrentMonth
                      ? "bg-background/50 border-border/50"
                      : "bg-muted/20 border-muted/30"
                  } ${isToday ? "ring-2 ring-primary/50" : ""}`}
                >
                  <div
                    className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                      isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    } ${isToday ? "text-primary font-bold" : ""}`}
                  >
                    {format(day, "d")}
                  </div>

                  <div className="flex flex-wrap gap-0.5 sm:flex-col sm:space-y-1">
                    {dayInstances.map((instance) => {
                      return (
                        <CalendarGridBillInstanceItem
                          key={instance._id}
                          instance={instance}
                          onInstanceSelect={(selectedInstance) => {
                            setSelectedInstance(selectedInstance);
                            setShowQuickEdit(true);
                          }}
                        />
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
