import { WaffoPancake } from "@waffo/pancake-ts";

/*
 * Waffo Pancake 服务端单例与套餐配置读取。
 * 仅允许在服务端(Node 运行时)使用,私钥严禁泄漏到客户端。
 */

// 订阅结算货币:Waffo 订阅仅支持 USD/EUR/GBP/HKD/JPY,默认面向美元市场
export const WAFFO_CHECKOUT_CURRENCY = "USD" as const;

// 付费档位(免费档不产生任何支付行为)
export type PaidPlanId = "pro" | "max";

const PAID_PLANS: readonly PaidPlanId[] = ["pro", "max"];

export function isPaidPlan(value: string): value is PaidPlanId {
  return (PAID_PLANS as readonly string[]).includes(value);
}

// 计费周期:月度/年度在 Waffo 中是两个独立商品
export type BillingInterval = "monthly" | "yearly";

let cachedClient: WaffoPancake | null = null;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `缺少 Waffo 支付环境变量 ${name},请在 .env.local 中补充配置`
    );
  }
  return value;
}

/**
 * 获取 Waffo Pancake 服务端客户端(进程内单例)
 * 环境变量缺失时立即抛错(fast-fail),避免请求打到半残配置的收银台
 */
export function getWaffoClient(): WaffoPancake {
  if (!cachedClient) {
    cachedClient = new WaffoPancake({
      merchantId: readRequiredEnv("WAFFO_MERCHANT_ID"),
      privateKey: readRequiredEnv("WAFFO_PRIVATE_KEY"),
      environment:
        process.env.WAFFO_ENVIRONMENT?.trim() === "prod" ? "prod" : "test",
    });
  }
  return cachedClient;
}

// Webhook 回调守卫用的本店 ID
export function getWaffoStoreId(): string {
  return readRequiredEnv("WAFFO_STORE_ID");
}

// 本部署对应的回调事件环境(test|prod),与 event.mode 比对防串扰
export function getWaffoExpectedMode(): "test" | "prod" {
  return process.env.WAFFO_ENVIRONMENT?.trim() === "prod" ? "prod" : "test";
}

/**
 * 查询付费档位+计费周期对应的 Waffo 商品 ID(共 4 个商品)
 * 月度:WAFFO_PRODUCT_ID_PRO / WAFFO_PRODUCT_ID_MAX
 * 年度:WAFFO_PRODUCT_ID_PRO_Yearly / WAFFO_PRODUCT_ID_MAX_Yearly
 * 返回 null 表示该商品尚未在 Dashboard 创建并回填(env 中留空),
 * 由调用方对用户呈现"暂不可购买"而不是报错
 */
export function getPlanProductId(
  plan: PaidPlanId,
  interval: BillingInterval
): string | null {
  const planKey = plan === "pro" ? "PRO" : "MAX";
  const intervalSuffix = interval === "yearly" ? "_Yearly" : "";
  return (
    process.env[`WAFFO_PRODUCT_ID_${planKey}${intervalSuffix}`]?.trim() || null
  );
}
