import { TeachersProvider } from "@/contexts/TeachersContext";

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return <TeachersProvider>{children}</TeachersProvider>;
}
