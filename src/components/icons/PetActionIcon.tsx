interface Props {
  src: string;
  label: string;
}

export default function PetActionIcon({ src, label }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src={src} alt="" width={28} height={28} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
}
