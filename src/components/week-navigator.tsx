
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WeekNavigatorProps {
  days: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export default function WeekNavigator({ days, selectedDay, onSelectDay }: WeekNavigatorProps) {
  return (
    <Card className="p-2 shadow-md">
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {days.map(day => (
                <Button 
                    key={day}
                    variant={selectedDay === day ? "default" : "outline"}
                    onClick={() => onSelectDay(day)}
                    className="w-full"
                >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.substring(0, 3)}</span>
                </Button>
            ))}
        </div>
    </Card>
  );
}
