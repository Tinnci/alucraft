import { describe, it, expect } from 'vitest';
import { calculateHinge } from './hinge-rules';

describe('Hinge Logic Engine', () => {
    it('should recommend C80 for 14mm overlay on 2020 profile', () => {
        const result = calculateHinge('2020', 14);
        expect(result.success).toBe(true);
        expect(result.recommendedHinge?.series).toBe('C80');
        // C80 Straight base overlay is 15.5 + K. For 14mm, K=3 -> 18.5. 14-18.5 = -4.5.
        // C80 Medium base overlay is 6.5 + K. For 14mm, K=6 -> 12.5. 14-12.5 = 1.5.
        // The logic prefers minimum adjustment.
        // Let's check if it returns a valid K value.
        expect(result.kValue).toBeGreaterThanOrEqual(3);
        expect(result.kValue).toBeLessThanOrEqual(6);
    });

    it('should recommend C80 Medium or Big Bend for smaller overlays', () => {
        // Target 10mm overlay
        const result = calculateHinge('2020', 10);
        expect(result.success).toBe(true);
        // C80 Medium (Half Overlay): Base = 6.5 + K. If K=3, Base=9.5. Adj = 0.5. Excellent match.
        expect(result.recommendedHinge?.arm).toBe('MediumBend');
    });

    it('should recommend Cover25 for large overlays', () => {
        // Target 25mm overlay (Full Overlay +)
        const result = calculateHinge('2020', 25);
        expect(result.success).toBe(true);
        expect(result.recommendedHinge?.series).toBe('Cover25');
    });

    it('should fail gracefully for impossible overlay', () => {
        const result = calculateHinge('2020', 50); // 50mm overlay is impossible
        expect(result.success).toBe(false);
    });

    it('should handle negative overlay (inset)', () => {
        const result = calculateHinge('2020', -2);
        expect(result.success).toBe(true);
        // C80 Big Bend (Inset): Base = K - 3.5. If K=3, Base = -0.5. Adj = -1.5.
        expect(result.recommendedHinge?.arm).toBe('BigBend');
    });
});
