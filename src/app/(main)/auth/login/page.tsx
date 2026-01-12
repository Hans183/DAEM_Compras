import Link from "next/link";
import Image from "next/image";

import { LoginForm } from "../_components/login-form";
import { GoogleButton } from "../_components/social-auth/google-button";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Image
              src="/images/logo-daem_cuadrado.svg"
              alt="Logo DAEM"
              width={300}
              height={300}
              className="mx-auto brightness-0 invert"
              priority
              unoptimized
            />
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-2">
            <h1 className="font-medium text-center text-5xl text-foreground">Bienvenido</h1>
            <p className="text-center text-muted-foreground text-xl">Ingresa tus credenciales </p>
          </div>
          <div className="space-y-4">
            <LoginForm />
            {/*<GoogleButton className="w-full" variant="outline" />*/}
            {/*<p className="text-center text-muted-foreground text-xs">
              No tienes una cuenta?{" "}
              <Link prefetch={false} href="register" className="text-primary">
                Registrate
              </Link>
            </p>*/}
          </div>
        </div>
      </div>
    </div>
  );
}
