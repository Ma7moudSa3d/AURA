import { redirect } from "next/navigation";

// One account page: /account holds the profile form, order history and sign out.
export default function ProfilePage() {
  redirect("/account");
}
