
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { add, format, isToday, isSameDay, sub } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeekNavigatorProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  weekDates: Date[];
}

export default function WeekNavigator({ currentDate, setCurrentDate, weekDates }: WeekNavigatorProps) {

  const handlePrevWeek = () => {
    setCurrentDate(sub(currentDate, { weeks: 1 }));
  };

  const handleNextWeek = () => {
    setCurrentDate(add(currentDate, { weeks: 1 }));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  }

  return (
    <Card className="p-2 shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
           <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
           <Button variant="outline" onClick={handleToday}>
            Hoy
          </Button>
        </div>
        <div className="hidden sm:block">
            <h2 className="text-lg font-semibold capitalize">
              {format(weekDates[0], 'MMMM yyyy', { locale: es })}
            </h2>
        </div>
         <div className="grid grid-cols-7 gap-1 flex-1 sm:flex-none">
            {weekDates.map(date => (
                <Button 
                    key={date.toString()}
                    variant={isSameDay(currentDate, date) ? "default" : "outline"}
                    onClick={() => setCurrentDate(date)}
                    className={cn(
                        "flex flex-col h-auto p-2",
                        isToday(date) && "border-primary"
                    )}
                >
                    <span className="text-xs capitalize">{format(date, 'eee', { locale: es })}</span>
                    <span className="text-lg font-bold">{format(date, 'd')}</span>
                </Button>
            ))}
        </div>
      </div>
    </Card>
  );
}
