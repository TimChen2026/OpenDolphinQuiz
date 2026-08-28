// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyWebhook } from "@waffo/pancake-ts";
import { POST } from "@/app/api/webhooks/waffo/route";
import { USER_PLANS } from "@/lib/db/schema";

// db 仅需 update/select 两条链式路径
const dbMocks = vi.hoisted(() => ({
  update: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { update: dbMocks.update, select: dbMocks.select },
}));

vi.mock("@waffo/pancake-ts", () => ({
  verifyWebhook: vi.fn(),
}));

const SIGNATURE_HEADER = "t=1700000000000,v1=test-signature";

function buildEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-test-1",
    timestamp: Date.now(),
    eventType: "subscription.payment_succeeded",
    eventId: "sub-test-1",
    storeId: "STO_TEST",
    storeName: "DolphinQuiz",
    mode: "test",
    data: { orderMetadata: { userId: "user-1", planId: "pro" } },
    ...overrides,
  };
}

function buildRequest(event: unknown): Request {
  return new Request("http://localhost/api/webhooks/waffo", {
    method: "POST",
    headers: { "x-waffo-signature": SIGNATURE_HEADER },
    body: JSON.stringify(event),
  });
}

describe("Waffo webhook 路由", () => {
  let updateSet: ReturnType<typeof vi.fn>;
  let updateWhere: ReturnType<typeof vi.fn>;
  let selectLimit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // update().set().where() 链
    updateWhere = vi.fn().mockResolvedValue(undefined);
    updateSet = vi.fn(() => ({ where: updateWhere }));
    dbMocks.update.mockReturnValue({ set: updateSet });
    // select().from().where().limit() 链,默认当前套餐为 pro
    selectLimit = vi.fn().mockResolvedValue([{ currentPlan: "pro" }]);
    dbMocks.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: selectLimit })),
      })),
    });
    vi.stubEnv("WAFFO_STORE_ID", "STO_TEST");
    vi.stubEnv("WAFFO_ENVIRONMENT", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("验签失败时返回 401 且不改动套餐", async () => {
    vi.mocked(verifyWebhook).mockImplementation(() => {
      throw new Error("Invalid webhook signature");
    });
    const response = await POST(buildRequest(buildEvent()));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid_signature" });
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("payment_succeeded 事件把用户升级到对应付费档", async () => {
    const event = buildEvent();
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    // 边界确认:原始请求体与签名头必须原样交给验签器
    expect(vi.mocked(verifyWebhook)).toHaveBeenCalledWith(
      JSON.stringify(event),
      SIGNATURE_HEADER
    );
    expect(updateSet).toHaveBeenCalledWith({ plan: "pro" });
  });

  it("activated 事件同样触发升级", async () => {
    const event = buildEvent({
      eventType: "subscription.activated",
      data: { orderMetadata: { userId: "user-1", planId: "max" } },
    });
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(updateSet).toHaveBeenCalledWith({ plan: "max" });
  });

  it("元数据缺 userId 时忽略升级并返回 200", async () => {
    const event = buildEvent({ data: { orderMetadata: { planId: "pro" } } });
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("非付费档位时忽略升级", async () => {
    const event = buildEvent({
      data: { orderMetadata: { userId: "user-1", planId: "free" } },
    });
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("非本部署环境/店铺的事件被忽略", async () => {
    const event = buildEvent({ mode: "live" });
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(dbMocks.update).not.toHaveBeenCalled();
    expect(dbMocks.select).not.toHaveBeenCalled();
  });

  it("canceled 且当前套餐一致时降级为免费", async () => {
    const event = buildEvent({ eventType: "subscription.canceled" });
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(updateSet).toHaveBeenCalledWith({ plan: USER_PLANS.FREE });
  });

  it("canceled 但当前套餐已变化时不降级", async () => {
    selectLimit.mockResolvedValue([{ currentPlan: "max" }]);
    const event = buildEvent({ eventType: "subscription.canceled" });
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(updateSet).not.toHaveBeenCalled();
  });

  it("未纳入处理的事件仅确认收到", async () => {
    const event = buildEvent({ eventType: "order.completed" });
    vi.mocked(verifyWebhook).mockReturnValue(event as never);
    const response = await POST(buildRequest(event));
    expect(response.status).toBe(200);
    expect(dbMocks.update).not.toHaveBeenCalled();
  });
});
