'use client';

import { useMutation } from 'convex/react';
import { Palette } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/convex/_generated/api';
import type { Profile } from '@/convex/schema';

interface ColorPickerProps {
  profile: Profile;
}

const colors = [
  { value: "#3b82f6", name: "Blue" },
  { value: "#10b981", name: "Green" },
  { value: "#f59e0b", name: "Orange" },
  { value: "#ef4444", name: "Red" },
  { value: "#8b5cf6", name: "Purple" },
  { value: "#06b6d4", name: "Cyan" },
  { value: "#84cc16", name: "Lime" },
  { value: "#f97316", name: "Amber" },
  { value: "#ec4899", name: "Pink" },
  { value: "#6366f1", name: "Indigo" },
];

function ColorPicker({ profile }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const updateProfileColor = useMutation(api.profiles.updateProfileColor);

  const handleColorChange = async (color: string) => {
    try {
      const result = await updateProfileColor({
        id: profile._id,
        color,
      });

      if (result.success) {
        toast.success('Profile color updated!');
        setOpen(false);
      } else {
        toast.error(result.error || 'Failed to update color.');
      }
    } catch {
      toast.error('Failed to update color. Please try again.');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 rounded-full border-2 border-gray-300 hover:scale-110 transition-all"
          style={{ backgroundColor: profile.color || '#3b82f6' }}
          title="Change profile color"
        >
          <Palette className="w-4 h-4 text-white opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                profile.color === color.value
                  ? "border-gray-900 ring-2 ring-gray-900/20"
                  : "border-gray-300"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ColorPicker;
