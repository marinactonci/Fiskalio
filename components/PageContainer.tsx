import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto px-4 py-6 md:py-8 min-h-screen",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
