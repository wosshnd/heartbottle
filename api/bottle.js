const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置 (Vercel 会自动注入)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// 初始化 Supabase 客户端 (使用 service_role 拥有最高权限)
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // ===== CORS 跨域设置（前端部署在 GitHub Pages，后端在 Vercel，域名不同）=====
  const origin = req.headers.origin || '*';
  // 允许 GitHub Pages 及任意来源的请求；带上具体 origin 以兼容 credentials 场景
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 预检结果缓存一天

  // 处理浏览器预检请求（跨域 POST + JSON 会先发 OPTIONS）
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, content, mood, user_id, id, likes, drawing } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    let result;

    if (action === 'throw') {
      // 扔瓶子：插入数据
      if (!content) {
        return res.status(400).json({ error: 'Content is required for throw action' });
      }

      const insertData = {
        content: content,
        mood: mood || 'neutral',
        user_id: user_id || null,
        created_at: new Date().toISOString()
      };
      if (drawing !== undefined && drawing !== null) {
        insertData.drawing = drawing;
      }

      const { data, error } = await supabase
        .from('bottles')
        .insert([insertData])
        .select();

      if (error) throw error;
      result = { success: true, data: data[0] };

    } else if (action === 'fetch') {
      // 捡瓶子：随机查询一条数据
      // 先取 100 条，然后在前端随机选一个，避免全表扫描
      const { data, error } = await supabase
        .from('bottles')
        .select('*')
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        result = { success: true, data: null };
      } else {
        // 在 JS 中随机选取一个
        const randomIndex = Math.floor(Math.random() * data.length);
        result = { success: true, data: data[randomIndex] };
      }

    } else if (action === 'like') {
      // 点赞：更新 likes 字段
      if (!id || likes === undefined) {
        return res.status(400).json({ error: 'id and likes are required for like action' });
      }

      const { data, error } = await supabase
        .from('bottles')
        .update({ likes: likes })
        .eq('id', id)
        .select();

      if (error) throw error;
      result = { success: true, data: data[0] };

    } else if (action === 'release') {
      // 释放：标记 released = true
      if (!id) {
        return res.status(400).json({ error: 'id is required for release action' });
      }

      const { data, error } = await supabase
        .from('bottles')
        .update({ released: true })
        .eq('id', id)
        .select();

      if (error) throw error;
      result = { success: true, data: data[0] };

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
