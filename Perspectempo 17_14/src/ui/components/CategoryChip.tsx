import { Category } from '../../domain/types';

interface Props {
  category: Category;
  active?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ category, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition
        ${active
          ? 'ring-2 ring-offset-2 ring-offset-ink-900'
          : 'hover:scale-[1.02]'
        }
      `}
      style={{
        background: active ? category.color : `${category.color}22`,
        color: active ? '#0b0d12' : category.color,
        // @ts-expect-error CSS var via inline
        '--tw-ring-color': category.color,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: active ? '#0b0d12' : category.color }}
      />
      <span className="font-medium">{category.name}</span>
    </button>
  );
}
