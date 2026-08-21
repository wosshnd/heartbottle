import type { MoodTag, ReplyStyle, WeeklyStats } from "./types";

/* ------------------------------------------------------------------ */
/*  AI 辅助 · 三种风格的安慰话术（温柔陪伴 / 鼓励支持 / 实用建议）        */
/*  规则：避免说教、指责和过度承诺。                                     */
/*  填入 AI_CONFIG.apiKey 即接入真实大模型，否则使用本地话术库。          */
/* ------------------------------------------------------------------ */

export const AI_CONFIG = {
  apiKey: "", // ← 在这里填入你的 API Key
  apiUrl: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
};

const SYSTEM_PROMPT = `你是一位温暖、共情力强的心理支持伙伴，正在帮助一名学生回复另一个学生写在漂流瓶里的心事。
请按三种风格各写一条 60 字以内的中文回复：
1. gentle（温柔陪伴型）：侧重倾听与陪伴，表达"我在"。
2. encourage（鼓励支持型）：肯定对方已有的努力与力量。
3. practical（实用建议型）：给一个具体、很小、今天就能做的行动。
硬性要求：避免说教、指责和过度承诺；不许说"这没什么大不了"、"你想多了"、"你应该..."、"一定会好起来的"这类空话。
输出格式：返回 JSON 对象 { "gentle": string, "encourage": string, "practical": string }。`;

export type AiReplies = Record<ReplyStyle, string>;

export async function suggestReplies(content: string, mood: MoodTag): Promise<AiReplies> {
  if (AI_CONFIG.apiKey) {
    try {
      const res = await fetch(AI_CONFIG.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_CONFIG.apiKey}` },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `对方的心事（情绪标签：${mood}）：${content}` },
          ],
          temperature: 0.8,
        }),
      });
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "") as Partial<AiReplies>;
      if (parsed.gentle && parsed.encourage && parsed.practical) {
        return { gentle: parsed.gentle, encourage: parsed.encourage, practical: parsed.practical };
      }
    } catch {
      /* 回退本地话术 */
    }
  }
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));
  return mockReplies(content, mood);
}

/* --------------------------- 本地话术库 --------------------------- */

const BANK: Record<MoodTag | "generic", AiReplies[]> = {
  study: [
    {
      gentle: "被作业和排名追着跑的日子，真的会累。你已经很努力了，我听见了。",
      encourage: "能在这么多压力里还坚持把瓶子抛出来，说明你没有放弃自己，这很了不起。",
      practical: "今晚试试只写三件明天最重要的小事，做完一件划掉一件，让心有个落脚点。",
    },
    {
      gentle: "书包装得下课本，却装不下这些心事，辛苦你一个人扛了这么久。",
      encourage: "你比自己以为的更能撑。回头看看，这一学期你已经翻过了好多座小山。",
      practical: "学 25 分钟就站起来接杯温水、望望窗外，小小的暂停不是偷懒，是续航。",
    },
  ],
  exam: [
    {
      gentle: "考试前的心跳那么快，是因为你很在乎。这份在乎，我收到了。",
      encourage: "紧张的反面是在意，在意的人不会差。你已经为它准备了这么久。",
      practical: "睡前把担心写下来放在桌上，告诉自己「明天再处理」，然后慢慢做几次深呼吸。",
    },
    {
      gentle: "倒计时像滴答作响的钟，敲得人心慌。这样的感觉，很多人都有过。",
      encourage: "分数只能量出一张卷子，量不出你熬过的夜和认真的你。",
      practical: "给自己定一个「最小复习清单」：每天只保住最基础的三题，稳住就是胜利。",
    },
  ],
  social: [
    {
      gentle: "人群里的孤单最安静，也最磨人。谢谢你愿意把它说出来。",
      encourage: "不是所有人都要走进你的世界。慢慢靠近让你舒服的人，一两个就够了。",
      practical: "试着明天主动和一个顺路的同学说句话，哪怕只是「一起走吗」，小小的开始就好。",
    },
    {
      gentle: "被晾在一边的感觉不好受，像站在热闹外面看里面。我陪你站一会儿。",
      encourage: "合群不是唯一的正确答案，你的节奏也值得被尊重。",
      practical: "找一个让你放松的小圈子：社团、球场或图书馆的固定座位，让熟悉感慢慢长出来。",
    },
  ],
  family: [
    {
      gentle: "最亲近的人带来的压力，最难开口。你的委屈，在这里可以安心放着。",
      encourage: "在期待和自己的想法之间找平衡，是特别难的事，而你在认真地面对它。",
      practical: "下次想争执时，先在心里数十秒，把「你总是」换成「我希望」，语气会软一点点。",
    },
    {
      gentle: "被安排的感觉，像是自己的声音一直没被听见。这份失落是真的。",
      encourage: "你不需要立刻让所有人理解你，先好好照顾那个努力的自己。",
      practical: "把想对家人说的话先写在纸上，不急着说出口，等一个心平气和的时机。",
    },
  ],
  self: [
    {
      gentle: "你正在用很高的标准打量自己，所以才会这么疼。但看见你闪光的人，比你以为的多。",
      encourage: "会自我怀疑的人，往往是因为想变得更好。这份认真，本身就值得肯定。",
      practical: "今晚写下今天做成的三件小事，哪怕只是按时吃了饭——你值得被自己温柔记录。",
    },
    {
      gentle: "和自己较劲的日子，连呼吸都是累的。先抱抱那个一直努力的自己吧。",
      encourage: "你不需要完美才值得被喜欢。真实的你，已经足够好了。",
      practical: "把「我必须做到」换成「我可以试试」，语言的松绑，会让心跟着松一点。",
    },
  ],
  other: [
    {
      gentle: "谢谢你愿意把心事放进瓶子。这些情绪沉甸甸的，一个人拿着真的不容易。",
      encourage: "能被说出来的难过，就已经轻了一半。你迈出的这一步很勇敢。",
      practical: "今天为自己做一件小小的温柔的事吧，哪怕只是早点睡。海面会一直陪着你。",
    },
    {
      gentle: "瓶子漂到了我手里，你的心事我认真读完了。有这些情绪，不是你的错。",
      encourage: "情绪像潮水，会涨也会退。你已经在水里站了很久，很厉害了。",
      practical: "心里发空的时候，去楼下走走，看看树和云，让风吹一会儿。",
    },
  ],
  generic: [
    {
      gentle: "我在这里听到了你。不用急着好起来，慢慢说，慢慢走。",
      encourage: "愿意把心事说出来，本身就是一种力量。你比想象中勇敢。",
      practical: "此刻试试吸气 4 秒、呼气 6 秒，重复五次，让身体先松下来。",
    },
  ],
};

function mockReplies(content: string, mood: MoodTag): AiReplies {
  const pool = BANK[mood] ?? BANK.generic;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  void content;
  return pick;
}

/* --------------------------- 每周心灵周报 --------------------------- */

const QUOTES: Record<string, string[]> = {
  exam: ["这周你把焦虑写进了瓶子，也把勇气留给了自己。下一周，慢慢来。", "紧张说明你在乎，在乎的人运气不会太差。"],
  study: ["压力没有把你压垮，反而让你学会了倾诉。这就是成长的声音。", "你已经走了很远的路，别忘了回头看看身后的脚印。"],
  social: ["你在学习一件很难的事——和自己舒服地待在一起，也在慢慢靠近别人。", "不必追赶人群的光，你本来就是自己的灯。"],
  family: ["家的课题最难解，但你没有放弃沟通的可能。这很珍贵。", "先照顾好自己，再去照顾关系。顺序没有错。"],
  self: ["你对自己严格，是因为想变好。但请记得，你也值得被温柔以待。", "怀疑的雾会散，你一直在往前走，这就够了。"],
  other: ["这一周的心事，都被海面好好收着。谢谢你还愿意相信温柔。", "生活有时像退潮，但潮水总会再回来。"],
};

export function weeklyQuote(stats: WeeklyStats): string {
  const entries = Object.entries(stats.moodCounts).filter(([, v]) => (v ?? 0) > 0);
  entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const top = entries[0]?.[0] as keyof typeof QUOTES | undefined;
  const pool = (top && QUOTES[top]) || QUOTES.other;
  const base = pool[Math.floor(Math.random() * pool.length)];
  if (stats.warmLabels > 0) return `${base} 这周你还收获了 ${stats.warmLabels} 枚「温暖回复」，你的温柔正在被看见。`;
  if (stats.replied > 0) return `${base} 这周你送出了 ${stats.replied} 条回复，海会记得每一份善意。`;
  return base;
}
