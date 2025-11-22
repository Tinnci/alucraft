import { describe, it, expect } from 'vitest';
import { calculateBOM, BOMCalculationInput } from './bom-calculator';
import { LayoutNode } from './types';

describe('BOM Calculator', () => {
    const mockLayout: LayoutNode[] = [
        {
            id: 'bay-1',
            type: 'item',
            contentType: 'generic_bay',
            config: { width: 'auto', shelves: [], drawers: [] }
        }
    ];

    const baseInput: BOMCalculationInput = {
        width: 1000,
        height: 2000,
        depth: 600,
        profileType: '2020',
        connectorType: 'angle_bracket',
        hasLeftPanel: true,
        hasRightPanel: true,
        hasBackPanel: true,
        hasTopPanel: true,
        hasBottomPanel: true,
        layout: mockLayout,
        overlay: 14,
        panelThickness: 18,
        tolerance: 2,
        drawerStyle: 'inset'
    };

    it('should calculate correct frame profile lengths', () => {
        const bom = calculateBOM(baseInput);
        const profiles = bom.filter(i => i.category === 'profile');

        // Vertical Pillars: Should be equal to height (2000)
        const pillars = profiles.find(p => p.name.includes('Vertical (Pillar)'));
        expect(pillars).toBeDefined();
        expect(pillars?.lengthMm).toBe(2000);
        expect(pillars?.qty).toBe(4);

        // Width Beams: Width (1000) - 2*Size (40) - 2*Deduction (0 for angle bracket usually, but let's check logic)
        // 2020 size is 20. Inner width = 1000 - 40 = 960.
        // Angle bracket deduction is 0.
        const widthBeams = profiles.find(p => p.name.includes('Width Beam'));
        expect(widthBeams).toBeDefined();
    });

    it('should include panels when enabled', () => {
        const bom = calculateBOM(baseInput);
        const panels = bom.filter(i => i.category === 'panel');

        expect(panels.find(p => p.name === 'Side Panel (Left)')).toBeDefined();
        expect(panels.find(p => p.name === 'Side Panel (Right)')).toBeDefined();
        expect(panels.find(p => p.name === 'Back Panel')).toBeDefined();
        expect(panels.find(p => p.name === 'Top Panel')).toBeDefined();
        expect(panels.find(p => p.name === 'Bottom Panel')).toBeDefined();
    });

    it('should calculate door panels when enabled', () => {
        const layoutWithDoor: LayoutNode[] = [
            {
                id: 'bay-1',
                type: 'item',
                contentType: 'generic_bay',
                config: {
                    width: 'auto',
                    door: { enabled: true, type: 'single', hingeSide: 'left' }
                }
            }
        ];
        const input = { ...baseInput, layout: layoutWithDoor };
        const bom = calculateBOM(input);

        const doorPanel = bom.find(i => i.category === 'panel' && i.name.includes('Door Panel'));
        expect(doorPanel).toBeDefined();
        expect(doorPanel?.qty).toBe(1);

        const handle = bom.find(i => i.category === 'hardware' && i.name === 'Handle');
        expect(handle).toBeDefined();
        expect(handle?.qty).toBeGreaterThanOrEqual(1);
    });

    it('should include hardware for connectors', () => {
        const bom = calculateBOM(baseInput);
        const hardware = bom.filter(i => i.category === 'hardware');

        // 8 corners * 2 = 16 base connectors
        const connectors = hardware.find(h => h.name === 'L型角码'); // Assuming name from types
        expect(connectors).toBeDefined();
        expect(connectors?.qty).toBeGreaterThanOrEqual(16);
    });

    // Data-driven tests for beam length accuracy
    it.each([
        ['2020', 600, 'angle_bracket', 560], // 600 - 40 = 560
        ['3030', 600, 'angle_bracket', 540], // 600 - 60 = 540
        ['4040', 1000, 'angle_bracket', 920], // 1000 - 80 = 920
    ])('calculates correct beam length for %s with width %i', (profileType, width, connectorType, expectedLen) => {
        const input: BOMCalculationInput = {
            ...baseInput,
            width,
            profileType: profileType as any,
            connectorType: connectorType as any
        };
        const bom = calculateBOM(input);
        const widthBeams = bom.find(i => i.name.includes('Width Beam'));

        expect((widthBeams as any)?.lengthMm).toBe(expectedLen);
    });
});
