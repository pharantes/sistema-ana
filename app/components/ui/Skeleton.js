"use client";
import styled from 'styled-components';

const StyledSkeleton = styled.div`
  background: linear-gradient(90deg, #f3f4f6 25%, #eceff1 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
  width: ${p => (p.$width ? (typeof p.$width === 'number' ? `${p.$width}px` : p.$width) : '100%')};
  height: ${p => (p.$height ? (typeof p.$height === 'number' ? `${p.$height}px` : p.$height) : 'var(--skeleton-height, 1em)')};
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function Skeleton(props) {
  const { className, width, height } = props;
  // allow passing width/height as props; avoid inline style prop
  return <StyledSkeleton className={className} $width={width} $height={height} />;
}
