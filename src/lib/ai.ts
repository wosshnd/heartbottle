/* ------------------------------------------------------------------ */
/*  心灵漂流瓶 · AI 辅助回复                                            */
/*  - 已预留真实大模型 API 位置：填入 AI_CONFIG.apiKey 即可启用          */
/*  - 未配置 Key 时使用内置「模拟函数」，返回预设的温暖话术用于演示       */
/* ------------------------------------------------------------------ */

/** 在这里填入你的 API Key 与接口地址即可接入真实大模型 */
export const AI_CONFIG = {
  apiKey: "", // ← 例如 "sk-xxxx"，留空则走本地模拟
  apiUrl: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
};

/** 严格约束的系统提示词 */
export const SYSTEM_PROMPT = `你是一位温暖、共情力强的心理支持伙伴。
原则：倾听大于评价；接纳大于说服；鼓励具体行为而非空洞安慰。
禁忌：严禁说"这没什么大不了"、"你想多了"、"你应该..."。
输出格式：返回 JSON 对象，包含 empathy_response（共情回应）和 gentle_suggestion（温和建议）两个字段。`;

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

/* ------------------------- 本地模拟 ------------------------- */

interface ThemePair {
  keywords: string[];
  pairs: AiSuggestion[];
}

const THEMES: ThemePair[] = [
  {
    keywords: ["加班", "工作", "老板", "上班", "裁员", "绩效", "同事", "职场", "工资", "项目", "方案"],
    pairs: [
      {
        empathy_response: "连轴转的日子真的会让人感到被掏空，你的疲惫是真实而合理的。",
        gentle_suggestion: "今晚试着给自己留 30 分钟「离线时间」，喝杯热的，什么都不处理，让神经慢慢松下来。",
      },
      {
        empathy_response: "把工作扛在肩上的你，已经很努力了。撑不住的时刻，谁都会有。",
        gentle_suggestion: "如果方便的话，把最压心的那件事写下来，你会发现它从「一团雾」变成了「一件事」。",
      },
    ],
  },
  {
    keywords: ["考试", "考研", "论文", "高考", "学习", "挂科", "答辩", "成绩", "绩点", "备考"],
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
    keywords: ["分手", "喜欢", "恋爱", "暗恋", "男朋友", "女朋友", "前任", "告白", "失恋"],
    pairs: [
      {
        empathy_response: "心里空了一块的感觉，真的不好受。想念不是软弱，是认真爱过的证据。",
        gentle_suggestion: "难过的时候就让自己难过一会儿，不用急着好起来。情绪像潮水，会涨，也一定会退。",
      },
      {
        empathy_response: "那个人走后，回忆还留在原地，绊住你的脚步，这太正常了。",
        gentle_suggestion: "试着把想说的话写进瓶子或日记里，写完合上，就是今天和这段情绪的一次小小告别。",
      },
    ],
  },
  {
    keywords: ["父母", "家里", "爸妈", "妈妈", "爸爸", "催婚", "回家", "家人"],
    pairs: [
      {
        empathy_response: "最亲近的人带来的压力，往往最难开口，也最难消化。你的委屈，我听到了。",
        gentle_suggestion: "不用急着回应或反驳，先照顾好自己的情绪。等你准备好了，边界可以一点点温柔地立起来。",
      },
      {
        empathy_response: "被催促、被安排的感觉，像是自己的声音一直没被听见，这确实让人难受。",
        gentle_suggestion: "今天先做一件完全由自己决定的小事吧，哪怕只是选一杯喜欢的饮料，把「我」找回来一点。",
      },
    ],
  },
  {
    keywords: ["不够好", "自卑", "失败", "比不上", "差劲", "一事无成", "没用", "不如", "落后"],
    pairs: [
      {
        empathy_response: "你正在用很高的标准打量自己，所以才会这么疼。但请相信，看见你闪光的人，比你以为的多。",
        gentle_suggestion: "试着写下今天做成的三件小事，哪怕只是好好吃了一顿饭——你值得被自己温柔记录。",
      },
      {
        empathy_response: "和自己较劲的日子，连呼吸都是累的。你已经很努力了，真的。",
        gentle_suggestion: "把「我必须做到」换成「我可以试试」，语言的松绑，会让心跟着松一点。",
      },
    ],
  },
  {
    keywords: ["孤独", "一个人", "没人", "朋友", "想家", "寂寞", "热闹", "异乡", "城市"],
    pairs: [
      {
        empathy_response: "人群里的孤独最安静，也最磨人。你愿意把它写下来，本身就是一种勇敢的联结。",
        gentle_suggestion: "下次心里发空的时候，去楼下走走，看看树和云。世界很大，总有一些温柔在悄悄陪着你。",
      },
      {
        empathy_response: "一个人扛着所有情绪的日子，辛苦了。你不是矫情，是真的需要陪伴。",
        gentle_suggestion: "给自己安排一个小小的「每周仪式」吧，比如周五夜晚的一部老电影，让日子有个盼头。",
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
