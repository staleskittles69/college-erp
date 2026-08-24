import { redirect } from "next/navigation";

export default function AtRiskIndexPage() {
  redirect("/admin/at-risk/backlogs");
}
