import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-textBase">
            <h1 className="text-6xl font-extrabold mb-4">404</h1>
            <p className="text-xl mb-6">죄송합니다. 요청하신 페이지를 찾을 수 없습니다.</p>
            <Link
                to="/"
                className="px-5 py-3 bg-primary text-white rounded-2xl hover:text-primary hover:bg-primary/6 transition"
            >
                홈으로 돌아가기
            </Link>
        </div>
    );
}