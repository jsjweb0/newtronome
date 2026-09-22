import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { PostsProvider } from './contexts/PostsProvider';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import MyActivity from './pages/user/MyActivity';
import DynamicBoard from './pages/board/DynamicBoard';
import PostView from './pages/board/PostView';
import PostWritePage from './pages/board/PostWritePage';
import EditPostPage from './pages/board/EditPostPage';
import PetPostView from './pages/board/PetPostView';
import NotFoundPage from './pages/NotFoundPage';
import ScrollToTopSmooth from './components/ui/ScrollToTopSmooth';
import LikedTracksPage from './features/bookmarks/pages/LikedTracksPage';
import { lazy, Suspense } from 'react';
import ITunesSearchPage from './features/itunes/pages/ITunesSearchPage';

const HomePage = lazy(() => import('./pages/HomePage'));
const AccountProfile = lazy(() => import('./pages/user/AccountProfile'));
const PetBoardPage = lazy(() => import('./pages/board/PetBoardPage'));

function App() {
  return (
    <>
      <ScrollToTopSmooth />
      <Suspense fallback={<div>페이지를 불러오는 중...</div>}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* layout 적용될 라우트 그룹 */}
            <Route index element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/account" element={<AccountProfile />} />
            <Route path="/likes" element={<LikedTracksPage />} />
            <Route path="/search" element={<ITunesSearchPage />} />
            <Route
              path="/mypage"
              element={
                <PostsProvider>
                  <MyActivity />
                </PostsProvider>
              }
            />

            {/* 게시판 */}
            <Route
              path="/board/:boardType"
              element={
                <PostsProvider>
                  <DynamicBoard />
                </PostsProvider>
              }
            />
            <Route
              path="/board/:boardType/:id"
              element={
                <PostsProvider>
                  <PostView />
                </PostsProvider>
              }
            />
            <Route
              path="/board/:boardType/write"
              element={
                <PostsProvider>
                  <PostWritePage />
                </PostsProvider>
              }
            />
            <Route
              path="/board/:boardType/edit/:id"
              element={
                <PostsProvider>
                  <EditPostPage />
                </PostsProvider>
              }
            />
            <Route path="/board/pet" element={<PetBoardPage />} />
            <Route path="/board/pet/:id" element={<PetPostView />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
