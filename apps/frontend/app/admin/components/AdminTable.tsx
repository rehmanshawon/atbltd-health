import type { HTMLAttributes, ReactNode } from "react";

interface AdminTableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  minWidth?: number;
}

export default function AdminTable({
  children,
  className = "",
  minWidth = 760,
  style,
  ...props
}: AdminTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full ${className}`}
        style={{ minWidth, ...style }}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}
