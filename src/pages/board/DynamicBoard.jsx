import { useParams } from "react-router-dom";
import BoardPage from "./BoardPage.jsx";

export default function DynamicBoard () {
    const { boardType } = useParams();
    return <BoardPage boardType={boardType} />;
}