import cn from "classnames";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  defaultValue?: SelectOption;
  value?: SelectOption;
  onSelect: (s: SelectOption) => void;
}

export function Select({
  value,
  options,
  onSelect,
  defaultValue,
}: SelectProps) {
  const className = cn(
    "border-black-100 text-black-300",
    "hover:border-black hover:text-black-300",
    "active:border-black-100 active:text-black",
    "disabled:bg-black-50 disabled:border-black-100 disabled:text-black",
    "rounded-md shadow-sm",
  );
  return (
    <select
      name="stack"
      className={className}
      value={value?.value}
      defaultValue={defaultValue?.value}
      onChange={(e) => {
        const value = e.currentTarget.value;
        const option = options.find((o) => o.value === value);
        if (!option) return;
        onSelect(option);
      }}
    >
      {options.map((option) => {
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );
}
