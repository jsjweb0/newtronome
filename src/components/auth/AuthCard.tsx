import type { ReactNode } from 'react';
import LogoIcon from '../icons/Logo';

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const authSubmitClasses =
  'w-full min-h-13 inline-flex items-center justify-center rounded-xl bg-primary text-base font-extrabold text-onPrimary hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:bg-textThr disabled:text-textSub';

export default function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <section aria-labelledby="auth-title" className="flex justify-center px-1 pt-5 pb-6 md:px-7 md:pt-12 md:pb-8">
      <div className="w-full max-w-110 flex flex-col gap-6 px-5 pt-7 pb-6 md:px-9 md:pt-10 md:pb-9 rounded-[18px] md:rounded-[20px] border border-line bg-surface">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <LogoIcon aria-hidden="true" className="h-4.5 w-auto text-primary" />
          <h1 id="auth-title" className="text-[26px] font-extrabold text-textBase">{title}</h1>
          <p className="text-sm text-textSub break-keep">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
