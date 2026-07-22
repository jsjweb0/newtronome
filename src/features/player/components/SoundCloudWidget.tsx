import type { RefCallback } from 'react';
import { AudioEqualizerIcon } from '../../../components/icons';

const WIDGET_PRELOAD_HEIGHT = 3000;

interface SoundCloudWidgetController {
  iframeRef: RefCallback<HTMLIFrameElement>;
  isReady: boolean;
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

      <iframe
        ref={iframeRef}
        title="SoundCloud 플레이리스트"
        src={widgetUrl}
        width="100%"
        height={WIDGET_PRELOAD_HEIGHT}
        scrolling="no"
        frameBorder="0"
        allow="autoplay"
        className="block w-full"
      />
    </>
  );
}
