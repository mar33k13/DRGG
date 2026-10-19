import { Check, type LucideIcon } from 'lucide-react';

export function ChoiceCard({
  kind = 'radio',
  name,
  value,
  label,
  icon: Icon,
  selected,
  disabled,
  helpId,
  onSelect,
}: {
  kind?: 'radio' | 'button';
  name: string;
  value: string;
  label: string;
  icon: LucideIcon;
  selected: boolean;
  disabled: boolean;
  helpId?: string;
  onSelect: () => void;
}) {
  const face = (
    <>
      <Icon className="choice-symbol" size={19} strokeWidth={1.6} />
      <strong>{label}</strong>
      <Check className="choice-check" size={14} />
    </>
  );
  if (kind === 'button')
    return (
      <button
        type="button"
        className="choice-face"
        aria-pressed={selected}
        aria-describedby={selected ? helpId : undefined}
        disabled={disabled}
        onClick={onSelect}
      >
        {face}
      </button>
    );
  return (
    <label className="choice-option">
      <input
        type="radio"
        name={name}
        value={value}
        aria-label={label}
        aria-describedby={selected ? helpId : undefined}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
      />
      <span className="choice-face">{face}</span>
    </label>
  );
}
