import { describe, expect, it } from 'vitest';
import { mapSoundCloudWidgetTrack } from './mapSoundCloudWidgetTrack';

describe('SoundCloud URL 경계', () => {
  it('잘못된 선택 URL만 비우고 곡 ID·제목·재생 정보는 유지한다', () => {
    expect(mapSoundCloudWidgetTrack({ id: 1, title: 'Track', duration: 1000,
      artwork_url: 'data:image/svg+xml,test', permalink_url: 'javascript:alert(1)',
      policy: 'ALLOW', playable: true,
    })).toMatchObject({ id: 1, title: 'Track', durationMs: 1000, playbackStatus: 'allowed', artworkUrl: null, permalinkUrl: null });
  });
  it('정상 HTTPS 주소와 쿼리를 유지한다', () => {
    expect(mapSoundCloudWidgetTrack({ id: 1, title: 'Track',
      artwork_url: 'https://example.com/cover.jpg?size=500', permalink_url: 'https://soundcloud.com/artist/song',
    })).toMatchObject({ artworkUrl: 'https://example.com/cover.jpg?size=500', permalinkUrl: 'https://soundcloud.com/artist/song' });
  });
});
