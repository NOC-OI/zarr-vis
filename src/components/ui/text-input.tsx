export function TextInput({
  id,
  label,
  value,
  name,
  onInput,
  placeholder,
  className,
  type = 'text'
}: {
  id: string;
  label?: string;
  value: string;
  name: string;
  onInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`w-full  ${className}`}>
      {label && <label className="block text-white text-sm mb-1">{label}</label>}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onInput={onInput}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-white text-white placeholder-gray-300 focus:outline-none focus:border-yellow-400 transition duration-200"
      />
    </div>
  );
}
