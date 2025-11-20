import { calculateHinge } from '../src/core/hinge-rules';

console.log('Starting Hinge Logic Verification...');

const testCases = [
    {
        name: 'Case 1: 14mm Overlay (Expect C80)',
        profile: '2020' as const,
        overlay: 14,
        expectedSeries: 'C80',
        expectedSuccess: true,
    },
    {
        name: 'Case 2: 30mm Overlay (Expect Cover25)',
        profile: '2020' as const,
        overlay: 30,
        expectedSeries: 'Cover25',
        expectedSuccess: true,
    },
    {
        name: 'Case 3: 2mm Overlay (Expect C80 Big Bend)',
        profile: '2020' as const,
        overlay: 2,
        expectedSeries: 'C80',
        expectedSuccess: true,
    }
];

testCases.forEach(test => {
    console.log(`\nRunning ${test.name}...`);
    const result = calculateHinge(test.profile, test.overlay);

    if (result.success !== test.expectedSuccess) {
        console.error(`FAILED: Expected success=${test.expectedSuccess}, got ${result.success}`);
        console.error(result.message);
        return;
    }

    if (result.success && test.expectedSeries) {
        if (result.recommendedHinge?.series !== test.expectedSeries) {
            console.error(`FAILED: Expected series ${test.expectedSeries}, got ${result.recommendedHinge?.series}`);
            return;
        }
    }

    console.log('PASSED');
    if (result.success) {
        console.log(`  Result: ${result.message}`);
        console.log(`  Details: ${result.details}`);
    } else {
        console.log(`  Message: ${result.message}`);
    }
});
