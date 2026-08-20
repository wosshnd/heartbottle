/* ------------------------------------------------------------------ */
/*  心灵漂流瓶 · AI 辅助系统                                            */
/*  1) getAiSuggestion —— 温暖回复建议（已预留真实 API，默认本地模拟）    */
/*  2) aiModeration   —— 隐性攻击二次审核（软伤害检测的最终裁决）        */
/* ------------------------------------------------------------------ */

/** 在这里填入你的 API Key 与接口地址即可接入真实大模型 */
export const AI_CONFIG = {
  apiKey: "", // ← 例如 "sk-xxxx"，留空则走本地模拟
  apiUrl: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
};

/** 严格约束的系统提示词（含高中生语境） */
export const SYSTEM_PROMPT = `你是一位温暖、共情力强的心理支持伙伴。
原则：倾听大于评价；接纳大于说服；鼓励具体行为而非空洞安慰。
禁忌：严禁说"这没什么大不了"、"你想多了"、"你应该..."。
对象：对方很可能是一名高中生。请以平等、温和的同龄挚友或知心学长学姐的口吻表达，贴近校园生活（考试、排名、同伴关系、家庭期待、青春期的心事），避免说教与空泛大道理。
输出格式：返回 JSON 对象，包含 empathy_response（共情回应）和 gentle_suggestion（温和建议）两个字段。`;

/** 隐性攻击审核提示词 */
const MODERATION_PROMPT = `你是「心灵漂流瓶」同伴互助社区的内容安全审核员（面向高中生群体）。
请判断用户准备发送的回复是否存在「隐性攻击 / 微霸凌」，包括：
1. 否定感受（如"你想太多了""别矫情""没什么大不了"）
2. 贴标签（如"玻璃心""戏精""怪胎"）
3. 比较打击（如"别人都没事，就你事多""这点压力都承受不了？"）
4. 反问嘲讽（如"难道只有你觉得难受？"）
判断标准：是否会让一个情绪低落的高中生感到被否定、被嘲笑或被排挤。
输出格式：返回 JSON 对象 { "risky": boolean, "reason": string }，reason 为一句简短的中文说明。`;

export interface AiSuggestion {
  empathy_response: string;
  gentle_suggestion: string;
}

/**
 * 根据他人的烦恼文本，生成一条温暖回复建议。
 * 真实模式：调用大模型 API；演示模式：本地模拟话术库。
 */
export async function getAiSuggestion(userText: string): Promise<AiSuggestion> {
  if (AI_CONFIG.apiKey) {
    try {
      const res = await fetch(AI_CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `对方的烦恼是：${userText}` },
          ],
          temperature: 0.8,
        }),
      });
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = data.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(raw) as AiSuggestion;
      if (parsed.empathy_response && parsed.gentle_suggestion) return parsed;
    } catch {
      /* API 异常时回退到模拟话术，保证体验不中断 */
    }
  }
  return mockSuggestion(userText);
}

/**
 * AI 二次审核：对命中本地「隐性攻击」规则的文本做最终裁决。
 * 真实模式交给大模型；演示模式下本地规则命中即视为存在软伤害。
 */
export async function aiModeration(text: string): Promise<{ risky: boolean; reason: string }> {
  if (AI_CONFIG.apiKey) {
    try {
      const res = await fetch(AI_CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: MODERATION_PROMPT },
            { role: "user", content: text },
          ],
          temperature: 0.2,
        }),
      });
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "") as {
        risky?: boolean;
        reason?: string;
      };
      if (typeof parsed.risky === "boolean") {
        return { risky: parsed.risky, reason: parsed.reason ?? "" };
      }
    } catch {
      /* 回退到本地裁决 */
    }
  }
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
  return { risky: true, reason: "本地规则检测到可能否定对方感受的表达" };
}

/* ------------------------- 本地模拟话术库 ------------------------- */

interface ThemePair {
  keywords: string[];
  pairs: AiSuggestion[];
}

const THEMES: ThemePair[] = [
  {
    keywords: ["排名", "月考", "模考", "高考", "班主任", "补课", "晚自习", "选科", "倒计时", "重点班", "分数线", "刷题", "作业"],
    pairs: [
      {
        empathy_response: "排名和考试压过来的时候，真的会喘不过气。你现在的焦虑，是压力下的正常反应，不是你的错。",
        gentle_suggestion: "试着不去盯总排名，只看自己这一科比上次多拿了几分——小小的前进，也是前进。",
      },
      {
        empathy_response: "高中这条路又长又挤，你已经很努力地在走了。偶尔想停下来喘口气，完全可以。",
        gentle_suggestion: "今晚给自己留 20 分钟，不做题，听听歌或者出去走一圈，让大脑换个挡再回来。",
      },
    ],
  },
  {
    keywords: ["宿舍", "室友", "同桌", "同学", "孤立", "小团体", "没人理", "被排挤"],
    pairs: [
      {
        empathy_response: "宿舍和同学之间的事，是高中里必修却没人教的一课，卡在其中真的很难受。",
        gentle_suggestion: "不用勉强融入所有人。先照顾好自己的心情，慢慢靠近让你舒服的同学，一两个就够了。",
      },
      {
        empathy_response: "被晾在一边的感觉，像站在热闹外面看里面，这份失落我听到了。",
        gentle_suggestion: "试着主动约一位聊得来的同学一起去吃饭或操场走走，小小的靠近，常常会换来意外的回应。",
      },
    ],
  },
  {
    keywords: ["考试", "考研", "论文", "学习", "挂科", "成绩", "绩点", "备考", "没考好", "考砸"],
    pairs: [
      {
        empathy_response: "备考这条路又长又安静，你一个人走了很久，辛苦是真的，坚持也是真的。",
        gentle_suggestion: "别只盯着结果看，回头数一数自己已经完成的部分——那些都是你实打实走过的路。",
      },
      {
        empathy_response: "越是在乎，才会越紧张。这份焦虑背后，藏着你认真生活的样子。",
        gentle_suggestion: "今晚早点合上书，给大脑放个小假。睡饱的你，会比熬夜的你更有力气。",
      },
    ],
  },
  {
    keywords: ["爸妈", "父母", "家里", "妈妈", "爸爸", "催", "期待", "失望", "唠叨", "管"],
    pairs: [
      {
        empathy_response: "最亲近的人带来的压力，往往最难开口，也最难消化。你的委屈，我听到了。",
        gentle_suggestion: "不用急着回应或反驳，先照顾好自己的情绪。等你准备好了，边界可以一点点温柔地立起来。",
      },
      {
        empathy_response: "被安排、被期待的感觉，像是自己的声音一直没被听见，这确实让人难受。",
        gentle_suggestion: "今天先做一件完全由自己决定的小事吧，哪怕只是选一杯喜欢的饮料，把「我」找回来一点。",
      },
    ],
  },
  {
    keywords: ["不够好", "自卑", "失败", "比不上", "差劲", "一事无成", "没用", "不如", "落后", "很差"],
    pairs: [
      {
        empathy_response: "你正在用很高的标准打量自己，所以才会这么疼。但请相信，看见你闪光的人，比你以为的多。",
        gentle_suggestion: "试着写下今天做成的三件小事，哪怕只是认真上完了一节课——你值得被自己温柔记录。",
      },
      {
        empathy_response: "和自己较劲的日子，连呼吸都是累的。你已经很努力了，真的。",
        gentle_suggestion: "把「我必须做到」换成「我可以试试」，语言的松绑，会让心跟着松一点。",
      },
    ],
  },
  {
    keywords: ["孤独", "一个人", "没人", "朋友", "想家", "寂寞", "热闹", "异乡", "住校"],
    pairs: [
      {
        empathy_response: "人群里的孤独最安静，也最磨人。你愿意把它写下来，本身就是一种勇敢的联结。",
        gentle_suggestion: "心里发空的时候，去操场走走，看看天。世界很大，总有一些温柔在悄悄陪着你。",
      },
      {
        empathy_response: "一个人扛着所有情绪的日子，辛苦了。你不是矫情，是真的需要陪伴。",
        gentle_suggestion: "给自己安排一个小小的「每周仪式」吧，比如周五晚的一部老电影，让日子有个盼头。",
      },
    ],
  },
  {
    keywords: ["失眠", "睡不着", "疲惫", "好累", "崩溃", "压力", "凌晨", "天花板"],
    pairs: [
      {
        empathy_response: "夜里的心事总是格外大声，吵得你睡不好，一定很累吧。",
        gentle_suggestion: "睡前把脑子里转个不停的话写在纸上，告诉它们：「已收到，明天再聊」，然后允许自己休息。",
      },
      {
        empathy_response: "一直紧绷着的弦，会累是应该的——因为它陪了你太久太久了。",
        gentle_suggestion: "现在试着慢慢吸气 4 秒、呼气 6 秒，重复几次，让身体先于大脑放松下来。",
      },
    ],
  },
  {
    keywords: ["分手", "喜欢", "恋爱", "暗恋", "前任", "告白", "失恋", "心动"],
    pairs: [
      {
        empathy_response: "心里空了一块的感觉，真的不好受。想念不是软弱，是认真喜欢过的证据。",
        gentle_suggestion: "难过的时候就让自己难过一会儿，不用急着好起来。情绪像潮水，会涨，也一定会退。",
      },
      {
        empathy_response: "那个人走后，回忆还留在原地，绊住你的脚步，这太正常了。",
        gentle_suggestion: "试着把想说的话写进瓶子或日记里，写完合上，就是今天和这段情绪的一次小小告别。",
      },
    ],
  },
];

const GENERIC: AiSuggestion[] = [
  {
    empathy_response: "谢谢你愿意把心事放进瓶子。这些情绪沉甸甸的，一个人拿着真的不容易。",
    gentle_suggestion: "此刻不用急着解决什么，先抱抱自己。能被说出来的难过，就已经轻了一半。",
  },
  {
    empathy_response: "看到这些文字，能感觉到你最近走得有些辛苦。你的感受很重要，值得被认真对待。",
    gentle_suggestion: "今天试着为自己做一件小小的温柔的事，哪怕只是早点睡。海面会一直在这里陪着你。",
  },
  {
    empathy_response: "瓶子漂到了我手里，你的心事我认真读完了。有这些情绪，不是你的错。",
    gentle_suggestion: "如果愿意，把最重的那部分心情留在瓶子里，让它随海带走。剩下的，我们一点点面对。",
  },
];

function mockSuggestion(text: string): Promise<AiSuggestion> {
  const delay = 700 + Math.random() * 500;
  return new Promise((resolve) => {
    setTimeout(() => {
      const theme = THEMES.find((t) => t.keywords.some((k) => text.includes(k)));
      const pool = theme ? theme.pairs : GENERIC;
      resolve(pool[Math.floor(Math.random() * pool.length)]);
    }, delay);
  });
}
