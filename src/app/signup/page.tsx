import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account" };
export default function Signup({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams.next && searchParams.next.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/";
  return <div className="container-x py-16"><AuthForm mode="signup" next={next} /></div>;
}
