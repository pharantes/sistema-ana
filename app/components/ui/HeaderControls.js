"use client";
import Pager from "./Pager";
import PageSizeSelector from "./PageSizeSelector";
import styled from 'styled-components';
import { RowInline, RowWrap } from './primitives';

// Root uses the wrap behavior; reuse RowWrap and add spacing
const Root = styled(RowWrap)`
  justify-content: space-between;
  gap: var(--gap-xs, var(--gap-xs, var(--gap-xs, 6px)));
  margin-top: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
const RightGroup = RowInline;

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
    <Root>
      <div>{left}</div>
      <RightGroup>
        {total > pageSize && (
          <Pager page={page} pageSize={pageSize} total={total} onChangePage={onChangePage} compact />
        )}
        <PageSizeSelector pageSize={pageSize} total={total} onChange={(n) => { onChangePage(1); onChangePageSize(n); }} />
        {right}
      </RightGroup>
    </Root>
  );
}
