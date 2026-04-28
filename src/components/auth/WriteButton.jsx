import {BaseButton} from "../ui/BaseButton.jsx";
import {useAuth} from "../../contexts/useAuth.js";
import {Pencil} from "lucide-react";

export default function WriteButton({boardType}) {
    const {user} = useAuth()

    const role = !user
        ? "guest"
        : user.email === "admin@email.com"
            ? "admin"
            : "user";

    const canWrite =
        (boardType === "notice" && role === "admin") ||
        (boardType === "free" && role !== "guest")

    if (!canWrite) return null;

    return (
        <div className="flex justify-center items-center mt-8">
            <BaseButton
                as="link" to={`/board/${boardType}/write`} className="gap-2" variant="outline">
                <Pencil
                    className="shrink-0 size-4 text-gray-600 group-hover:text-blue-600 dark:text-white/60"/>
                글쓰기
            </BaseButton>
        </div>
    );
}