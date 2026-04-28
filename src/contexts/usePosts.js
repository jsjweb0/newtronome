import {useContext} from "react";
import {PostsContext} from "./postsContextValue.js";

export function usePosts() {
    const context = useContext(PostsContext);
    if (!context) {
        throw new Error("usePosts는 <PostsProvider> 안에서 사용해야 해요.");
    }
    return context;
}
