## Stack
- **React 19** (without `forwardRef`)
- **Next.js**
- **Tailwind CSS v4** with `@theme` and CSS variables
- **Tailwind Variants** (`tailwind-variants`) for variants
- **Tailwind Merge** (`tailwind-merge`) for class merging
- **Lucide React** for icons
- **Back-end**: Supabase folder

---

## Code Style
- Add comments only for very complex code (in English)
- Use early return
- Use only ES6 default parameters

---

## Compound Components
```tsx
import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export interface CardProps extends ComponentProps<'div'> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={twMerge('base-classes', className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={twMerge('base-classes', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 className={twMerge('base-classes', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={twMerge('base-classes', className)} {...props} />
}
```

---

## TypeScript
```tsx
// ✅ Extend ComponentProps + VariantProps
export interface ButtonProps 
  extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {}

// ✅ Import type for types
import type { ComponentProps } from 'react'
import type { VariantProps } from 'tailwind-variants'

// ❌ Don't use React.FC or any
```

---

## Important Patterns
```tsx
// Always use twMerge
className={twMerge('base-classes', className)}

// Always use data-slot
<div data-slot="icon">...</div>

// States with data-attributes
data-disabled={disabled ? '' : undefined}
className="data-[disabled]:opacity-50 data-[selected]:bg-primary"

// Focus visible
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Icons with size '[&_svg]:size-3.5' // in variants

// Icon buttons need aria-label

// Props spread at the end
{...props}
```