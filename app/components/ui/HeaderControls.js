"use client";
import Pager from "./Pager";
import PageSizeSelector from "./PageSizeSelector";

export default function HeaderControls({
  page,
  pageSize,
  total,
  onChangePage,
  onChangePageSize,
  right = null,
  left = null,
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
      <div>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {total > pageSize && (
          <Pager page={page} pageSize={pageSize} total={total} onChangePage={onChangePage} compact />
        )}
        <PageSizeSelector pageSize={pageSize} total={total} onChange={(n) => { onChangePage(1); onChangePageSize(n); }} />
        {right}
      </div>
    </div>
  );
}
