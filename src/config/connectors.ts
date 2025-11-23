import { ConnectorSpec, ConnectorType } from '@/core/types';

export const CONNECTORS: Record<ConnectorType, ConnectorSpec> = {
    'angle_bracket': {
        name: 'L型角码',
        deduction: 0,
        description: '表面安装，不影响型材切割长度'
    },
    'internal_lock': {
        name: '内置锁扣',
        deduction: 0,
        description: '需要打孔，但不影响型材长度'
    },
    '3way_corner': {
        name: '三维角码',
        deduction: 20,
        description: '假设三维角码占据约20mm长（具体值根据型材规格调整）'
    }
};
