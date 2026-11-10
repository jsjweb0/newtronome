import type { RefCallback } from 'react';
import { AudioEqualizerIcon } from '../../../components/icons';

const WIDGET_PRELOAD_HEIGHT = 3000;

interface SoundCloudWidgetController {
  iframeRef: RefCallback<HTMLIFrameElement>;
  isReady: boolean;
  frameVersion: number;
}

interface SoundCloudWidgetProps {
  playlistUrl: string;
  controller: SoundCloudWidgetController;
}

export default function SoundCloudWidget({
  playlistUrl,
  controller,
}: SoundCloudWidgetProps) {
  const { iframeRef, isReady } = controller;

  const widgetUrl =
    `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}` +
    '&auto_play=false' +
    '&show_user=true' +
    '&show_artwork=true' +
    '&show_comments=false' +
    '&color=%2300FFB2';

  return (
    <>
      {!isReady && (
        <p className="flex gap-1 items-center text-sm text-textSub mb-1">
          <AudioEqualizerIcon isPlaying={true} aria-hidden="true" className="text-white size-4" />
          플레이리스트 불러오는 중...
        </p>
      )}

      {/* 전체 재생으로 플레이리스트가 바뀌면 iframe을 새로 만들어 위젯 이벤트를 새로 연결 */}
      <iframe
        key={`${widgetUrl}:${controller.frameVersion}`}
        ref={iframeRef}
        title="SoundCloud 플레이리스트"
        tabIndex={-1}
        src={widgetUrl}
        width="100%"
        height={WIDGET_PRELOAD_HEIGHT}
        scrolling="no"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        className="block w-full"
      />
    </>
  );
}
