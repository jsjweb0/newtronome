import { useParams } from "react-router-dom";
import { usePosts } from "../../contexts/usePosts.js";
import { useState } from "react";

export default function PostAddForm ({ toastRef }) {
    const { boardType } = useParams();
    const { getPosts, setPosts } = usePosts();
    const posts = getPosts(boardType);

    const [ inputTitle, setInputTitle ] = useState('');
    const [ inputContent, setInputContent ] = useState('');

    const handleSubmit = () => {
        if (!inputTitle.trim()) {
            toastRef?.showToast({message:"제목을 입력해주세요.", type:"error" });
            return;
        }

        const maxId = posts.length ? Math.max(...posts.map(p => p.id)) : 0;

        const newPost = {
            id: maxId + 1,
            title: inputTitle,
            content: inputContent.replace(/\n/g, '<br>'), // 줄바꿈 변환
            date: new Date().toISOString().split("T")[0]
        };

        setPosts([newPost, ...posts]);
        toastRef?.showToast({message:"게시글이 등록되었습니다!", type:"success"});
        setInputTitle('');
        setInputContent('');
    };

    return (
        <div className="flex flex-row items-center gap-2 my-5 md:my-16">
            <input type="text"
                   className="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg text-xs md:text-base focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                   value={inputTitle} onChange={e => setInputTitle(e.target.value)}
                    placeholder="제목을 입력해주세요" />
            <textarea className="w-full border px-3 py-2 rounded h-28"
                      placeholder="내용을 입력해주세요."
                      value={inputContent} onChange={e => setInputContent(e.target.value)}></textarea>
            <button type="button"
                    className="whitespace-nowrap py-3 px-4 inline-flex justify-center items-center gap-x-2 font-medium text-xs md:text-base rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={handleSubmit}>
                공지사항 추가
                <span className="inline-block shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                         className="size-4 lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/>
                    </svg>
                </span>
            </button>
        </div>
    )
}