'use client';

import React from 'react';
import useDesignStore, { BOMItem, DesignState } from '@/store/useDesignStore';
import styles from '../app/page.module.css';

export function BOMPanel() {
  const getBOM = useDesignStore((state: DesignState) => state.getBOM);
  const bom: BOMItem[] = getBOM();

  return (
    <div className={styles.card} style={{ marginTop: '1rem' }}>
      <h3 style={{ margin: 0 }}>Bill of Materials (BOM)</h3>
      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
  {bom.map((i: BOMItem, idx: number) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '0.95rem' }}>
              <strong>{i.name}</strong>
              {i.lengthMm ? <div style={{ fontSize: '0.8rem', color: '#666' }}>{i.lengthMm} mm</div> : null}
              {i.note ? <div style={{ fontSize: '0.8rem', color: '#666' }}>{i.note}</div> : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '1rem' }}>{i.qty}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BOMPanel;
