import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
  {
    variants: {
      variant: {
        default:
          'border border-transparent bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-[var(--btn-primary-shadow)] hover:opacity-90',
        destructive:
          'border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70',
        outline:
          'border border-[color:var(--btn-outline-border)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-fg)] hover:bg-[color:var(--panel-hover)]/30 hover:text-[var(--shell-foreground)]',
        secondary:
          'border border-[color:var(--panel-border)] bg-[var(--panel-surface)] text-[var(--shell-foreground)] hover:bg-[var(--panel-hover)]/20',
        ghost:
          'text-[var(--shell-foreground)] hover:bg-[var(--panel-hover)]/30 hover:text-[var(--shell-foreground)]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 px-4 has-[>svg]:px-3.5 text-xs',
        lg: 'h-12 px-6 has-[>svg]:px-5 text-base',
        icon: 'size-10 rounded-full',
        'icon-sm': 'size-9 rounded-full',
        'icon-lg': 'size-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
