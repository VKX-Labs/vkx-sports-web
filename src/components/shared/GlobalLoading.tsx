import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#090d16]">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );
}
