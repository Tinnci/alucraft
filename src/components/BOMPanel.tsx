'use client';

import React from 'react';
import useDesignStore, { BOMItem, DesignState } from '@/store/useDesignStore';
import styles from '../app/page.module.css';

export function BOMPanel() {
  const getBOM = useDesignStore((state: DesignState) => state.getBOM);
  const bom: BOMItem[] = getBOM();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(bom, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-bom.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = bom.map(i => [i.name, i.qty, i.lengthMm || '', i.note || '']);
    const header = ['name', 'qty', 'length_mm', 'note'];
    const csv = [header, ...rows].map(r => r.map(c => JSON.stringify(c)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-bom.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.card} style={{ marginTop: '1rem' }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>Bill of Materials (BOM)</h3>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 1fr) auto',
        gap: '1rem',
        alignItems: 'start'
      }}>
        <div style={{ fontSize: '0.9rem', minWidth: 0 }}>
          {bom.map((i: BOMItem, idx: number) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              padding: '0.5rem 0', 
              borderBottom: '1px dashed rgba(0,0,0,0.1)',
              gap: '1rem'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{i.name}</div>
                {i.lengthMm ? <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>Length: {i.lengthMm} mm</div> : null}
                {i.note ? <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>{i.note}</div> : null}
              </div>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minWidth: '2rem',
                height: '1.5rem',
                backgroundColor: '#e5f8ff',
                borderRadius: '0.25rem',
                fontWeight: 'bold',
                color: '#0369a1',
                fontSize: '0.95rem'
              }}>
                {i.qty}
              </div>
            </div>
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem',
          minWidth: '120px'
        }}>
          <button className={styles.button} onClick={exportCsv} style={{ background: '#10b981', fontSize: '0.85rem', padding: '0.5rem 1rem' }} title="Download as CSV for spreadsheet software">
            📥 CSV
          </button>
          <button className={styles.button} onClick={exportJson} style={{ background: '#06b6d4', fontSize: '0.85rem', padding: '0.5rem 1rem' }} title="Download as JSON for data interchange">
            📥 JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export default BOMPanel;
