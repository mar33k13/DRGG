import type { ReactNode, Ref } from 'react';

export function SectionHeading({
  title,
  description,
  kicker,
  actions,
  headingRef,
  level = 1,
  id,
  descriptionId,
}: {
  title: string;
  description?: ReactNode;
  kicker?: ReactNode;
  actions?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  level?: 1 | 2;
  id?: string;
  descriptionId?: string;
}) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <div className="page-heading">
      <div>
        {kicker && <span className="eyebrow">{kicker}</span>}
        <Heading ref={headingRef} id={id} tabIndex={headingRef ? -1 : undefined}>
          {title}
          <span className="heading-dot">.</span>
        </Heading>
        {description && <p id={descriptionId}>{description}</p>}
      </div>
      {actions}
    </div>
  );
}
