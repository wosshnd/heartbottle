console.log('Supabase URL:', process.env.SUPABASE_URL ? '存在' : '缺失');
console.log('Supabase Key:', process.env.SUPABASE_KEY ? '存在' : '缺失');
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
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, content, mood, user_id, id, likes, drawing ,bottle_id} = req.body;

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
    } else if (action === 'add_comment') {
      // 添加评论：插入 comments 表
      if (!bottle_id || !content) {
        return res.status(400).json({ error: 'bottle_id and content are required for add_comment action' });
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          bottle_id: bottle_id,
          content: content
        }])
        .select();

      if (error) throw error;
      result = { success: true,  data[0] };

    } else if (action === 'get_comments') {
      // 获取评论：按时间正序返回该瓶子的所有评论
      if (!bottle_id) {
        return res.status(400).json({ error: 'bottle_id is required for get_comments action' });
      }

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('bottle_id', bottle_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      result = { success: true,  data || [] };
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
