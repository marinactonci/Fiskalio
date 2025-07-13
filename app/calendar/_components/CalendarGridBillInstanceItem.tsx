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
        className="sm:hidden w-4 h-4 rounded-full cursor-pointer transition-all hover:scale-110 border flex items-center justify-center"
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
        className="hidden sm:block p-1 rounded text-xs cursor-pointer transition-all hover:scale-105 hover:shadow-sm border-l-4"
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
        <div className="font-medium truncate">{instance.description}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs">{instance.billName}</span>
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
      </div>
    </>
  );
}

export default CalendarGridBillInstanceItem;
