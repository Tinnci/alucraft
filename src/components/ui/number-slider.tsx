import React, { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    unit?: string;
    className?: string;
}

export function NumberSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    unit = '',
    className,
}: NumberSliderProps) {
    const [localValue, setLocalValue] = useState<string | number>(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleSliderChange = (vals: number[]) => {
        const newValue = vals[0];
        setLocalValue(newValue);
        onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);

        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    };

    const handleBlur = () => {
        const parsed = parseFloat(localValue.toString());
        if (isNaN(parsed)) {
            setLocalValue(value); // Revert if invalid
        } else {
            // Clamp? Maybe not, let user input what they want, but slider might be limited.
            // Usually good to clamp to min/max if strict, but sometimes users want to go outside.
            // For now, let's just ensure it's a number.
            let final = parsed;
            if (final < min) final = min;
            if (final > max) final = max;
            setLocalValue(final);
            onChange(final);
        }
    }

    return (
        <div className={cn("space-y-3 py-1", className)}>
            <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1 w-24">
                    <Input
                        type="number"
                        value={localValue}
                        min={min}
                        max={max}
                        step={step}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="h-6 px-1.5 py-0 text-right text-xs font-mono bg-muted/50 border-white/10 focus-visible:ring-blue-500/50"
                    />
                    {unit && <span className="text-xs text-muted-foreground w-4">{unit}</span>}
                </div>
            </div>
            <Slider
                value={[typeof localValue === 'number' ? localValue : parseFloat(localValue) || min]}
                min={min}
                max={max}
                step={step}
                onValueChange={handleSliderChange}
                className="[&_.bg-primary]:bg-blue-500"
            />
        </div>
    );
}
