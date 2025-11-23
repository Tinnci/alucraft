import { Hinge, SimulationResult, ProfileType } from './types';
import { PROFILES } from '@/config/profiles';

// 修正后的铰链数据库 (基于图4, 图5, 图13)
const HINGE_LIBRARY: Hinge[] = [
    // --- C80 系列 ---
    {
        id: 'c80-straight',
        series: 'C80',
        arm: 'Straight',
        name: 'C80 直臂 (全盖)',
        kRange: [3, 6],
        adjustmentRange: [-7, 2], // 允许少量正向容差，虽然图纸建议主要往小调
    },
    {
        id: 'c80-medium',
        series: 'C80',
        arm: 'MediumBend',
        name: 'C80 中弯 (半盖)', // 针对遮盖 9-12mm 左右的情况
        kRange: [3, 6],
        adjustmentRange: [-7, 2],
    },
    {
        id: 'c80-big',
        series: 'C80',
        arm: 'BigBend',
        name: 'C80 大弯 (无盖/内嵌)', // 针对遮盖 0-3mm 左右的情况
        kRange: [3, 6],
        adjustmentRange: [-5, 5], // 大弯调节范围通常比较灵活
    },
    // --- Cover25 系列 ---
    {
        id: 'cover25-straight',
        series: 'Cover25',
        arm: 'Straight',
        name: 'Q80 盖25 (特大盖)',
        kRange: [3, 9],
        adjustmentRange: [-7, 0],
    },
];

// 修正后的基准遮盖计算公式 (查表逻辑的公式化)
const getBaseOverlay = (hingeId: string, k: number): number => {
    // 盖25: 图13显示 K=3->24mm, K=9->30mm. 公式: 21 + K
    if (hingeId === 'cover25-straight') {
        return 21 + k;
    }

    // C80 直臂: 图13显示 K=3->18.5mm. 公式: 15.5 + K
    if (hingeId === 'c80-straight') {
        return 15.5 + k;
    }

    // C80 中弯: 图4显示 K=3->9.5mm. 公式: 6.5 + K
    if (hingeId === 'c80-medium') {
        return 6.5 + k;
    }

    // C80 大弯: 图4显示 K=3-> -0.5mm, K=6-> 2.5mm. 公式: K - 3.5
    if (hingeId === 'c80-big') {
        return k - 3.5;
    }

    return 0;
};

export function calculateHinge(
    profileType: ProfileType,
    desiredOverlay: number
): SimulationResult {
    const profile = PROFILES[profileType];
    if (!profile) return { success: false, message: 'Invalid profile type' };

    let bestMatch: SimulationResult | null = null;
    let minAdjustmentAbs = Infinity; // 用于寻找调节量最小的最优解

    for (const hinge of HINGE_LIBRARY) {
        for (let k = hinge.kRange[0]; k <= hinge.kRange[1]; k++) {
            const baseOverlay = getBaseOverlay(hinge.id, k);

            // 计算为了达到期望遮盖，需要多少调节量
            // Desired = Base + Adj  ==>  Adj = Desired - Base
            const requiredAdjustment = desiredOverlay - baseOverlay;

            // 检查调节量是否在铰链允许范围内
            if (requiredAdjustment >= hinge.adjustmentRange[0] &&
                requiredAdjustment <= hinge.adjustmentRange[1]) {

                // 找到了一个可行解！
                // 优化逻辑：我们倾向于选择调节量绝对值最小的方案（更稳）
                // 或者优先选择 C80（便宜）而不是 盖25

                // 简单优先级：如果之前没找到，或者当前方案调节量更小，就选当前的
                if (!bestMatch || Math.abs(requiredAdjustment) < minAdjustmentAbs) {
                    minAdjustmentAbs = Math.abs(requiredAdjustment);
                    bestMatch = {
                        success: true,
                        recommendedHinge: hinge,
                        kValue: k,
                        adjustment: Number(requiredAdjustment.toFixed(1)),
                        actualOverlay: desiredOverlay, // 理论上能达到
                        message: `建议使用 ${hinge.name} `,
                        details: `K = ${k} mm(基准${baseOverlay}mm) + 调节 ${requiredAdjustment > 0 ? '+' : ''}${requiredAdjustment.toFixed(1)} mm`,
                    };
                }
            }
        }
    }

    if (bestMatch) return bestMatch;

    return {
        success: false,
        message: '未找到合适的铰链方案',
        details: `无法实现 ${desiredOverlay}mm 的遮盖量(已搜索 C80全系及盖25)`,
    };
}