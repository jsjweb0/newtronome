import {useAuth} from "../../contexts/AuthContext.jsx";
import {Link} from "react-router-dom";
import {Bell, LogOut, LogIn, UserRoundPlus, Settings, Dog} from "lucide-react";
import Tooltip from "../ui/Tooltip.jsx";
import NotificationDropdown from "../ui/NotificationDropdown.jsx";

export default function HeaderButtons({collapsed}) {
    const { user, logout } = useAuth();
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email)}&size=1128&length=1&background=random&color=ffffff&font-size=0.5&bold=true&uppercase=true`;
    const nicNameUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nickname)}&size=1128&length=1&background=random&color=ffffff&font-size=0.38&bold=true&uppercase=true`;

    return user ? (
        <>
            <div className="flex items-center justify-between">
                <NotificationDropdown collapsed={collapsed} />
                <div className="flex items-center gap-x-2">
                    <Link to="/account" className="text-blue-700 text-sm md:text-base" aria-label="account">
                        <img src={user.photoURL ? user.photoURL : user.nickname ? nicNameUrl : avatarUrl} alt={user.photoURL ? user.nickname : user.email} className="size-10 rounded-full object-cover" />
                    </Link>
                    <Tooltip content="로그아웃" position="bottom">
                        <button type="button"
                                onClick={logout}
                                className="relative inline-flex justify-center items-center size-11 rounded-full hover:text-primary hover:bg-primary/6"
                                aria-label="Logout"
                        >
                            <LogOut className="shrink-0 size-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </>
    ) : (
        <>
            <div className="flex items-center gap-x-2">
                <Tooltip content="Sign in" position="bottom">
                    <Link to="/signup"
                          className="inline-flex justify-center items-center size-11 rounded-full hover:text-primary hover:bg-primary/6" aria-label="Sign up">
                        <UserRoundPlus className="size-5" />
                    </Link>
                </Tooltip>
                <Tooltip content="Login" position="bottom">
                    <Link to="/login"
                          className="inline-flex justify-center items-center size-11 rounded-full hover:text-primary hover:bg-primary/6" aria-label="Login">
                        <LogIn className="size-5" />
                    </Link>
                </Tooltip>
            </div>
        </>
    )
}