'use client';

import { Heart, Loader2 } from 'lucide-react';
import classNames from 'classnames';
import type { FollowTargetType } from '@/lib/api/following';
import styles from './FollowToggle.module.scss';

interface FollowToggleProps {
  targetType: FollowTargetType;
  targetId: string;
  isFollowing: boolean;
  isPending?: boolean;
  followLabel: string;
  followingLabel: string;
  pendingLabel: string;
  onToggle: () => void;
}

export default function FollowToggle({
  targetType,
  targetId,
  isFollowing,
  isPending = false,
  followLabel,
  followingLabel,
  pendingLabel,
  onToggle,
}: FollowToggleProps) {
  return (
    <button
      type="button"
      className={classNames(styles.button, { [styles.following]: isFollowing })}
      data-testid={`follow-toggle-${targetType}-${targetId}`}
      aria-pressed={isFollowing}
      disabled={isPending}
      onClick={onToggle}
    >
      {isPending ? (
        <Loader2 className={styles.icon} size={15} aria-hidden="true" />
      ) : (
        <Heart className={styles.icon} size={15} fill={isFollowing ? 'currentColor' : 'none'} aria-hidden="true" />
      )}
      <span>{isPending ? pendingLabel : isFollowing ? followingLabel : followLabel}</span>
    </button>
  );
}
