import { BillInstance } from "@/convex/schema";
import React from "react";

interface CalendarGridBillInstanceItemProps {
  instance: BillInstance & {
    billName: string;
    profileName: string;
    profileColor: string;
    profileId: string;
  };
  onInstanceSelect: (
    instance: BillInstance & {
      billName: string;
      profileName: string;
      profileColor: string;
      profileId: string;
    },
  ) => void;
}

function CalendarGridBillInstanceItem({
  instance,
  onInstanceSelect,
}: CalendarGridBillInstanceItemProps) {
  const isOverdue = !instance.isPaid && new Date(instance.dueDate) < new Date();

  const handleInstanceClick = (
    instance: BillInstance & {
      billName: string;
      profileName: string;
      profileColor: string;
      profileId: string;
    },
  ) => {
    onInstanceSelect(instance);
  };

  return (
    <>
      {/* Mobile view - compact circles */}
      <div
        className="sm:hidden w-4 h-4 min-w-0 max-w-full rounded-full cursor-pointer transition-all hover:scale-110 border flex items-center justify-center"
        onClick={() => handleInstanceClick(instance)}
        style={{
          backgroundColor: instance.profileColor,
          borderColor: instance.isPaid
            ? "#22c55e"
            : isOverdue
              ? "#ef4444"
              : "#eab308",
          borderWidth: "2px",
        }}
        title={`${instance.description} - $${instance.amount.toFixed(0)} ${instance.isPaid ? "(Paid)" : isOverdue ? "(Overdue)" : "(Pending)"}`}
      >
        {instance.isPaid && (
          <span className="text-white text-[8px] font-bold">✓</span>
        )}
      </div>

      {/* Desktop view - full cards */}
      <div
        className="hidden sm:block p-1 rounded text-xs cursor-pointer transition-all hover:scale-105 hover:shadow-sm border-l-4 max-w-full min-w-0"
        onClick={() => handleInstanceClick(instance)}
        style={{
          borderLeftColor: instance.profileColor,
          backgroundColor: instance.isPaid
            ? "#f0fdf4"
            : isOverdue
              ? "#fef2f2"
              : "#fefce8",
          color: instance.isPaid
            ? "#166534"
            : isOverdue
              ? "#991b1b"
              : "#854d0e",
        }}
      >
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0 max-w-full truncate">
            <span className="text-xs truncate">{instance.billName}</span>
            <span>${instance.amount.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1">
            {instance.isPaid && <span>✓</span>}
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: instance.profileColor }}
              title={instance.profileName}
            />
          </div>
        </div>

        {/* This line is key */}
        <div className="font-medium truncate max-w-full min-w-0">
          {instance.description}
        </div>
      </div>
    </>
  );
}

export default CalendarGridBillInstanceItem;
