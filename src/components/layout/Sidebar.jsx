import {Link} from "react-router-dom";
import {NavLink} from "react-router-dom";
import {Fragment, useEffect, useState} from "react";
import DarkModeToggle from "../DarkModeToggle.jsx";
import {Menu, X, Music, Home, Dog, LogIn, LogOut, Activity, CassetteTape, Disc3, Search} from "lucide-react";
import {LogoIcon, Browse, LogoMoIcon, Turntable, MusicLibrary, SynthIcon} from "../icons/index.js";
import clsx from "clsx";
import {useAuth} from "../../contexts/AuthContext.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import NotificationDropdown from "../ui/NotificationDropdown.jsx";

export default function Sidebar({collapsed = false}) {
    const {user, logout, avatarUrl, nicknameUrl} = useAuth();
    const [isMobile, setIsMobile] = useState(false);

    const navItems = [
        {label: "Home", path: "/", icon: Home},
        {label: "Browse", path: "/todo", icon: Music},
        {label: "Search", path: "/search", icon: Search},
        {label: "Notice", path: "/board/notice", icon: Disc3},
        {label: "Free Board", path: "/board/free", icon: Activity},
        {label: "Pet Board", path: "/board/pet", icon: Dog},
        {label: "About", path: "/about", icon: LogoMoIcon},
        {label: "My Account", path: "/account", icon: Turntable, requiresAuth: true,},
        {label: "My Activity", path: "/mypage", icon: MusicLibrary, requiresAuth: true,},
        {label: "Login", path: "/login", icon: LogIn, requiresGuest: true, hideOnLg: true},
        {label: "LogOut", icon: LogOut, requiresAuth: true, action: logout, hideOnLg: true},
    ];

    const visibleNav = navItems.filter(item => {
        if (item.requiresAuth && !user) return false;
        if (item.requiresGuest && user) return false;
        return true;
    });

    const navBaseClasses = "flex items-center gap-x-2 w-full px-3 py-3 rounded-full text-sm lg:text-base transition-all duration-300";
    const navActiveClasses = "bg-primary/6 text-primary font-semibold";
    const navInactiveClasses = "hover:text-primary hover:bg-primary/6";
    const getNavItemClass = (isActive) =>
        clsx(
            navBaseClasses,
            isActive ? navActiveClasses : navInactiveClasses,
            !isMobile && collapsed && "lg:w-[48px]",
        );
    const navIconClasses = "shrink-0 size-5 lg:size-6 transition-colors";

    const profileImage = () => {
        if (user.photoURL) {
            return user.photoURL;
        }
        if (user.displayName) {
            return nicknameUrl;
        }
        return avatarUrl;
    };

    useEffect(() => {
        window.HSStaticMethods?.autoInit?.()
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const resetStyles = () => {
            document.getElementById('navbar').removeAttribute('style');
        };

        const mql = window.matchMedia('(max-width: 1024px)');
        const handleChange = (e) => setIsMobile(e.matches);

        setIsMobile(mql.matches);

        if (mql.matches) resetStyles();
        const onMatchChange = e => e.matches && resetStyles();

        if (mql.addEventListener) {
            mql.addEventListener("change", handleChange);
            mql.addEventListener('change', onMatchChange);
        } else {
            mql.addListener(handleChange);
            mql.addListener(onMatchChange);
        }

        document.addEventListener('hidden.hs.collapse', resetStyles);

        return () => {
            if (mql.removeEventListener) {
                mql.removeEventListener("change", handleChange);
                mql.removeEventListener('change', onMatchChange);
            } else {
                mql.removeListener(handleChange);
                mql.removeListener(onMatchChange);
            }
            document.removeEventListener('hidden.hs.collapse', resetStyles);
        };
    }, []);

    const enableTooltip = collapsed && !isMobile;

    return (
        <div>
            <nav id="navbar"
                 className="group hs-dropdown"
                 aria-label="Main"
            >
                <div className="flex items-center lg:mb-14 lg:pt-3">
                    <h1 className="grow text-left">
                        <Link to="/"
                              className="inline-flex justify-start p-0.5 lg:p-2 text-primary max-lg:h-4 max-lg:pl-2"
                              aria-label="NEWTRONOME">
                            {collapsed ? <LogoMoIcon className="w-8"/> : <LogoIcon className="w-full"/>}
                        </Link>
                    </h1>
                    {/* Collapse Button */}
                    <button id="hs-dropdown-default" type="button"
                            className="hs-dropdown-toggle block lg:hidden p-1 text-base"
                            aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown"
                    >
                        <Menu className="group-[.open]:hidden size-5"/>
                        <X className="hidden group-[.open]:block shrink-0 size-5"/>
                        <span className="sr-only">전체메뉴 토글</span>
                    </button>
                    {/* End Collapse Button */}
                </div>

                {/* Collapse */}
                <div className={clsx(
                    "hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 max-lg:opacity-0 z-50 lg:!transform-none",
                    "hidden lg:block lg:basis-full lg:grow w-full transition-all duration-300",
                    "max-lg:px-3 max-lg:mt-2"
                )}>
                    <div
                        className="relative max-lg:bg-background rounded-xl max-lg:p-3 max-lg:shadow-md">
                        <ul className="space-y-1">
                            {visibleNav.map(({label, path, icon: Icon, action, hideOnLg}) => (
                                <li key={label}
                                    className={clsx("mb-2", hideOnLg && "lg:hidden")}
                                >
                                    {path ? (
                                        <Tooltip content={label} position="right" enabled={enableTooltip}>
                                        <NavLink
                                            to={path}
                                            className={({isActive}) => getNavItemClass(isActive)}
                                        >
                                            <Icon className={navIconClasses}/>
                                            <span className={clsx(
                                                "transition-all duration-300 ease-in-out whitespace-nowrap",
                                                collapsed
                                                    ? "lg:animate-fade-slide-out"
                                                    : "lg:animate-fade-slide-in"
                                            )}>
                                                {label}
                                            </span>
                                        </NavLink>
                                        </Tooltip>
                                    ) : (
                                        <button type="button" className={clsx(
                                            "w-full",
                                            getNavItemClass(false)
                                        )} onClick={action}>
                                            <Icon className={navIconClasses}/>
                                            <span>{label}</span>
                                        </button>
                                    )}
                                </li>
                            ))}
                            <li key="dark-mode-toggle" className="lg:hidden mb-2">
                                <DarkModeToggle tooltipEnabled={false} showText={true}
                                                className="w-full !justify-start text-sm"/>
                            </li>
                        </ul>

                        {user && (
                            <div
                                className="flex lg:hidden items-center gap-3 mt-3 pt-5 pb-3 px-3 border-t border-t-textThr">
                                <div className="shrink-0 w-20 h-20 rounded-full bg-textSub">
                                    <img src={profileImage()} alt={user.displayName || user.email}
                                         className="rounded-full object-cover w-full h-full"/>
                                </div>
                                <div>
                                    {user.displayName && (
                                        <strong className="block mb-px text-sm">{user?.displayName}</strong>)}
                                    <p className="mb-3 text-xs text-textSub">{user?.email}</p>
                                    <Link to="/account"
                                          className="inline-block px-3 py-1.5 text-xs bg-primary rounded-md">Edit
                                        Profile</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* End Collapse */}
            </nav>
            <div className="flex lg:hidden gap-1 items-center absolute top-0 right-11 h-full">
                {user && <NotificationDropdown />}
                <Link to="/search" className="flex items-center h-full p-1">
                    <Search className="shrink-0 size-5 text-base"/><span
                    className="sr-only">검색</span>
                </Link>
            </div>
        </div>
    );
}