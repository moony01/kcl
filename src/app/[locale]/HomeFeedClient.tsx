'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Check,
  CirclePlay,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { ProfileMediaType, PublicProfilePostRecord } from '@/lib/api/profile-content';
import { usePublicProfileFeed } from '@/hooks/usePublicProfileFeed';
import styles from './home-feed.module.scss';

type FeedFilter = 'all' | ProfileMediaType;

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

function ShareButton({
  postId,
  memberLabel,
  caption,
  shareLabel,
  sharedLabel,
  className,
  showLabel = false,
}: {
  postId: string;
  memberLabel: string;
  caption: string | null;
  shareLabel: string;
  sharedLabel: string;
  className?: string;
  showLabel?: boolean;
}) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: memberLabel,
          text: caption?.trim() || memberLabel,
          url,
        });
      } else if (typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url);
      } else {
        return;
      }

      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    } catch (cause) {
      // Closing the native share sheet is an expected user action, not an error.
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
    }
  };

  return (
    <button
      type="button"
      className={className || styles.shareButton}
      onClick={() => void handleShare()}
      aria-label={shared ? sharedLabel : shareLabel}
      title={shared ? sharedLabel : shareLabel}
    >
      {shared ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
      {showLabel && <span>{shared ? sharedLabel : shareLabel}</span>}
    </button>
  );
}

function MediaPreview({
  post,
  memberLabel,
  caption,
  shareLabel,
  sharedLabel,
  openMediaLabel,
  untitledLabel,
  imageLabel,
  shortLabel,
  unavailableLabel,
}: {
  post: PublicProfilePostRecord;
  memberLabel: string;
  caption: string | null;
  shareLabel: string;
  sharedLabel: string;
  openMediaLabel: string;
  untitledLabel: string;
  imageLabel: string;
  shortLabel: string;
  unavailableLabel: string;
}) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaUrl = getSafeMediaUrl(post.media_url);
  const unavailable = hasError || !mediaUrl;
  const mediaLabel = post.media_type === 'short' ? shortLabel : imageLabel;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || post.media_type !== 'short' || typeof IntersectionObserver === 'undefined') return;
    if (
      typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.65) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.65, 1] },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [post.id, post.media_type]);

  return (
    <div className={`${styles.mediaFrame} ${post.media_type === 'short' ? styles.shortMediaFrame : ''}`}>
      {unavailable ? (
        <div className={styles.mediaFallback} role="img" aria-label={unavailableLabel}>
          <span>{unavailableLabel}</span>
        </div>
      ) : post.media_type === 'short' ? (
        <video
          ref={videoRef}
          className={styles.media}
          controls
          muted
          loop
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
      {!unavailable && post.media_type === 'short' && (
        <div className={styles.mediaActions} aria-label={shortLabel}>
          <a
            className={styles.mediaActionButton}
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={openMediaLabel}
            title={openMediaLabel}
          >
            <ExternalLink size={17} aria-hidden="true" />
          </a>
          <ShareButton
            postId={post.id}
            memberLabel={memberLabel}
            caption={caption}
            shareLabel={shareLabel}
            sharedLabel={sharedLabel}
            className={styles.mediaActionButton}
          />
        </div>
      )}
      {!unavailable && post.media_type === 'short' && (
        <div className={styles.shortCaptionOverlay}>
          <strong>{memberLabel}</strong>
          <p>{caption || untitledLabel}</p>
        </div>
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
  shareLabel,
  sharedLabel,
  openMediaLabel,
}: {
  post: PublicProfilePostRecord;
  locale: string;
  memberLabel: string;
  imageLabel: string;
  shortLabel: string;
  unavailableLabel: string;
  untitledLabel: string;
  publicLabel: string;
  shareLabel: string;
  sharedLabel: string;
  openMediaLabel: string;
}) {
  const postDate = formatPostDate(post.created_at, locale);
  const mediaLabel = post.media_type === 'short' ? shortLabel : imageLabel;
  const mediaUrl = getSafeMediaUrl(post.media_url);

  return (
    <article
      id={`post-${post.id}`}
      className={`${styles.feedCard} ${post.media_type === 'short' ? styles.shortCard : ''}`}
      data-testid="profile-feed-card"
      data-media-type={post.media_type}
    >
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
        memberLabel={memberLabel}
        caption={post.caption}
        shareLabel={shareLabel}
        sharedLabel={sharedLabel}
        openMediaLabel={openMediaLabel}
        untitledLabel={untitledLabel}
        imageLabel={imageLabel}
        shortLabel={shortLabel}
        unavailableLabel={unavailableLabel}
      />
      <div className={styles.cardBody}>
        {post.media_type !== 'short' && (
          <p className={styles.caption}>{post.caption || untitledLabel}</p>
        )}
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
          {post.media_type !== 'short' && mediaUrl && (
            <a
              className={styles.actionLink}
              href={mediaUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={openMediaLabel}
            >
              <ExternalLink size={15} aria-hidden="true" />
              {openMediaLabel}
            </a>
          )}
          {post.media_type !== 'short' && (
            <ShareButton
              postId={post.id}
              memberLabel={memberLabel}
              caption={post.caption}
              shareLabel={shareLabel}
              sharedLabel={sharedLabel}
              showLabel
            />
          )}
        </div>
      </div>
    </article>
  );
}

export default function HomeFeedClient() {
  const locale = useLocale();
  const t = useTranslations('Home');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const mediaType = feedFilter === 'all' ? undefined : feedFilter;
  const { posts, isLoading, hasMore, error, loadMore, reload } = usePublicProfileFeed(mediaType);
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
        <div className={styles.feedHeadingCopy}>
          <p className={styles.feedEyebrow}>MEARROW COMMUNITY</p>
          <h1 id="home-feed-title" className={styles.feedTitle}>{t('feed_title')}</h1>
          <p className={styles.feedSubtitle}>{t('feed_subtitle')}</p>
        </div>
        <div className={styles.feedHeaderActions}>
          {!isAuthLoading && (
            <Link
              className={styles.publishButton}
              href={`/${locale}/${isAuthenticated ? 'my' : 'login'}`}
            >
              <Share2 size={16} aria-hidden="true" />
              {t(isAuthenticated ? 'feed_publish' : 'feed_login_to_publish')}
            </Link>
          )}
          <span className={styles.feedStatus}>{t('feed_public')}</span>
        </div>
      </header>

      <div className={styles.feedToolbar}>
        <div className={styles.feedFilters} role="tablist" aria-label={t('feed_filter_label')}>
          {(
            [
              ['all', t('feed_filter_all')],
              ['image', t('feed_filter_image')],
              ['short', t('feed_filter_short')],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={feedFilter === value}
              className={feedFilter === value ? styles.filterActive : styles.filterButton}
              onClick={() => setFeedFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={styles.feedSort}>
          <Clock3 size={14} aria-hidden="true" />
          {t('feed_sort_latest')}
        </span>
      </div>

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
                shareLabel={t('feed_share')}
                sharedLabel={t('feed_shared')}
                openMediaLabel={t('feed_open_media')}
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
