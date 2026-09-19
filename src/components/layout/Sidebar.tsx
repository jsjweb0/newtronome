import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DarkModeToggle from '../DarkModeToggle';
import {
  Menu,
  X,
  Music,
  Dog,
  LogIn,
  LogOut,
  Activity,
  Disc3,
  Heart,
  Search as SearchIcon
} from 'lucide-react';
import { LogoIcon, LogoMoIcon, Turntable, MusicLibrary } from '../icons';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import Tooltip from '../ui/Tooltip';
import NotificationDropdown from '../ui/NotificationDropdown';
import type { ComponentType, SVGProps } from 'react';
import HSDropdown from '@preline/dropdown';

interface SidebarProps {
  collapsed?: boolean;
}

interface NavItemBase {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  requiresAuth?: boolean;
  requiresGuest?: boolean;
  hideOnLg?: boolean;
}

type NavItem =
  | (NavItemBase & {
    path: string;
    action?: never;
  })
  | (NavItemBase & {
    path?: never;
    action: () => Promise<void>;
  });

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { user, logout, avatarUrl, nicknameUrl } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  const navItems: ReadonlyArray<NavItem> = [
    { label: 'Browse', path: '/', icon: Music },
    { label: 'Search', path: '/search', icon: SearchIcon },
    { label: 'Likes', path: '/likes', icon: Heart },
    { label: 'Notice', path: '/board/notice', icon: Disc3 },
    { label: 'Free Board', path: '/board/free', icon: Activity },
    { label: 'Archive', path: '/board/pet', icon: Dog },
    //{label: "About", path: "/about", icon: LogoMoIcon},
    { label: 'My Account', path: '/account', icon: Turntable, requiresAuth: true },
    { label: 'My Activity', path: '/mypage', icon: MusicLibrary, requiresAuth: true },
    { label: 'Login', path: '/login', icon: LogIn, requiresGuest: true, hideOnLg: true },
    { label: 'LogOut', icon: LogOut, requiresAuth: true, action: logout, hideOnLg: true },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (item.requiresGuest && user) return false;
    return true;
  });

  const navBaseClasses =
    'flex items-center gap-x-2 w-full px-3 py-3 rounded-full text-sm lg:text-base transition-all duration-300';
  const navActiveClasses = 'bg-primary/6 text-primary font-semibold';
  const navInactiveClasses = 'hover:text-primary hover:bg-primary/6';
  const getNavItemClass = (isActive: boolean) =>
    clsx(
      navBaseClasses,
      isActive ? navActiveClasses : navInactiveClasses,
      !isMobile && collapsed && 'lg:w-[48px]'
    );
  const navIconClasses = 'shrink-0 size-5 lg:size-6 transition-colors';

  const profileImage = () => {
    if (user?.photoURL) {
      return user.photoURL;
    }
    if (user?.displayName) {
      return nicknameUrl;
    }
    return avatarUrl;
  };

  useEffect(() => {
    //window.HSStaticMethods?.autoInit();
    HSDropdown.autoInit();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resetStyles = () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.removeAttribute('style');
      }
    };

    const mql = window.matchMedia('(max-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mql.matches);

    if (mql.matches) resetStyles();
    const onMatchChange = (event: MediaQueryListEvent) => event.matches && resetStyles();

    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      mql.addEventListener('change', onMatchChange);
    } else {
      mql.addListener(handleChange);
      mql.addListener(onMatchChange);
    }

    document.addEventListener('close.hs.dropdown', resetStyles);

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleChange);
        mql.removeEventListener('change', onMatchChange);
      } else {
        mql.removeListener(handleChange);
        mql.removeListener(onMatchChange);
      }
      document.removeEventListener('close.hs.dropdown', resetStyles);
    };
  }, []);

  const enableTooltip = collapsed && !isMobile;

  return (
    <div>
      <nav id="navbar" className="group hs-dropdown" aria-label="Main">
        <div className="flex items-center lg:mb-14 lg:pt-3">
          <h1 className="grow text-left">
            <Link
              to="/"
              className="inline-flex justify-start p-0.5 lg:p-2 text-primary max-lg:h-4 max-lg:pl-2"
              aria-label="NEWTRONOME"
            >
              {collapsed ? <LogoMoIcon className="w-8" /> : <LogoIcon className="w-full" />}
            </Link>
          </h1>
          {/* Collapse Button */}
          <button
            id="hs-dropdown-default"
            type="button"
            className="hs-dropdown-toggle block lg:hidden p-1 text-base"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-label="Dropdown"
          >
            <Menu className="group-[.open]:hidden size-5" />
            <X className="hidden group-[.open]:block shrink-0 size-5" />
            <span className="sr-only">전체메뉴 토글</span>
          </button>
          {/* End Collapse Button */}
        </div>

        {/* Collapse */}
        <div
          className={clsx(
            'hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 max-lg:opacity-0 z-50 lg:transform-none!',
            'hidden lg:block lg:basis-full lg:grow w-full transition-all duration-300',
            'max-lg:px-3 max-lg:mt-2',
            'max-lg:max-h-[calc(100dvh-3.5rem)] max-lg:overflow-y-auto max-lg:overscroll-contain'
          )}
        >
          <div className="relative max-lg:bg-background rounded-xl max-lg:p-3 max-lg:shadow-md">
            <ul className="space-y-1">
              {visibleNav.map((item) => {
                const { label, icon: Icon, hideOnLg } = item;

                return (
                  <li key={label} className={clsx('mb-2', hideOnLg && 'lg:hidden')}>
                    {item.path !== undefined ? (
                      <Tooltip content={label} position="right" enabled={enableTooltip}>
                        <NavLink to={item.path} className={({ isActive }) => getNavItemClass(isActive)}>
                          <Icon className={navIconClasses} />
                          <span
                            className={clsx(
                              'transition-all duration-300 ease-in-out whitespace-nowrap',
                              collapsed ? 'lg:animate-fade-slide-out' : 'lg:animate-fade-slide-in'
                            )}
                          >
                            {label}
                          </span>
                        </NavLink>
                      </Tooltip>
                    ) : (
                      <button
                        type="button"
                        className={clsx('w-full', getNavItemClass(false))}
                        onClick={item.action}
                      >
                        <Icon className={navIconClasses} />
                        <span>{label}</span>
                      </button>
                    )}
                  </li>
                );
              })}
              <li key="dark-mode-toggle" className="lg:hidden mb-2">
                <DarkModeToggle
                  tooltipEnabled={false}
                  showText={true}
                  className="w-full justify-start! text-sm"
                />
              </li>
            </ul>

            {user && (
              <div className="flex lg:hidden items-center gap-3 mt-3 pt-5 pb-3 px-3 border-t border-t-textThr">
                <div className="shrink-0 w-20 h-20 rounded-full bg-textSub">
                  <img
                    src={profileImage()}
                    alt={user.displayName || user.email || ''}
                    className="rounded-full object-cover w-full h-full"
                  />
                </div>
                <div>
                  {user.displayName && (
                    <strong className="block mb-px text-sm">{user?.displayName}</strong>
                  )}
                  <p className="mb-3 text-xs text-textSub">{user?.email}</p>
                  <Link
                    to="/account"
                    className="inline-block px-3 py-1.5 text-xs bg-primary rounded-md"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* End Collapse */}
      </nav>
      <div className="flex lg:hidden gap-1 items-center absolute top-0 right-11 h-full">
        {user && <NotificationDropdown />}
      </div>
    </div>
  );
}
