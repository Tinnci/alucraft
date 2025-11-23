'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import useDesignStore from '@/store/useDesignStore';

export function DesignToaster() {
    const result = useDesignStore((s) => s.result);
    // Using ref to track the last result to avoid duplicate toasts if the object reference changes but content is same,
    // or just to handle the effect dependency correctly.

    useEffect(() => {
        if (result) {
            // Simple logic: if result exists, show it.
            // We rely on the fact that the store updates 'result' to a new object when a calculation happens.

            if (result.success) {
                toast.success(result.message, {
                    description: result.recommendedHinge ? `Recommended: ${result.recommendedHinge.name} (K=${result.kValue})` : undefined,
                    duration: 4000,
                });
            } else {
                toast.error(result.message, {
                    description: 'Please adjust your design.',
                    duration: 5000,
                });
            }
        }
    }, [result]);

    return null;
}
