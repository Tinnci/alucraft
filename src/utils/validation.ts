import { z } from 'zod';

// Helper schemas
const ShelfSchema = z.object({
    id: z.string(),
    y: z.number(),
});

const DrawerSchema = z.object({
    id: z.string(),
    y: z.number(),
    height: z.number(),
});

const DoorConfigSchema = z.object({
    enabled: z.boolean(),
    type: z.enum(['single', 'double']),
    hingeSide: z.enum(['left', 'right']),
});

// Config Schemas
const BayConfigSchema = z.object({
    width: z.union([z.number(), z.literal('auto')]).optional(),
    shelves: z.array(ShelfSchema).optional(),
    drawers: z.array(DrawerSchema).optional(),
    door: DoorConfigSchema.optional(),
});

const BedConfigSchema = z.object({
    mattressSize: z.enum(['single', 'double', 'queen', 'king']),
    slatsEnabled: z.boolean().optional(),
    headboardHeight: z.number().optional(),
});

const CupboardConfigSchema = z.object({
    cornerType: z.enum(['L-shape', 'blind', 'corner']).optional(),
    lazySusan: z.boolean().optional(),
});

// Node Schemas
const DividerNodeSchema = z.object({
    id: z.string(),
    type: z.literal('divider'),
    thickness: z.number(),
    size: z.union([z.number(), z.literal('auto')]).optional(),
});

const BayNodeSchema = z.object({
    id: z.string(),
    type: z.literal('item'),
    contentType: z.literal('generic_bay'),
    config: BayConfigSchema,
    size: z.union([z.number(), z.literal('auto')]).optional(),
});

const BedNodeSchema = z.object({
    id: z.string(),
    type: z.literal('item'),
    contentType: z.literal('bed_frame'),
    config: BedConfigSchema,
    size: z.union([z.number(), z.literal('auto')]).optional(),
});

const CupboardNodeSchema = z.object({
    id: z.string(),
    type: z.literal('item'),
    contentType: z.literal('corner_cupboard'),
    config: CupboardConfigSchema,
    size: z.union([z.number(), z.literal('auto')]).optional(),
});

const EmptyNodeSchema = z.object({
    id: z.string(),
    type: z.literal('item'),
    contentType: z.literal('empty'),
    config: z.object({}).optional(),
    size: z.union([z.number(), z.literal('auto')]).optional(),
});

const WardrobeNodeSchema = z.object({
    id: z.string(),
    type: z.literal('item'),
    contentType: z.literal('wardrobe_section'),
    config: BayConfigSchema,
    size: z.union([z.number(), z.literal('auto')]).optional(),
});

// Recursive Container Schema
const LayoutNodeSchema: z.ZodType<unknown> = z.lazy(() =>
    z.union([
        DividerNodeSchema,
        BayNodeSchema,
        BedNodeSchema,
        CupboardNodeSchema,
        EmptyNodeSchema,
        WardrobeNodeSchema,
        ContainerNodeSchema,
    ])
);

const ContainerNodeSchema = z.object({
    id: z.string(),
    type: z.literal('container'),
    orientation: z.enum(['horizontal', 'vertical']),
    children: z.array(LayoutNodeSchema),
    size: z.union([z.number(), z.literal('auto')]).optional(),
});

export const DesignSchema = z.array(LayoutNodeSchema);

export function validateDesignJSON(json: unknown): { success: boolean; error?: string; data?: unknown } {
    const result = DesignSchema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, error: result.error.message };
    }
}
