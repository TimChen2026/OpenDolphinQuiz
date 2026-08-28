/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { z } from "zod";
import {
  WaffoPancakeError,
  type CashierLanguage,
  type WaffoPancake,
} from "@waffo/pancake-ts";
import { auth } from "@/lib/auth";
import {
  getWaffoClient,
  getPlanProductId,
  getPlanProductEnvName,
  WAFFO_CHECKOUT_CURRENCY,
} from "@/lib/payments/waffo";

// 仅支持站点现有语言集合;其余取值在边界层直接拒绝
const checkoutRequestSchema = z.object({
  plan: z.enum(["pro", "max"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  locale: z.enum(["en", "zh"]).default("en"),
});

function buildCheckoutLanguage(locale: "en" | "zh"): CashierLanguage {
  return locale === "zh" ? "zh-Hans" : "en";
}

export async function POST(request: Request) {
  // 数据边界校验:请求体格式不对立即拒绝
  const parsedBody = checkoutRequestSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsedBody.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const { plan, interval, locale } = parsedBody.data;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  // 配置解析前置:环境变量缺失必须与上游支付失败区分开,
  // 否则服务器漏配会被吞成笼统的 checkout_failed,线上无从定位
  let client: WaffoPancake;
  try {
    client = getWaffoClient();
  } catch (error) {
    console.error(
      "[waffo] 支付配置缺失:",
      error instanceof Error ? error.message : error
    );
    return Response.json({ error: "payment_unconfigured" }, { status: 503 });
  }

  // 商品尚未在 Waffo Dashboard 创建回填时温和提示,而不是抛内部错误
  const productId = getPlanProductId(plan, interval);
  if (!productId) {
    console.error(
      `[waffo] 商品 ID 未配置: ${getPlanProductEnvName(plan, interval)}`
    );
    return Response.json({ error: "plan_unavailable" }, { status: 503 });
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  ).replace(/\/+$/, "");
  const successUrl = `${appUrl}/${locale}/dashboard?upgrade=success`;

  try {
    // authenticated 模式:SDK 内部先签发买家会话再创建结账单;
    // metadata 会原样随 Webhook 返回(event.data.orderMetadata),用于回调时定位用户与套餐
    const checkout = await client.checkout.authenticated.create({
      productId,
      currency: WAFFO_CHECKOUT_CURRENCY,
      buyerIdentity: session.user.id,
      buyerEmail: session.user.email ?? undefined,
      successUrl,
      language: buildCheckoutLanguage(locale),
      metadata: { userId: session.user.id, planId: plan },
    });
    return Response.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    // 转换型异常:上游 SDK 错误序列化后返回,原始上下文进 WARN+ 日志
    console.error(
      `[waffo] 结账创建失败 plan=${plan} interval=${interval} user=${session.user.id}`,
      error instanceof WaffoPancakeError
        ? `status=${error.status} errors=${JSON.stringify(error.errors)}`
        : error
    );
    return Response.json(
      { error: "checkout_failed" },
      { status: error instanceof WaffoPancakeError ? 502 : 500 }
    );
  }
}
