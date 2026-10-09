import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign in" };
export default function Login({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams.next && searchParams.next.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/";
  return <div className="container-x py-16"><AuthForm mode="login" next={next} /></div>;
}
