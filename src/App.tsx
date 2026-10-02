import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { PostsProvider } from './contexts/PostsProvider';
import NotFoundPage from './pages/NotFoundPage';
import ScrollToTopSmooth from './components/ui/ScrollToTopSmooth';
import { lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const AccountProfile = lazy(() => import('./pages/user/AccountProfile'));
const PetBoardPage = lazy(() => import('./pages/board/PetBoardPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const MyActivity = lazy(() => import('./pages/user/MyActivity'));
const DynamicBoard = lazy(() => import('./pages/board/DynamicBoard'));
const PostView = lazy(() => import('./pages/board/PostView'));
const PostWritePage = lazy(() => import('./pages/board/PostWritePage'));
const EditPostPage = lazy(() => import('./pages/board/EditPostPage'));
const PetPostView = lazy(() => import('./pages/board/PetPostView'));
const LikedTracksPage = lazy(
  () => import('./features/bookmarks/pages/LikedTracksPage')
);
const ITunesSearchPage = lazy(
  () => import('./features/itunes/pages/ITunesSearchPage')
);

function App() {
  return (
    <>
      <ScrollToTopSmooth />
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
    </>
  );
}

export default App;
