import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore } from './useDesignStore';
import { ItemNode, LayoutBay } from '@/core/types';

// Mock nanoid to have predictable IDs if needed, or just rely on structure
// For integration tests, we care more about the state changes than specific IDs usually.

describe('useDesignStore Actions', () => {
    // Reset store before each test
    beforeEach(() => {
        useDesignStore.setState({
            layout: [
                { type: 'item', contentType: 'generic_bay', id: 'bay-initial', config: { width: 560, shelves: [], drawers: [], door: { enabled: true, type: 'single', hingeSide: 'left' } } } as LayoutBay
            ],
            width: 600,
            profileType: '2020'
        });
        useDesignStore.temporal.getState().clear();
    });

    it('addBay should append a new bay and divider', () => {
        const initialCount = useDesignStore.getState().layout.length;
        const initialWidth = useDesignStore.getState().width;

        useDesignStore.getState().addBay();

        const newState = useDesignStore.getState();
        // Should add 1 divider + 1 bay = 2 nodes
        expect(newState.layout.length).toBe(initialCount + 2);

        // Check structure: [Bay, Divider, Bay]
        expect(newState.layout[0].type).toBe('item');
        expect(newState.layout[1].type).toBe('divider');
        expect(newState.layout[2].type).toBe('item');

        // Check width update (Initial + Divider(20) + NewBay(400))
        expect(newState.width).toBe(initialWidth + 20 + 400);
    });

    it('removeBay should remove the specified bay and adjacent divider', () => {
        // Setup: Add a bay first so we have 2 bays
        useDesignStore.getState().addBay();
        const stateAfterAdd = useDesignStore.getState();
        const bayToRemoveId = stateAfterAdd.layout[2].id; // The second bay
        const widthAfterAdd = stateAfterAdd.width;

        useDesignStore.getState().removeBay(bayToRemoveId);

        const finalState = useDesignStore.getState();
        // Should remove 1 bay + 1 divider = 2 nodes
        expect(finalState.layout.length).toBe(stateAfterAdd.layout.length - 2);

        // Should be back to 1 bay
        expect(finalState.layout.length).toBe(1);
        expect(finalState.layout[0].id).toBe('bay-initial');

        // Check width reduction (Total - Divider(20) - Bay(400))
        expect(finalState.width).toBe(widthAfterAdd - 20 - 400);
    });

    it('resizeBay should update bay width and total width', () => {
        const bayId = 'bay-initial';
        const newBayWidth = 600;

        useDesignStore.getState().resizeBay(bayId, newBayWidth);

        const newState = useDesignStore.getState();
        const bay = newState.layout.find(n => n.id === bayId) as ItemNode | undefined;

        expect(bay.config.width).toBe(newBayWidth);

        // Initial Bay Width was 560. New is 600. Delta +40.
        // Profile size (20*2 = 40) is constant in total width calculation logic?
        // Let's check the store logic:
        // width = sum(nodes) + (profileSize * 2)
        // Old: 560 + 40 = 600.
        // New: 600 + 40 = 640.
        expect(newState.width).toBe(640);
    });

    it('undo/redo should restore state', () => {
        const initialWidth = useDesignStore.getState().width;

        // Action 1: Add Bay
        useDesignStore.getState().addBay();
        const widthAfterAdd = useDesignStore.getState().width;
        expect(widthAfterAdd).not.toBe(initialWidth);

        // Undo
        useDesignStore.temporal.getState().undo();
        const stateAfterUndo = useDesignStore.getState();
        expect(stateAfterUndo.width).toBe(initialWidth);
        expect(stateAfterUndo.layout.length).toBe(1);

        // Redo
        useDesignStore.temporal.getState().redo();
        const stateAfterRedo = useDesignStore.getState();
        expect(stateAfterRedo.width).toBe(widthAfterAdd);
        expect(stateAfterRedo.layout.length).toBe(3);
    });
});
