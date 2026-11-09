export interface Playlist {
    id: string;
    soundCloudUrl: string;
    title: string;
    coverUrl: string | null;
    /**
     * 플레이리스트를 마지막으로 손본 날짜 (YYYY-MM-DD, 선택).
     * SoundCloud oEmbed · Widget API는 플레이리스트 수정일을 주지 않아서 직접 적는다.
     * 없으면 상세 화면의 큐레이션 줄에서 날짜만 숨긴다.
     */
    updatedAt?: string;
}

export const PLAYLISTS: ReadonlyArray<Playlist> = [
    {
        id: '2025-summer',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2025-summer',
        title: '2025 처서 디스코',
        coverUrl: null,
    },
    {
        id: '2024-spring',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2024-spring',
        title: '2024 입하 디스코',
        coverUrl: 'https://i1.sndcdn.com/artworks-LPqUcC3PkfKV6wbb-MLAeyg-t500x500.jpg',
    },
    {
        id: '2023-spring',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2023-spring',
        title: '2023 경칩 디스코',
        coverUrl: 'https://i1.sndcdn.com/artworks-h1PUvB3D4BYxU1V7-ACzBJA-t500x500.jpg',
    },
    {
        id: '2022-summer',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2022-summer',
        title: '2022 하지 디스코',
        coverUrl: 'https://i1.sndcdn.com/artworks-AKMBhZNL1msuvNhA-y8OzEg-t500x500.jpg',
    },
    {
        id: '2020-spring',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2020-spring',
        title: '2020 춘분 디스코',
        coverUrl: null,
    },
    {
        id: '2019-spring',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2019-spring',
        title: '2019 초복디스코',
        coverUrl: null,
    },
    {
        id: '2018-disco',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2018-disco',
        title: '2018 중복디스코',
        coverUrl: null,
    },
    {
        id: '2017-summer',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2017-summer',
        title: '2017 하지 디스코',
        coverUrl: null,
    },
    {
        id: '2017-spring',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2017-spring',
        title: '2017 입하 디스코',
        coverUrl: null,
    },
    {
        id: '2017spring',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2017spring',
        title: '2017 입춘 디스코',
        coverUrl: null,
    },
    {
        id: 'm3stc8ixvqcw',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/m3stc8ixvqcw',
        title: '입동 디스코',
        coverUrl: null,
    },
    {
        id: 'lkuriahk4u4p',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/lkuriahk4u4p',
        title: '말복 디스코',
        coverUrl: null,
    },
    {
        id: '1j886wtueuzr',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/1j886wtueuzr',
        title: '입춘 디스코',
        coverUrl: null,
    },
    {
        id: 'spring-disco',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/spring-disco',
        title: 'Spring Disco',
        coverUrl: null,
    },
    {
        id: 'autumn-disco',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/autumn-disco',
        title: 'Autumn Disco',
        coverUrl: null,
    },
    {
        id: 'summer-disco2',
        soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/summer-disco2',
        title: 'summer disco2',
        coverUrl: null,
    },
];

export const findPlaylistById = (id: string | null | undefined) =>
    id ? PLAYLISTS.find((playlist) => playlist.id === id) ?? null : null;
