/** WhatsApp brand SVG icon — matches lucide style (stroke-based, size prop). */
export default function WhatsAppIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21z" />
      <path d="M9 10a.5.5 0 001 0V9a.5.5 0 00-1 0v1zM14 10a.5.5 0 001 0V9a.5.5 0 00-1 0v1z" />
      <path d="M9.5 13.5c.83 1 2.17 1.5 3 1s1.5-1 1.5-1" />
    </svg>
  );
}
