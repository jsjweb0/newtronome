import {Routes, Route} from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import {PostsProvider} from "./contexts/postsContext.jsx";
import HomePage from "./pages/HomePage.jsx";
import Todo from "./pages/Common/Todo.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import MyActivity from "./pages/user/MyActivity.jsx";
import DynamicBoard from "./pages/board/DynamicBoard.jsx";
import PostView from "./pages/board/PostView.jsx";
import PostWritePage from "./pages/board/PostWritePage.jsx";
import EditPostPage from "./pages/board/EditPostPage.jsx";
import PetBoardPage from "./pages/board/PetBoardPage.jsx";
import PetPostView from "./pages/board/PetPostView.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import AccountProfile from "./pages/user/AccountProfile.jsx";
import ScrollToTopSmooth from "./components/ui/ScrollToTopSmooth.jsx";
import AboutPage from "./pages/AboutPage.jsx";

function App() {

    return (
        <>
            <ScrollToTopSmooth />
            <Routes>
                <Route path="/" element={<MainLayout />}>

                    {/* layout 적용될 라우트 그룹 */}
                    <Route index element={<HomePage />} />
                    <Route path="/todo" element={<Todo />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/account" element={<AccountProfile />} />
                    <Route path="/mypage" element={
                        <PostsProvider>
                            <MyActivity />
                        </PostsProvider>
                    } />

                    {/* 게시판 */}
                    <Route path="/board/:boardType" element={
                        <PostsProvider>
                            <DynamicBoard />
                        </PostsProvider>
                    } />
                    <Route path="/board/:boardType/:id" element={
                        <PostsProvider>
                            <PostView />
                        </PostsProvider>
                    } />
                    <Route path="/board/:boardType/write" element={
                        <PostsProvider>
                            <PostWritePage />
                        </PostsProvider>
                    } />
                    <Route path="/board/:boardType/edit/:id" element={
                        <PostsProvider>
                            <EditPostPage />
                        </PostsProvider>
                    } />
                    <Route path="/board/pet" element={<PetBoardPage />} />
                    <Route path="/board/pet/:id" element={<PetPostView />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
                <Route path="/about" element={<AboutPage />} />
            </Routes>
        </>
    )
}

export default App
