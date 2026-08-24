"use client";

import React from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

/**
 * TeamSetupMiddleware - Google 登录后设置团队归属的客户端组件
 *
 * 工作流程:
 * 1. 用户在注册页输入团队名,存入 sessionStorage.pendingCompanyName
 * 2. 用户点击 Google 登录,完成认证
 * 3. 登录成功后,此组件检查 pendingCompanyName
 * 4. 如果存在,调用 /api/auth/team-setup 设置团队归属
 * 5. 成功后清除 pendingCompanyName,刷新页面
 */
export function TeamSetupMiddleware() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [hasSetup, setHasSetup] = React.useState(false);

  React.useEffect(() => {
    // 只在用户已登录且未设置过的情况下执行
    if (isPending || !session?.user?.id || hasSetup) {
      return;
    }

    const pendingCompanyName = sessionStorage.getItem("pendingCompanyName");
    if (!pendingCompanyName) {
      return;
    }

    // 检查用户是否已有团队归属
    const setupTeam = async () => {
      try {
        const response = await fetch("/api/auth/team-setup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamName: pendingCompanyName,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // 成功:清除 pendingCompanyName 并刷新页面
          sessionStorage.removeItem("pendingCompanyName");
          setHasSetup(true);
          router.refresh();
        } else {
          // 失败:显示错误但保留 pendingCompanyName,让用户可以重试
          setError(data.error || "团队归属设置失败");
        }
      } catch {
        setError("网络错误,请稍后重试");
      }
    };

    setupTeam();
  }, [session, isPending, hasSetup, router]);

  // 如果有错误,显示一个重试界面
  if (error && !hasSetup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background p-6 rounded-lg shadow-lg max-w-md">
          <h3 className="text-lg font-semibold mb-2">团队归属设置失败</h3>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            您输入的团队名称: {sessionStorage.getItem("pendingCompanyName")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setError(null);
                const pendingCompanyName = sessionStorage.getItem("pendingCompanyName");
                if (pendingCompanyName) {
                  try {
                    const response = await fetch("/api/auth/team-setup", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ teamName: pendingCompanyName }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                      sessionStorage.removeItem("pendingCompanyName");
                      setHasSetup(true);
                      router.refresh();
                    } else {
                      setError(data.error || "重试失败");
                    }
                  } catch {
                    setError("网络错误,请稍后重试");
                  }
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              重试
            </button>
            <button
              onClick={() => {
                // 跳过:清除 pendingCompanyName,不再设置团队
                sessionStorage.removeItem("pendingCompanyName");
                setHasSetup(true);
                setError(null);
                router.refresh();
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
            >
              跳过
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
