import {BaseButton} from "../ui/BaseButton.jsx";
import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "../../contexts/useToast.js";
import FormInput from "../ui/FormInput.jsx";
import {useAuth} from "../../contexts/useAuth.js";
import {AuthAccess} from "../auth/AuthAccess.jsx"
import FormTextarea from "../ui/FormTextarea.jsx";

export default function PostForm({
                                     mode = "create",
                                     boardType,
                                     onSubmit,
                                     initialData = {},
                                     nextId,
                                     nextUid
                                 }) {
    const navigate = useNavigate();
    const {showToast} = useToast();
    const {user} = useAuth();

    const [inputTitle, setInputTitle] = useState('');
    const [inputContent, setInputContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isNotice, setNotice] = useState(false);
    const defaultWriter = user?.displayName?.trim()
        ? user.displayName
        : user?.email || '';
    const [writer, setWriter] = useState(defaultWriter);
    const [errors, setError] = useState({category: '', title: '', content: ''});

    const resolvedId = initialData?.id || nextId;
    const resolvedUid = initialData?.uid || `${boardType}-${resolvedId}`;

    const titleRef = useRef(null);
    const contentRef = useRef(null);

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const categoryList = ["카테고리1", "카테고리2", "카테고리3", "카테고리4"];


    useEffect(() => {
        if (mode === "edit" && initialData) {
            setInputTitle(initialData.title || '');
            setInputContent(initialData.content || '');
            setSelectedCategory(initialData.category || '');
            setNotice(initialData.isNotice || false);
            const authorName = initialData.authorName || initialData.author;
            setWriter(authorName?.trim() ? authorName : defaultWriter);
        } else {
            setWriter(defaultWriter);
        }
    }, [initialData, mode, defaultWriter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {category: '', title: '', content: ''};
        let hasError = false;

        if (boardType === "free" && !selectedCategory) {
            newErrors.category = "카테고리를 선택해 주세요.";
            showToast({message: "카테고리를 선택해 주세요.", type: "error"});
            hasError = true;
        }
        if (!inputTitle.trim()) {
            newErrors.title = "제목을 입력해주세요.";
            showToast({message: "제목을 입력해주세요.", type: "error"});
            hasError = true;
            titleRef.current.focus();
        }
        if (!inputContent.trim()) {
            newErrors.content = "내용을 입력해주세요.";
            showToast({message: "내용을 입력해주세요.", type: "error"});
            hasError = true;
            contentRef.current.focus();
        }

        setError(newErrors);
        if (hasError) return;

        const now = formattedDate; // 또는 new Date().toISOString()
        const payload = {
            id: resolvedId,
            uid: resolvedUid,
            boardType,
            isNotice,
            category: selectedCategory,
            title: inputTitle,
            author: mode === "edit" ? initialData.author : writer,
            content: inputContent,
            createdAt: mode === "edit"
                ? (initialData.createdAt || now)
                : now,
            ...(mode === "edit" && { updatedAt: now }),
        };

        await onSubmit(payload);
    };

    const baseClasses = "mt-3 py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg text-xs md:text-base focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600";

    return (
        <div className="max-w-[85rem] mx-auto mb-8 px-4">
            <h2 className="mb-4 md:mb-8 text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
                {mode === "edit" ? "글 수정" : "글쓰기"}
            </h2>

            <AuthAccess allow={["admin"]}>
                <div className="mb-3">
                    <label htmlFor="isNotice"
                           className="flex items-center p-3 w-full text-xs md:text-base border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400">
                        <input type="checkbox" id="isNotice"
                               className="shrink-0 mt-0.5 border-gray-200 rounded-sm text-blue-600 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"
                               checked={isNotice}
                               onChange={(e) => setNotice(e.target.checked)}
                        />
                        <span className="text-gray-600 ms-3 dark:text-neutral-400">공지글</span>
                    </label>
                </div>
            </AuthAccess>

            <FormInput type="text"
                       name="date"
                       className="mb-3 text-xs md:text-base"
                       value={formattedDate}
                       readOnly
                       title="작성일"/>

            {boardType === 'free' && (
                <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setError(prev => ({...prev, category: ''}));
                    }}
                    className={`${baseClasses} pe-9`}
                    title="카테고리"
                    error={errors.category}
                >
                    <option value="">카테고리를 선택하세요</option>
                    {categoryList.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            )}

            <FormInput type="text"
                       name="writer"
                       className="mt-3"
                       onChange={e => setWriter(e.target.value)}
                       value={writer}
                       title="작성자"
                       placeholder="작성자를 입력해주세요"
                       readOnly
            />

            <FormInput type="text"
                       name="postTitle"
                       className="mt-3"
                       value={inputTitle}
                       onChange={e => {
                           setInputTitle(e.target.value);
                           setError(prev => ({...prev, title: ''}));
                       }}
                       title="제목"
                       placeholder="제목을 입력해주세요"
                       error={errors.title}
                       ref={titleRef}
            />

            <FormTextarea name="content"
                          placeholder="내용을 입력해주세요."
                          className="mt-3"
                          title="내용"
                          value={inputContent}
                          onChange={e => {
                              setInputContent(e.target.value);
                              setError(prev => ({...prev, content: ''}));
                          }}
                          error={errors.content}
                          ref={contentRef}
            />

            <div className="flex justify-center items-center mt-5">
                <BaseButton className="mr-2" variant="cancel" onClick={() => navigate(-1)}>취소</BaseButton>
                <BaseButton type="submit" onClick={handleSubmit}>
                    {mode === "edit" ? "수정" : "등록"}
                </BaseButton>
            </div>
        </div>
    )
}