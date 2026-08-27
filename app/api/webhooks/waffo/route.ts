/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Waffo Pancake Webhook 入口:
 * - 必须读取原始文本做 RSA-SHA256 验签(SDK verifyWebhook)
 * - 通过守卫后按事件类型同步 user.plan(metadata.userId/planId 由结账时写入并原样回传)
 */

import { eq } from "drizzle-orm";
import { verifyWebhook } from "@waffo/pancake-ts";
import { db } from "@/lib/db";
import { user, USER_PLANS } from "@/lib/db/schema";
import {
  getWaffoStoreId,
  getWaffoExpectedMode,
  isPaidPlan,
  type PaidPlanId,
} from "@/lib/payments/waffo";

// 订阅进入有效计费态的事件:升级购买者到对应付费档
const UPGRADE_EVENT_TYPES = new Set([
  "subscription.activated",
  "subscription.payment_succeeded",
]);

/** 解析订单上携带的自定义元数据(结账时注入的 {userId, planId}) */
function readOrderMetadata(eventData: unknown): Record<string, unknown> {
  const metadata =
    (eventData as { orderMetadata?: Record<string, unknown> | null })
      ?.orderMetadata ?? {};
  return metadata;
}

async function activatePaidPlan(userId: string, planId: PaidPlanId) {
  // team.id 复用创建者 userId 的架构不影响此处:套餐挂在 user 行上,直写即可
  await db.update(user).set({ plan: planId }).where(eq(user.id, userId));
}

async function downgradeToFreeIfUnchanged(
  userId: string,
  canceledPlanId: string
) {
  // 只在当前套餐仍等于被取消档位时降级,避免旧取消事件误伤后续的新升级
  const rows = await db
    .select({ currentPlan: user.plan })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (rows[0]?.currentPlan !== canceledPlanId) {
    console.warn(
      `[waffo-webhook] 取消事件与当前套餐不一致,跳过降级 user=${userId} canceled=${canceledPlanId}`
    );
    return;
  }
  await db
    .update(user)
    .set({ plan: USER_PLANS.FREE })
    .where(eq(user.id, userId));
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let event;
  try {
    event = verifyWebhook(rawBody, request.headers.get("x-waffo-signature"));
  } catch (error) {
    console.error("[waffo-webhook] 验签失败,已拒绝", error);
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  // 环境/店铺守卫:其他环境(test↔prod)或其他店铺的事件与本部署无关,忽略但确认收到
  if (
    event.mode !== getWaffoExpectedMode() ||
    event.storeId !== getWaffoStoreId()
  ) {
    console.warn(
      `[waffo-webhook] 忽略非本部署事件 id=${event.id} eventType=${event.eventType} mode=${event.mode} store=${event.storeId}`
    );
    return Response.json({ received: true });
  }

  const metadata = readOrderMetadata(event.data);
  const userId = typeof metadata.userId === "string" ? metadata.userId : "";
  const planId = typeof metadata.planId === "string" ? metadata.planId : "";

  if (UPGRADE_EVENT_TYPES.has(event.eventType)) {
    // 数据边界校验:元数据缺失或档位非法时只记警告,仍返回 200 避免无意义重试风暴
    if (!userId || !isPaidPlan(planId)) {
      console.warn(
        `[waffo-webhook] 升级事件元数据非法,id=${event.id} userId=${userId || "<空>"} planId=${planId || "<空>"}`
      );
      return Response.json({ received: true });
    }
    await activatePaidPlan(userId, planId);
    console.log(
      `[waffo-webhook] 已开通付费套餐 user=${userId} plan=${planId} eventId=${event.id}`
    );
  } else if (event.eventType === "subscription.canceled") {
    if (!userId || !isPaidPlan(planId)) {
      console.warn(
        `[waffo-webhook] 取消事件元数据非法,id=${event.id} userId=${userId || "<空>"} planId=${planId || "<空>"}`
      );
      return Response.json({ received: true });
    }
    // canceling 事件被有意忽略(周期末前可恢复),仅在真正 canceled 时降级
    await downgradeToFreeIfUnchanged(userId, planId);
    console.log(
      `[waffo-webhook] 已处理订阅取消 user=${userId} plan=${planId} eventId=${event.id}`
    );
  } else {
    // past_due/refund.* 等:当前迭代不自动变更套餐,仅留痕便于排查
    console.log(
      `[waffo-webhook] 未处理事件仅记录 id=${event.id} eventType=${event.eventType}`
    );
  }

  return Response.json({ received: true });
}
