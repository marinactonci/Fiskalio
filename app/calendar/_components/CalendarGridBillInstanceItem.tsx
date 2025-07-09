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
    <div
      key={instance._id}
      onClick={() => handleInstanceClick(instance)}
      className={`p-1 rounded text-xs cursor-pointer transition-all hover:scale-105 hover:shadow-sm border-l-4 ${
        instance.isPaid
          ? "bg-green-100 text-green-800 border-green-200"
          : isOverdue
            ? "bg-red-100 text-red-800 border-red-200"
            : "bg-yellow-100 text-yellow-800 border-yellow-200"
      }`}
      style={{
        borderLeftColor: instance.profileColor,
      }}
    >
      <div className="font-medium truncate">{instance.description}</div>
      <div className="flex items-center justify-between">
        <span>${instance.amount.toFixed(0)}</span>
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
  );
}

export default CalendarGridBillInstanceItem;
