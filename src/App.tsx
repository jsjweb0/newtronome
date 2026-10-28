import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import MainLayout from './layouts/MainLayout';
import NotFoundPage from './pages/NotFoundPage';
import ScrollToTopSmooth from './components/ui/ScrollToTopSmooth';
import { lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const AccountProfile = lazy(() => import('./pages/user/AccountProfile'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const MyActivity = lazy(() => import('./pages/user/MyActivity'));
const DynamicBoard = lazy(() => import('./pages/board/DynamicBoard'));
const PostView = lazy(() => import('./pages/board/PostView'));
const PostWritePage = lazy(() => import('./pages/board/PostWritePage'));
const EditPostPage = lazy(() => import('./pages/board/EditPostPage'));
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
        <Route path={ROUTES.home.path} element={<MainLayout />}>
          <Route index element={<HomePage />} />
          {/* layout 적용될 라우트 그룹 */}
          <Route path={ROUTES.login.path} element={<LoginPage />} />
          <Route path={ROUTES.signup.path} element={<SignupPage />} />
          <Route path={ROUTES.account.path} element={<AccountProfile />} />
          <Route path={ROUTES.likes.path} element={<LikedTracksPage />} />
          <Route path={ROUTES.search.path} element={<ITunesSearchPage />} />
          <Route path={ROUTES.mypage.path} element={<MyActivity />} />

          {/* 게시판 */}
          <Route path={ROUTES.boardList.path} element={<DynamicBoard />} />
          <Route path={ROUTES.boardDetail.path} element={<PostView />} />
          <Route path={ROUTES.boardWrite.path} element={<PostWritePage />} />
          <Route path={ROUTES.boardEdit.path} element={<EditPostPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
