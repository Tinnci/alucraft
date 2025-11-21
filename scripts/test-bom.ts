import useDesignStore, { DesignState } from '../src/store/useDesignStore';

console.log('Running BOM generation test...');

const store = useDesignStore;

// Set some values for the design
store.setState({ width: 800, height: 800, depth: 400, overlay: 14, profileType: '2020', connectorType: 'angle' } as unknown as DesignState);

const bom = store.getState().getBOM();
console.log('BOM:', JSON.stringify(bom, null, 2));
