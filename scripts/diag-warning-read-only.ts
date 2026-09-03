// 只读诊断脚本:查询预警相关数据,定位未触发原因(用完即删)
import { db } from "../lib/db";
import { team, projects, warningSettings, emailTemplates } from "../lib/db/schema";

async function main() {
  const teams = await db.select({ id: team.id, name: team.name }).from(team);
  console.log("=== 团队(租户) ===");
  console.log(JSON.stringify(teams, null, 2));

  const settings = await db.select().from(warningSettings);
  console.log("=== 预警设置 ===");
  console.log(JSON.stringify(settings.map((s) => ({ tenantId: s.tenantId, yellowHours: s.yellowHours, redHours: s.redHours })), null, 2));

  const templates = await db
    .select({ tenantId: emailTemplates.tenantId, templateType: emailTemplates.templateType })
    .from(emailTemplates);
  console.log("=== 邮件模板(warning 类型) ===");
  console.log(JSON.stringify(templates.filter((t) => t.templateType.startsWith("warning")), null, 2));

  const rows = await db.select().from(projects);
  // 只看未结束项目(预警只针对进行中的项目)
  const active = rows.filter(
    (p) => p.projectStatus !== "won" && p.projectStatus !== "lost"
  );
  console.log(`=== 未结束项目统计(按租户×是否超3天) ===`);
  const stats: Record<string, number> = {};
  for (const p of active) {
    const key = `${p.tenantId.slice(0, 8)}…|over3Days=${p.over3Days}`;
    stats[key] = (stats[key] ?? 0) + 1;
  }
  console.log(JSON.stringify(stats, null, 2));

  // 72 小时内、仍在跟进的项目(才是预警的候选对象)
  const candidates = active.filter((p) => !p.over3Days);
  console.log(`=== 72小时内未结束项目(预警候选,共 ${candidates.length}) ===`);
  console.log(JSON.stringify(candidates.map((p) => ({
    projectNumber: p.projectNumber,
    tenantId: p.tenantId.slice(0, 8) + "…",
    status: p.projectStatus,
    inquiryDatetime: p.inquiryDatetime,
    hoursSinceInquiry: ((Date.now() - p.inquiryDatetime.getTime()) / 3600000).toFixed(1),
    managerId: p.managerId ? p.managerId.slice(0, 8) + "…" : null,
    warningYellowAt: p.warningYellowAt,
    warningRedAt: p.warningRedAt,
  })), null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error("诊断失败:", e);
  process.exit(1);
});
