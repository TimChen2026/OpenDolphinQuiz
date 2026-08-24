/**
 * 团队归属端点 - 处理 Google 登录后的团队设置
 *
 * 场景:
 * - 用户在 Google 登录前输入了团队名称
 * - 登录成功后,客户端将 pendingCompanyName 发送到此处
 * - 服务端调用 joinTeamByName 设置团队归属
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { joinTeamByName } from "@/lib/teams";

export async function POST(request: Request) {
  try {
    // 获取当前会话
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录,请先完成登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 解析请求体
    const body = await request.json();
    const { teamName } = body as { teamName: string };

    if (!teamName || !teamName.trim()) {
      return NextResponse.json(
        { error: "团队/公司名称不能为空" },
        { status: 400 }
      );
    }

    // 检查用户是否已有团队归属(防止重复设置)
    const existingMemberships = await db
      .select({ teamId: schema.teamMember.teamId })
      .from(schema.teamMember)
      .where(eq(schema.teamMember.userId, userId))
      .limit(1);

    if (existingMemberships.length > 0) {
      // 已有团队归属,直接返回成功(幂等)
      return NextResponse.json({
        success: true,
        teamId: existingMemberships[0].teamId,
        skipped: true,
        message: "用户已有团队归属",
      });
    }

    // 设置团队归属
    const team = await joinTeamByName(userId, teamName);

    return NextResponse.json({
      success: true,
      teamId: team.id,
      teamName: team.name,
      message: "团队归属设置成功",
    });
  } catch (error) {
    console.error("Team setup error:", error);
    const message = error instanceof Error ? error.message : "设置失败";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
