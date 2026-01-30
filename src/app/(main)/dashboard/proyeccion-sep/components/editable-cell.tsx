"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface EditableCellProps {
    value: number;
    onSave: (newValue: number) => void;
    type?: "currency" | "number";
}

export function EditableCell({ value, onSave, type = "currency" }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const handleStartEditing = () => {
        setIsEditing(true);
        // When starting to edit, show the number as simple string, or empty if 0?
        // Showing the raw number is safer for editing.
        setInputValue(value.toString());
    };

    const handleSave = () => {
        setIsEditing(false);
        // CLP Parsing:
        // 1. Remove thousands separators (.) and currency symbols
        // 2. Replace decimal separator (,) with (.) for JS parsing (if any)
        // 3. Round to integer (no decimals)

        let clean = inputValue.replace(/[$\s.]/g, "").replace(",", ".");

        let num = parseFloat(clean);
        if (isNaN(num)) num = 0;

        // Force integer
        num = Math.round(num);

        if (num !== value) {
            onSave(num);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        }
    };

    if (isEditing) {
        return (
            <Input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-7 text-xs px-2 w-full"
                placeholder="0"
            />
        );
    }

    return (
        <div
            onClick={handleStartEditing}
            className="cursor-pointer hover:bg-muted p-1 text-xs rounded truncate transition-colors"
            title="Click to edit"
        >
            {type === "currency"
                ? formatCurrency(value, { locale: "es-CL", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 })
                : value
            }
        </div>
    );
}
