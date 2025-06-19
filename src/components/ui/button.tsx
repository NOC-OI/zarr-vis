import clsx from 'clsx';

export function Button({ className, ...props }) {
  return (
    <button
      className={clsx('inline-flex items-center px-4 py-2 rounded-md cursor-pointer', className)}
      {...props}
    />
  );
}
