import { Suspense } from "react";

import AuthForm from "@/components/forms/AuthForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm initialMode="register" />
    </Suspense>
  );
}
