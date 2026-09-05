import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import classNames from 'classnames';
import frameStyles from './PageFrame.module.scss';
import headerStyles from './PageHeader.module.scss';

type FrameElement = 'main' | 'section' | 'div';

export interface PageFrameProps extends Omit<ComponentPropsWithoutRef<'main'>, 'className'> {
  children: ReactNode;
  as?: FrameElement;
  size?: 'narrow' | 'default' | 'wide';
  className?: string;
}

export function PageFrame({
  children,
  as: Element = 'main',
  size = 'default',
  className,
  ...props
}: PageFrameProps) {
  return (
    <Element
      className={classNames(frameStyles.frame, frameStyles[size], className)}
      {...props}
    >
      {children}
    </Element>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  icon,
  actions,
  titleId,
  className,
}: PageHeaderProps) {
  return (
    <header className={classNames(headerStyles.header, className)}>
      <div className={headerStyles.copy}>
        {eyebrow ? <p className={headerStyles.eyebrow}>{eyebrow}</p> : null}
        <div className={headerStyles.titleRow}>
          {icon ? <span className={headerStyles.icon} aria-hidden="true">{icon}</span> : null}
          <h1 id={titleId} className={headerStyles.title}>{title}</h1>
        </div>
        {description ? <p className={headerStyles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={headerStyles.actions}>{actions}</div> : null}
    </header>
  );
}

export default PageFrame;
