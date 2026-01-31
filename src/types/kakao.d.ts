/**
 * Kakao SDK 타입 선언
 * @see https://developers.kakao.com/docs/latest/ko/sdk-download/js
 */

interface KakaoShareContent {
  title: string;
  description?: string;
  imageUrl?: string;
  link: {
    mobileWebUrl: string;
    webUrl: string;
  };
}

interface KakaoShareButton {
  title: string;
  link: {
    mobileWebUrl: string;
    webUrl: string;
  };
}

interface KakaoShareFeedPayload {
  objectType: 'feed';
  content: KakaoShareContent;
  buttons?: KakaoShareButton[];
}

interface KakaoShare {
  sendDefault: (payload: KakaoShareFeedPayload) => void;
}

interface KakaoSDK {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: KakaoShare;
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

export {};
