import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { JSX } from 'react';

interface SideBarLinkProps {
  active: boolean;
  icon: IconProp;
  onClick?: (e: any) => void;
  title?: string;
  id?: string;
}

export function SideBarLink({
  active,
  icon,
  onClick,
  title = '',
  id = ''
}: SideBarLinkProps): JSX.Element {
  return (
    <div
      className={`flex items-center justify-center p-1 ${active ? 'cursor-pointer bg-[#D49511] rounded-full' : 'cursor-pointer'}`}
      title={title}
      id={id}
      onClick={onClick}
    >
      <FontAwesomeIcon
        className="text-gray-50 h-8 w-auto flex justify-center items-center hover:text-white"
        size="2xl"
        icon={icon}
      />
    </div>
  );
}
