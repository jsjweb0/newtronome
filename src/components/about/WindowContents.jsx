import React, {useEffect, useMemo, useState} from "react";
import AboutMeTerminal from "./AboutMeTerminal.jsx";
import Tabs98 from "./Tabs98.jsx";

function AboutContent() {
    return (
        <AboutMeTerminal speed={35} linePause={600} />
    );
}

function ProfileContent({ onUpdateCheck }) {
    return (
        <div className="window-body grow">
            <div className="flex gap-x-4 pl-4">
                <div className="shrink-0 relative">
                    <img src="/images/icon/png/network_cool_two_pcs-0.png" alt=""/>
                    <span className="dot"/>
                </div>
                <div className="block w-full">
                    <div className="field-row ml-3 mb-2">
                        <input disabled id="N" type="radio" name="development"/>
                        <label htmlFor="N">Web Publisher</label>
                    </div>
                    <fieldset>
                        <legend>
                            <div className="field-row">
                                <input id="Y" type="radio" name="development" checked/>
                                <label htmlFor="Y">Front-end web development</label>
                            </div>
                        </legend>
                        <div className="field-row">
                            <label htmlFor="userName">이름</label>
                            <input id="userName" type="text" className="grow" value="정수진" readOnly />
                        </div>
                        <div className="field-row">
                            <label htmlFor="region">지역</label>
                            <input id="region" type="text" className="grow" value="대한민국, 광주" readOnly />
                        </div>
                        <div className="field-row">
                            <label htmlFor="experience">경력</label>
                            <input id="experience" type="text" className="grow" value="웹 퍼블리셔 8년차" readOnly />
                        </div>
                        <div className="field-row">
                            <label htmlFor="nowexperience">현재</label>
                            <input id="nowexperience" type="text" className="grow"
                                   value="프론트엔드 개발자로 커리어 전환 중" readOnly />
                        </div>
                        <div className="field-row">
                            <label htmlFor="strength">강점</label>
                            <input id="strength" type="text" className="grow"
                                   value="UI 구조 설계, 시맨틱 마크업, 반응형 웹, 사용자 경험" readOnly />
                        </div>
                        <div className="field-row">
                            <label htmlFor="goal">목표</label>
                            <input id="goal" type="text" className="grow"
                                   value="기능과 감성을 모두 고려하는 프론트엔드 개발자" readOnly />
                        </div>
                    </fieldset>
                </div>
            </div>
            <hr className="divider"/>
            <div className="shrink-0 text-center">
                <button onClick={onUpdateCheck}>업데이트 확인(<span className="underline">D</span>)&gt;&gt;
                </button>
            </div>
        </div>
    );
}

function ReadmeContent() {
    return (
        <>
            <div className="flex justify-between bg-white px-8 py-4">
                <div>
                    <b>Front-end deveplorer</b>
                    <p className="ml-5">Setup is detecing and installing devices on your computer.</p>
                </div>
                <img src="/images/icon/png/windows_title-1.png" alt=""/>
            </div>
            <hr className="divider !m-0"/>
            <div className="window-body">
                <div className=" pt-5 px-8">
                    <div className="flex gap-x-4">
                        <div className="shrink-0 h-full" aria-hidden="true">
                            <img src="/images/icon/png/installer-2.png" alt=""/>
                        </div>
                        <div className="text-xs ">
                            저는 오랫동안 웹 퍼블리셔로 다양한 프로젝트에서 구조적인 UI를 만드는 일을 해왔습니다.
                            <br/> 최근에는 React를 기반으로 상태 관리, API 연동, 사용자 입력 검증 등 프론트엔드 기능 개발에 집중하고 있으며, 단순히 화면을
                            구현하는 것이 아닌 "사용자가 머무르고 싶은 웹"을 만드는 데 관심이 많습니다.
                            <br/> 디자인 감각 + 마크업 실력 + 프론트 기술의 균형을 갖춘 개발자가 되는 것이 목표입니다.
                        </div>
                    </div>
                    <div className="progress-indicator mt-10 mb-30 !h-6">
                        <span className="progress-indicator-bar w-40"/>
                    </div>
                </div>
                <hr className="divider"/>
                <div className="flex justify-center">
                    <button disabled>&#60; 뒤로</button>
                    <button disabled>다음 &#62;</button>
                </div>
            </div>
        </>
    )

}

function SkillsContent() {
    const [cpu, setCpu] = useState(14);

    // CPU 사용량 가벼운 랜덤 변동
    useEffect(() => {
        const id = setInterval(() => {
            setCpu((p) => {
                const delta = Math.floor(Math.random() * 7) - 3; // -3~+3
                const next = Math.min(42, Math.max(6, p + delta));
                return next;
            });
        }, 1200);
        return () => clearInterval(id);
    }, []);

    return (
        <>
            <div className="window-body">
                <menu role="tablist">
                    <li role="tab" aria-selected="true" className="bg-[silver]"><a href="#tabs"
                                                                                   className="w-8 text-center">Skills</a>
                    </li>
                    <li role="tab" className="bg-[silver]"><a href="#tabs">Applications</a></li>
                    <li role="tab" className="bg-[silver]"><a href="#tabs">Processes</a></li>
                    <li role="tab" className="bg-[silver]"><a href="#tabs">Performance</a></li>
                </menu>
                <div className="window w-full" role="tabpanel">
                    <div className="window-body">
                        <p className="mb-1">What is web development?</p>
                        <div className="flex gap-x-4">
                            <div className="shrink-0"><img src="/images/icon/png/key_win_alt-2.png" alt=""/>
                            </div>
                            <div className="grow">
                                <ul className="tree-view overflow-y-auto h-[296px]">
                                    <li>
                                        <details open>
                                            <summary className="flex items-center"><img
                                                src="/images/icon/png/world-1.png" className="mr-1" alt=""/> Web
                                            </summary>
                                            <ul>
                                                <li>HTML</li>
                                                <li>CSS</li>
                                                <li>JavaScript (ES6+)</li>
                                                <li>jQuery</li>
                                            </ul>
                                        </details>
                                    </li>
                                    <li>
                                        <details open>
                                            <summary>⚛️ Framework</summary>
                                            <ul>
                                                <li>React</li>
                                                <li>React Router</li>
                                                <li>React Hook Form</li>
                                                <li>Zustand</li>
                                            </ul>
                                        </details>
                                    </li>
                                    <li>
                                        <details>
                                            <summary className="flex items-center"><img
                                                src="/images/icon/png/kodak_imaging-1.png" className="mr-1"
                                                alt=""/> UI
                                            </summary>
                                            <ul>
                                                <li>Figma</li>
                                                <li>Tailwind CSS</li>
                                                <li>Styled-components</li>
                                                <li>Adobe Photoshop</li>
                                            </ul>
                                        </details>
                                    </li>
                                    <li>
                                        <details>
                                            <summary className="flex items-center"><img
                                                src="/images/icon/png/directory_admin_tools-1.png"
                                                className="mr-1" alt=""/> Backend
                                            </summary>
                                            <ul>
                                                <li>Firebase (Auth/Firestore)</li>
                                            </ul>
                                        </details>
                                    </li>
                                    <li>
                                        <details>
                                            <summary className="flex items-center"><img
                                                src="/images/icon/png/package-0.png" className="mr-1"
                                                alt=""/> 기타
                                            </summary>
                                            <ul>
                                                <li>GitHub</li>
                                                <li>Netlify</li>
                                                <li>Vite</li>
                                            </ul>
                                        </details>
                                    </li>
                                    <li>
                                        <details>
                                            <summary className="flex items-center"><img
                                                src="/images/icon/png/directory_open_cool-4.png"
                                                className="mr-1" alt=""/> 학습 중:
                                            </summary>
                                            <ul>
                                                <li>TypeScript</li>
                                                <li>Next.js</li>
                                            </ul>
                                        </details>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="status-bar">
                <p className="status-bar-field">Press F1 for help</p>
                <p className="status-bar-field">Slide 1 of 1</p>
                <p className="status-bar-field">CPU Usage: {cpu}%</p>
            </div>
        </>
    )
}

function ProjectsContent() {
    return (
        <Tabs98 className="window-body" tabs={[
            {
                id: "projects",
                label: "projects",
                content: (
                    <>
                        {/* tab 1 */}
                        <div className="flex gap-x-5">
                            <div className="shrink-0 pt-1 pl-4"><img
                                src="/images/icon/png/telephony-2.png" alt=""/></div>
                            <div className="grow">
                                <h3 className="!text-xs font-bold font-mono">
                                    SoundCloud Player — <a href="http://newtronome.netlify.app/" target="_blank" title="새 창 열림">▶ <span className="underline">View</span>, <a
                                    href="https://dashing-shroud-a2f.notion.site/SoundCloud-Player-React-Vite-Firebase-Tailwind-2536b7b5d015807a91c5cbb1fa567b97?source=copy_link" target="_blank" title="새 창 열림">▶<span className="underline">Notion</span></a></a>
                                </h3>
                                <ul className="ml-1 mt-1.5">
                                    <li className="mb-px">📅 2025.07 ~ 2025.08</li>
                                    <li className="mb-px">⚛️ React • ⚡ Vite • 🔥 Firebase • 🎨 Tailwind • 🤖
                                        ChatGPT
                                    </li>
                                    <li className="mb-px">🎵 SoundCloud API 연동</li>
                                    <li className="mb-px">👤 Firebase 회원가입 · 로그인</li>
                                    <li className="mb-px">🎲 플레이리스트 랜덤 재생 & 편집</li>
                                    <li>❤️ 실시간 좋아요</li>
                                </ul>
                            </div>
                        </div>
                        <hr className="divider"/>
                        <div className="flex gap-x-5">
                            <div className="shrink-0 pt-1 pl-4"><img src="/images/icon/png/channels-2.png" alt=""/></div>
                            <div className="grow">
                                <h3 className="!text-xs font-bold font-mono">보호동물 — <a href="https://newtronome.netlify.app/board/pet" target="_blank" title="새 창 열림">▶ <span className="underline">View</span></a></h3>
                                <ul className="ml-1 mt-1.5">
                                    <li className="mb-px">📅 2025.07 ~ 2025.07</li>
                                    <li className="mb-px">⚛️ React • ⚡ Vite • 🌐 Open API • 🎨 Tailwind • 🤖 ChatGPT</li>
                                    <li className="mb-px">🐾 국가동물보호정보시스템 구조동물 Open API 활용</li>
                                    <li className="mb-px">📋 목록 & 상세페이지</li>
                                    <li className="mb-px">🔍 검색조건 필터</li>
                                    <li className="mb-px">❤️ 실시간 좋아요</li>
                                    <li>📌 좋아요 목록 보기</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )
            },
            {
                id: "projects2",
                label: "Preview",
                content: (
                    <div>
                        <div><img src="/images/screenshot_project1_1.png" alt=""/></div>
                    </div>
                )
            }
        ]}>
        </Tabs98>
    )
}

function ContactContent() {
    return (
        <div className="window-body">
            <div className="text-center mb-3">
                <img src="/images/icon/png/entire_network_globe-0.png" alt=""/>
            </div>
            <ul className="flex flex-col gap-y-px">
                <li><img src="/images/icon/png/envelope_closed-1.png" alt=""/> 이메일: <a href="mailto:jsjweb0@gmail.com">jsjweb0@gmail.com</a></li>
                <li><img src="/images/icon/png/directory_open_cabinet_fc-1.png" alt=""/> GitHub: <a href="https://github.com/jsjweb0" target="_blank">github.com/jsjweb0</a></li>
                <li><img src="/images/icon/png/notepad-0.png" alt=""/> 이력서 PDF: <a href="#" download>Download</a></li>
                <li><img src="/images/icon/png/msie1-4.png" alt=""/> 사이트: <a href="https://newtronome.netlify.app" target="_blank">newtronome.netlify.app</a></li>
            </ul>
            <div className="mt-2.5 text-center">
                <input type="submit" onClick={() => window.location.href = "mailto:jsjweb0@gmail.com"}/>
            </div>
        </div>
    )
}

function funfactContent() {
    return (
        <div className="window-body !m-1">
            <ul className="flex gap-x-3 items-center mb-1 ml-1">
                <li>파일(<span className="underline">F</span>)</li>
                <li>편집(<span className="underline">E</span>)</li>
                <li>서식(<span className="underline">O</span>)</li>
                <li>보기(<span className="underline">V</span>)</li>
                <li>도움말(<span className="underline">H</span>)</li>
            </ul>
            <pre className="whitespace-pre-wrap overflow-scroll min-h-[147px]">
                🎵 좋아하는 음악: French House 🎧, Nu Disco 💃, New Jack Swing 🎷
                <br/>☕ 커피 없으면 코딩 불가
                <br/>🖌 UI/UX 1px 차이 남
                <br/>💾 Ctrl+S 저장 강박
                <br/>🤖 GPT-5 적극 활용
            </pre>
        </div>
    )
}

export const windowComponents = {
    about: AboutContent,
    profile: ProfileContent,
    readme: (props) => <ReadmeContent {...props} />,
    skills: SkillsContent,
    projects: ProjectsContent,
    contact: ContactContent,
    funfact: funfactContent,
};

export function FallbackContent() {
    return <div>내용을 불러올 수 없어요 🙏</div>;
}