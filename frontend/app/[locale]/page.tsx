import { Link } from '@/i18n/routing';
import LoginForm from "@/components/partials/auth/login-form";
import Image from "next/image";
import Copyright from "@/components/partials/auth/copyright";
import Logo from "@/components/partials/auth/logo";
import { auth } from "@/lib/auth";
import { redirect } from "@/components/navigation";
const Login = async ({ params: { locale } }: { params: { locale: string } }) => {
  const session = await auth();
  if (session) {
    redirect({ href: "/sairan/dashboard", locale });
  }
  return (
    <>
      <div className="flex w-full items-center overflow-hidden min-h-dvh h-dvh basis-full">
        <div className="overflow-y-auto flex flex-wrap w-full h-dvh">
          <div
            className="lg:block hidden flex-1 overflow-hidden text-[40px] leading-[48px] text-default-600 
 relative z-1 bg-default-50"
          >
            <div className="max-w-[520px] pt-20 ps-20 ">
              <Link href="/" className="mb-6 inline-block">
                <Logo />
              </Link>
              <h4>
                Strategic AI Readiness
                <span className="text-default-800 font-bold ms-2">
                  Assessment Navigator
                </span>
              </h4>
              <p className="mt-4 text-base text-default-600">
                Evaluate your organization&rsquo;s readiness to adopt AI across People,
                Process, Technology, Ecosystem, and Governance.
              </p>
            </div>
            <div className="absolute left-0 2xl:bottom-[-160px] bottom-[-130px] h-full w-full z-[-1]">
              <Image
                src="/images/auth/ils1.svg"
                alt=""
                priority
                width={300}
                height={300}
                className="mb-10 w-full h-full"
              />
            </div>
          </div>
          <div className="flex-1 relative">
            <div className=" h-full flex flex-col  dark:bg-default-100 bg-white">
              <div className="max-w-[524px] md:px-[42px] md:py-[44px] p-7  mx-auto w-full text-2xl text-default-900  mb-3 h-full flex flex-col justify-center">
                <div className="flex justify-center items-center text-center mb-6 lg:hidden ">
                  <Link href="/">
                    <Logo />
                  </Link>
                </div>
                <div className="text-center 2xl:mb-10 mb-4">
                  <h4 className="font-medium">Sign in to SAIRAN</h4>
                  <div className="text-default-500 text-base">
                    Enter your credentials to access your assessments
                  </div>
                </div>
                <LoginForm />
                <div className="md:max-w-[345px] mx-auto font-normal text-default-500 mt-10 text-xs text-center">
                  Demo: orgadmin@sampleb.com / demo123
                </div>
              </div>
              <div className="text-xs font-normal text-default-500  z-999 pb-10 text-center">
                <Copyright />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
