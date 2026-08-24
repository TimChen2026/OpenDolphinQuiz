"use client";

import React from "react";
import { TeamSetupMiddleware } from "./team-setup-middleware";

/**
 * AuthClientWrapper - 客户端认证包装器
 *
 * 功能:
 * 1. 包裹子组件
 * 2. 在用户登录后检查并设置 Google 登录后的团队归属
 */
export function AuthClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TeamSetupMiddleware />
    </>
  );
}
