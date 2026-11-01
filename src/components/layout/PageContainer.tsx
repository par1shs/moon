import React from 'react'
import type { PageContainerProps } from '../../types'

const variantClasses = {
  default: 'max-w-7xl',
  fluid: 'max-w-full',
  narrow: 'max-w-4xl',
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  variant = 'default',
  className = '',
  as: Component = 'div',
}) => {
  return (
    <Component
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Component>
  )
}
