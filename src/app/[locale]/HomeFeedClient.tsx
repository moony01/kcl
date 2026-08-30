'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CirclePlay, Clock3, Image as ImageIcon } from 'lucide-react';
import type { PublicProfilePostRecord } from '@/lib/api/profile-content';
import { usePublicProfileFeed } from '@/hooks/usePublicProfileFeed';
import styles from './home-feed.module.scss';

function getSafeMediaUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function formatPostDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function MediaPreview({
  post,
  imageLabel,
  shortLabel,
  unavailableLabel,
}: {
  post: PublicProfilePostRecord;
  imageLabel: string;
  shortLabel: string;
  unavailableLabel: string;
}) {
  const [hasError, setHasError] = useState(false);
  const mediaUrl = getSafeMediaUrl(post.media_url);
  const unavailable = hasError || !mediaUrl;
  const mediaLabel = post.media_type === 'short' ? shortLabel : imageLabel;

  return (
    <div className={`${styles.mediaFrame} ${post.media_type === 'short' ? styles.shortMediaFrame : ''}`}>
      {unavailable ? (
        <div className={styles.mediaFallback} role="img" aria-label={unavailableLabel}>
          <span>{unavailableLabel}</span>
        </div>
      ) : post.media_type === 'short' ? (
        <video
          className={styles.media}
          controls
          preload="metadata"
          playsInline
          src={mediaUrl}
          aria-label={mediaLabel}
          onError={() => setHasError(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.media}
          src={mediaUrl}
          alt={post.caption?.trim() || imageLabel}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      )}
      {!unavailable && post.media_type === 'short' && (
        <span className={styles.mediaBadge} aria-hidden="true">
          <CirclePlay size={13} />
          {shortLabel}
        </span>
      )}
    </div>
  );
}

function FeedCard({
  post,
  locale,
  memberLabel,
  imageLabel,
  shortLabel,
  unavailableLabel,
  untitledLabel,
  publicLabel,
}: {
  post: PublicProfilePostRecord;
  locale: string;
  memberLabel: string;
  imageLabel: string;
  shortLabel: string;
  unavailableLabel: string;
  untitledLabel: string;
  publicLabel: string;
}) {
  const postDate = formatPostDate(post.created_at, locale);
  const mediaLabel = post.media_type === 'short' ? shortLabel : imageLabel;

  return (
    <article className={styles.feedCard} data-testid="profile-feed-card">
      <header className={styles.postHeader}>
        <div className={styles.authorIdentity}>
          <span className={styles.authorAvatar} aria-hidden="true">M</span>
          <div className={styles.authorCopy}>
            <strong>{memberLabel}</strong>
            <span>{publicLabel}</span>
          </div>
        </div>
        <span className={styles.mediaType}>
          {post.media_type === 'short' ? <CirclePlay size={14} aria-hidden="true" /> : <ImageIcon size={14} aria-hidden="true" />}
          {mediaLabel}
        </span>
      </header>
      <MediaPreview
        post={post}
        imageLabel={imageLabel}
        shortLabel={shortLabel}
        unavailableLabel={unavailableLabel}
      />
      <div className={styles.cardBody}>
        <p className={styles.caption}>{post.caption || untitledLabel}</p>
        <div className={styles.postActions} aria-label={publicLabel}>
          <span className={styles.actionItem}>
            {post.media_type === 'short' ? <CirclePlay size={15} aria-hidden="true" /> : <ImageIcon size={15} aria-hidden="true" />}
            {mediaLabel}
          </span>
          <span className={styles.actionItem}>
            <Clock3 size={15} aria-hidden="true" />
            <time dateTime={post.created_at}>{postDate}</time>
          </span>
          <span className={styles.actionItem}>{publicLabel}</span>
        </div>
      </div>
    </article>
  );
}

export default function HomeFeedClient() {
  const locale = useLocale();
  const t = useTranslations('Home');
  const { posts, isLoading, hasMore, error, loadMore, reload } = usePublicProfileFeed();
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore || isLoading || error || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: '0px 0px 480px', threshold: 0.01 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, isLoading, loadMore]);

  return (
    <section className={styles.feedShell} aria-labelledby="home-feed-title" data-testid="home-profile-feed">
      <header className={styles.feedHeader}>
        <div>
          <p className={styles.feedEyebrow}>MEARROW COMMUNITY</p>
          <h1 id="home-feed-title" className={styles.feedTitle}>{t('feed_title')}</h1>
          <p className={styles.feedSubtitle}>{t('feed_subtitle')}</p>
        </div>
        <span className={styles.feedStatus}>{t('feed_public')}</span>
      </header>

      {isLoading && posts.length === 0 && (
        <div className={styles.feedState} aria-busy="true" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <p>{t('feed_loading')}</p>
        </div>
      )}

      {error && posts.length === 0 && (
        <div className={styles.feedState} role="alert">
          <p>{t('feed_error')}</p>
          <button type="button" className={styles.retryButton} onClick={() => void reload()}>
            {t('feed_retry')}
          </button>
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className={styles.feedState}>
          <p>{t('feed_empty')}</p>
        </div>
      )}

      {posts.length > 0 && (
        <>
          <div className={styles.feedGrid}>
            {posts.map((post) => (
              <FeedCard
                key={post.id}
                post={post}
                locale={locale}
                memberLabel={t('feed_member')}
                imageLabel={t('feed_image')}
                shortLabel={t('feed_short')}
                unavailableLabel={t('feed_media_unavailable')}
                untitledLabel={t('feed_untitled')}
                publicLabel={t('feed_public')}
              />
            ))}
          </div>
          {error && (
            <div className={styles.inlineError} role="status">
              <span>{t('feed_more_error')}</span>
              <button type="button" onClick={() => void loadMore()}>{t('feed_retry')}</button>
            </div>
          )}
          {hasMore && !error && (
            <>
              <div ref={loadMoreSentinelRef} className={styles.feedSentinel} aria-hidden="true" />
              {isLoading && (
                <p className={styles.feedLoadingMore} aria-live="polite">
                  <span className={styles.spinner} aria-hidden="true" />
                  {t('feed_loading')}
                </p>
              )}
            </>
          )}
          {hasMore && !error && (
            <button
              type="button"
              className={styles.loadMoreButton}
              onClick={() => void loadMore()}
              disabled={isLoading}
            >
              {isLoading ? t('feed_loading') : t('feed_load_more')}
            </button>
          )}
          {!hasMore && <p className={styles.feedEnd}>{t('feed_end')}</p>}
        </>
      )}
    </section>
  );
}
