import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore } from './useDesignStore';
import { ContainerNode, LayoutBay, LayoutDivider } from '@/core/types';
import { PROFILES } from '@/config/profiles';
import { getDoorStateKey } from '@/core/utils';

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
            profileType: '2020',
            doorStates: {},
            isDoorOpen: false
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
        const bay = newState.layout.find(n => n.id === bayId);
        expect(bay).toBeDefined();
        if (!bay || bay.type !== 'item' || bay.contentType !== 'generic_bay') throw new Error('Bay not found or invalid type');

        expect((bay as LayoutBay).config.width).toBe(newBayWidth);

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

    it('splitItem should wrap the bay in a horizontal container and add a new door state', () => {
        const initialBay = useDesignStore.getState().layout[0] as LayoutBay;
        const originalWidth = initialBay.config.width as number;
        const profileSize = PROFILES[useDesignStore.getState().profileType].size;
        useDesignStore.getState().splitItem('bay-initial', 'horizontal');

        const stateAfterSplit = useDesignStore.getState();
        expect(stateAfterSplit.layout.length).toBe(1);

        const container = stateAfterSplit.layout[0] as ContainerNode;
        expect(container.type).toBe('container');
        expect(container.orientation).toBe('horizontal');
        expect(container.children.length).toBe(3);

        const [first, divider, second] = container.children;
        const expectedFirstWidth = Math.floor((originalWidth - profileSize) / 2);
        const expectedSecondWidth = originalWidth - profileSize - expectedFirstWidth;

        expect(first.type).toBe('item');
        expect(first.id).toBe('bay-initial');
        expect((first as LayoutBay).config.width).toBe(expectedFirstWidth);

        expect(divider.type).toBe('divider');
        expect((divider as LayoutDivider).thickness).toBe(profileSize);

        expect(second.type).toBe('item');
        expect(second.id).not.toBe('bay-initial');
        expect((second as LayoutBay).config.width).toBe(expectedSecondWidth);

        const hingeSide = (second as LayoutBay).config.door?.hingeSide ?? 'left';
        const doorKey = getDoorStateKey(second.id, hingeSide);
        expect(stateAfterSplit.doorStates[doorKey]).toBe(stateAfterSplit.isDoorOpen);
        expect(Object.keys(stateAfterSplit.doorStates)).toContain(doorKey);
    });

    it('splitItem should support vertical splits and nested containers', () => {
        useDesignStore.getState().splitItem('bay-initial', 'vertical');
        let state = useDesignStore.getState();

        const rootContainer = state.layout[0] as ContainerNode;
        expect(rootContainer.type).toBe('container');
        expect(rootContainer.orientation).toBe('vertical');
        expect(rootContainer.children.length).toBe(3);

        const newBay = rootContainer.children[2];
        expect(newBay.type).toBe('item');

        useDesignStore.getState().splitItem(newBay.id, 'horizontal');
        state = useDesignStore.getState();

        const updatedRoot = state.layout[0] as ContainerNode;
        const nestedNode = updatedRoot.children[2];
        expect(nestedNode.type).toBe('container');
        expect((nestedNode as ContainerNode).orientation).toBe('horizontal');
        expect(((nestedNode as ContainerNode).children.filter(c => c.type === 'item')).length).toBe(2);

        // Each split should register a new door entry for the freshest bay
        expect(Object.keys(state.doorStates).length).toBe(2);
    });
});
