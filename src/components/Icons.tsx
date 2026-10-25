const paths = {
  stethoscope:
    "M6 2h2v2H7v5a3 3 0 0 0 6 0V4h-1V2h2a1 1 0 0 1 1 1v6a5 5 0 0 1-4 4.9V16a3 3 0 0 0 6 0v-1.2a3 3 0 1 1 2 0V16a5 5 0 0 1-10 0v-2.1A5 5 0 0 1 5 9V3a1 1 0 0 1 1-1Zm13 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  child: "M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-4 8h8l-1 6h-1v6h-2v-4h-1v4H9v-6H8Z",
  sparkle: "M12 2l2.2 6.3L20 10l-5.8 1.7L12 18l-2.2-6.3L4 10l5.8-1.7Zm7 12 1 2.6 2.6 1-2.6 1L19 21l-1-2.4-2.6-1 2.6-1Z",
  tooth: "M7 2c2 0 3 1 5 1s3-1 5-1c3 0 4 3 4 5 0 3-1 4-1.5 7S18 22 16.5 22 15 19 14.5 17 13 14 12 14s-2 1-2.5 3-1 5-2.5 5S5 17 4.5 14 3 10 3 7c0-2 1-5 4-5Z",
  heart: "M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z",
  shield: "M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5Zm-1 13-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4Z",
  check: "M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7Z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm.5-13H11v6l5.2 3.1.8-1.2-4.5-2.7Z",
  pin: "M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
  call: "M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1Z",
  arrow: "M13.2 5.3 19.9 12l-6.7 6.7-1.4-1.4 4.3-4.3H4v-2h12.1l-4.3-4.3Z",
  calendar: "M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2Zm12 7v10H5V9Z",
  whatsapp:
    "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z",
  menu: "M3 6h18v2H3Zm0 5h18v2H3Zm0 5h18v2H3Z",
  close: "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4Z",
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2Zm0-8h-2V7h2Z",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={paths[name]} />
    </svg>
  );
}

/** Clinic logo: a soft green cross in a rounded square. */
export function ClinicMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <rect width="40" height="40" rx="11" className="fill-brand" />
      <rect x="16.5" y="9" width="7" height="22" rx="3" className="fill-on-brand" />
      <rect x="9" y="16.5" width="22" height="7" rx="3" className="fill-on-brand" />
      <circle cx="30" cy="10" r="3" className="fill-mark-dot" />
    </svg>
  );
}
