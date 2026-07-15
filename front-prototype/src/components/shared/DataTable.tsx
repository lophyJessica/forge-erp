import React from 'react';

interface DataTableProps {
  children: React.ReactNode;
  minWidth?: string;
  className?: string;
}

export default function DataTable({ children, minWidth = '980px', className = '' }: DataTableProps) {
  const childNodes = React.Children.toArray(children);
  const containsOnlyTableSections = childNodes.length > 0 && childNodes.every(node => {
    if (!React.isValidElement(node)) return false;
    return ['caption', 'colgroup', 'thead', 'tbody', 'tfoot'].includes(String(node.type));
  });

  return (
    <div
      className={`forge-table-shell overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
      style={{ '--forge-table-min-width': minWidth } as React.CSSProperties}
    >
      <div className="overflow-x-auto">
        {containsOnlyTableSections ? (
          <table className="forge-data-table w-full border-collapse text-left" style={{ minWidth }}>
            {children}
          </table>
        ) : children}
      </div>
    </div>
  );
}
