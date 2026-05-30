import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/65 border border-border/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton;
