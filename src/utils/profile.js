/**
 * 프로필 변경값 유효성 검사
 * @param {{ nickname: string; photoURL: string; currentPassword?: string; password?: string; confirmPassword?: string; }} vals
 * @return {{ isValid: boolean; errors: {
 *     nickname?: string;  photoURL?: string;
 *     currentPassword?: string; password?: string; confirmPassword?: string
 *   }
 * }}
 */
export function validateProfile(vals) {
    const errors = {};

    // 닉네임: 필수, 최대 20자
    if (!vals.nickname?.trim()) {
        errors.nickname = "닉네임을 입력해주세요.";
    } else if (vals.nickname.length > 8) {
        errors.nickname = "닉네임은 최대 8자까지 가능합니다.";
    }

    // 사진 URL: 빈 문자열 허용, 입력 시에는 http(s) URL 형식 체크
    if (vals.photoURL) {
        // 아주 간단한 URL 체크 정규식
        const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
        if (!urlPattern.test(vals.photoURL)) {
            errors.photoURL = "유효한 이미지 URL을 입력해주세요.";
        }
    }

    // 새 비밀번호를 입력했다면, 현재 비밀번호도 필수 및 확인
    if (vals.password) {
        // 1) 현재 비밀번호
        if (!vals.currentPassword) {
            errors.currentPassword = "현재 비밀번호를 입력해주세요.";
        }

        // 2) 새 비밀번호 길이 검사
        if (vals.password.length < 6) {
            errors.password = "비밀번호는 최소 6자 이상이어야 합니다.";
        }

        // 3) 비밀번호 확인 일치 검사
        if (!vals.confirmPassword) {
            errors.confirmPassword = "비밀번호 확인을 입력해주세요.";
        } else if (vals.confirmPassword !== vals.password) {
            errors.confirmPassword = "비밀번호가 일치하지 않습니다.";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * 원본 프로필(original)과 편집값(current)을 비교해
 * 실제로 수정된 필드가 있는지 확인
 * @param {{ nickname?: string; photoURL?: string }} original
 * @param {{ nickname?: string; photoURL?: string; currentPassword?: string; password?: string; confirmPassword?: string }} current
 * @return {boolean} 하나라도 다르면 true
 */
export function isProfileModified(original, current) {
    return (
        original.nickname !== current.nickname ||
        original.photoURL  !== current.photoURL ||
        Boolean(current.password)
    );
}