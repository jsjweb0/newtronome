// Firestore Rules와 같이 Unicode 코드 포인트를 기준으로 길이를 센다.
export const countCharacters = (value: string): number => Array.from(value).length;
