// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createSign, generateKeyPairSync } from "node:crypto";
import { verifyWebhook } from "@waffo/pancake-ts";

// 自生成密钥对模拟 Waffo 服务端签名,通过 options.publicKey 注入验证
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const publicKeyPem = publicKey
  .export({ type: "spki", format: "pem" })
  .toString();

function signPayload(payload: string, timestamp: number): string {
  const signer = createSign("RSA-SHA256");
  signer.update(`${timestamp}.${payload}`);
  return `t=${timestamp},v1=${signer.sign(privateKey, "base64")}`;
}

function buildPayload(timestamp: number): string {
  return JSON.stringify({
    id: "evt-signature-1",
    timestamp,
    eventType: "subscription.payment_succeeded",
    eventId: "sub-signature-1",
    storeId: "STO_X",
    storeName: "DolphinQuiz",
    mode: "test",
    data: {},
  });
}

describe("Waffo webhook 签名契约(SDK verifyWebhook)", () => {
  it("合法签名通过验证并解析出事件", () => {
    const timestamp = Date.now();
    const payload = buildPayload(timestamp);
    const event = verifyWebhook(payload, signPayload(payload, timestamp), {
      publicKey: publicKeyPem,
    });
    expect(event.eventType).toBe("subscription.payment_succeeded");
  });

  it("payload 被篡改时验签失败", () => {
    const timestamp = Date.now();
    const payload = buildPayload(timestamp);
    const tampered = payload.replace("STO_X", "STO_Y");
    expect(() =>
      verifyWebhook(tampered, signPayload(payload, timestamp), {
        publicKey: publicKeyPem,
      })
    ).toThrow();
  });

  it("缺少签名头时直接拒绝", () => {
    expect(() => verifyWebhook(buildPayload(Date.now()), "")).toThrow();
  });

  it("时间戳超出容差窗口时拒绝(防重放)", () => {
    const staleTimestamp = Date.now() - 5 * 60 * 1000;
    const payload = buildPayload(staleTimestamp);
    expect(() =>
      verifyWebhook(payload, signPayload(payload, staleTimestamp), {
        publicKey: publicKeyPem,
        toleranceMs: 60_000,
      })
    ).toThrow();
  });
});
