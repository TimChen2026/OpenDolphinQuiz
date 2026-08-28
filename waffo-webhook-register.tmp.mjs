/*
 * 临时脚本:向 Waffo 店铺注册 webhook 端点(付款事件从未送达的根因修复)
 * 注意:webhooks.add 是新建操作;若 Waffo 面板已存在同 URL 端点,
 * 请先在面板删除后重跑本脚本,或改用 webhooks.update。
 *
 * 运行:node --env-file=.env.local waffo-webhook-register.tmp.mjs
 */
import { WaffoPancake } from "@waffo/pancake-ts";

const environment =
  process.env.WAFFO_ENVIRONMENT?.trim() === "prod" ? "prod" : "test";

const client = new WaffoPancake({
  merchantId: process.env.WAFFO_MERCHANT_ID,
  privateKey: process.env.WAFFO_PRIVATE_KEY,
  environment,
});

const result = await client.webhooks.add({
  storeId: process.env.WAFFO_STORE_ID,
  channel: "http",
  url: "https://dolphinquiz.com/api/webhooks/waffo",
  events: [
    "subscription.activated",
    "subscription.payment_succeeded",
    "subscription.canceling",
    "subscription.uncanceled",
    "subscription.updated",
    "subscription.canceled",
    "subscription.past_due",
    "order.completed",
    "refund.succeeded",
    "refund.failed",
  ],
  testMode: environment === "test",
});

console.log("webhook 注册结果:", JSON.stringify(result, null, 2));
