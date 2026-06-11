import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  const baseStyles = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base cursor-pointer inline-block text-center";
  
  const variants = {
    primary: "bg-brand-accent text-brand-dark hover:bg-brand-accentHover shadow-lg shadow-green-500/10",
    secondary: "bg-transparent border-2 border-brand-textSecondary text-brand-textPrimary hover:border-brand-textPrimary"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}