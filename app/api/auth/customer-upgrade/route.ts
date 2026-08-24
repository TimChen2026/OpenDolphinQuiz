/**
 * 客户升级端点 - 客户(Guest)升级为正式用户(Free 用户)
 *
 * 场景:
 * - 客户通过问卷注册后成为 Guest(accountType=customer),仅可访问问卷
 * - 客户升级为正式用户时,必须输入团队/公司名称
 * - 服务端将 accountType 改为 member 并调用 joinTeamByName 加入/创建团队
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { joinTeamByName } from "@/lib/teams";

export async function POST(request: Request) {
  try {
    // 1. 获取当前会话
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

    // 2. 校验当前用户是客户(accountType=customer)
    const users = await db
      .select({ accountType: schema.user.accountType })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    const currentAccountType = users[0]?.accountType;
    if (currentAccountType !== schema.ACCOUNT_TYPES.CUSTOMER) {
      return NextResponse.json(
        { error: "仅客户账号可升级为正式用户" },
        { status: 400 }
      );
    }

    // 3. 解析团队名称(必填)
    const body = await request.json();
    const { teamName } = body as { teamName?: string };
    if (!teamName || !teamName.trim()) {
      return NextResponse.json(
        { error: "团队/公司名称不能为空" },
        { status: 400 }
      );
    }

    // 4. 升级:accountType 改为 member,清理客户归属后加入/创建团队
    //    事务保证账号类型与团队归属原子更新
    await db.transaction(async (tx) => {
      await tx
        .update(schema.user)
        .set({ accountType: schema.ACCOUNT_TYPES.MEMBER })
        .where(eq(schema.user.id, userId));
      // 清理客户角色的团队归属,确保 resolveUserTeamId 解析到新团队
      await tx
        .delete(schema.teamMember)
        .where(
          and(
            eq(schema.teamMember.userId, userId),
            eq(schema.teamMember.role, schema.TEAM_MEMBER_ROLES.CUSTOMER)
          )
        );
      await joinTeamByName(userId, teamName);
    });

    return NextResponse.json({
      success: true,
      message: "升级成功,您现在已是正式用户",
    });
  } catch (error) {
    console.error("customer-upgrade 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "升级失败,请重试" },
      { status: 500 }
    );
  }
}
