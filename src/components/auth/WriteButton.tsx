import { BaseButton } from '../ui/BaseButton';
import { useAuth } from '../../contexts/AuthContext';
import { Pencil } from 'lucide-react';
import { getUserRole } from '../../utils/role';

type BoardTypeProps = {
  boardType: 'notice' | 'free';
}

export default function WriteButton({ boardType }: BoardTypeProps) {
  const { user } = useAuth();

  const role = getUserRole(user);

  const canWrite =
    (boardType === 'notice' && role === 'admin') || (boardType === 'free' && role !== 'guest');

  if (!canWrite) return null;

  return (
    <BaseButton as="link" to={`/board/${boardType}/write`} className="px-4.5">
      <Pencil aria-hidden="true" className="shrink-0 size-4" />
      글쓰기
    </BaseButton>
  );
}
