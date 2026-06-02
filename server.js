/**
 * 智慧农业 AI 智能诊断系统 - 后端商用核心模块
 * 文件名: server.js
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
// Render 等云平台会自动分配端口，如果没有则默认使用 3000
const PORT = process.env.PORT || 3000;

// 1. 核心中间件配置
app.use(cors()); // 允许前端跨域请求
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 开放图片公开访问 URL

// 2. 确保本地存在用于存放农户上传照片的 uploads 文件夹
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. 配置物理磁盘存储引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 使用时间戳+随机数命名，防止同名图片覆盖
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 限制单张图片最大 5MB
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// 4. 模拟动态数据库历史记录
let mockDatabase = [
    {
        id: "1001",
        crop: "玉米",
        disease: "玉米大斑病",
        time: "2026-06-02 11:15",
        status: "中度病害",
        imageUrl: "https://images.unsplash.com/photo-1551009175-15bdf9dcb580?auto=format&fit=crop&w=150&q=80"
    },
    {
        id: "1002",
        crop: "苹果",
        disease: "正常健康叶片",
        time: "2026-06-01 09:15",
        status: "健康",
        imageUrl: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=150&q=80"
    }
];

/**
 * 接口 [GET] /api/records -> 供前端拉取历史诊断报告流
 */
app.get('/api/records', (req, res) => {
    res.json({ success: true, data: mockDatabase });
});

/**
 * 接口 [POST] /api/diagnose -> 接收图片并返回 AI 特征向量
 */
app.post('/api/diagnose', upload.single('crop_image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '未收到上传的图片文件' });
        }

        // 自动识别当前环境并拼接图片公网访问 URL
        const host = req.get('host');
        const protocol = req.protocol;
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        // 模拟 AI 模型前向传播计算与诊断
        setTimeout(() => {
            const aiResult = {
                id: Date.now().toString(),
                crop: "小麦",
                disease: "小麦条锈病 (Puccinia striiformis)",
                confidence: "97.5%",
                imageUrl: imageUrl,
                time: new Date().toLocaleString('zh-CN', { hour12: false }),
                status: "高危病害",
                features: {
                    titles: ["孢子颜色", "斑块面积", "病斑轮廓", "脉络浸润", "边缘坏死", "组织凹陷"],
                    values: [95, 88, 92, 75, 86, 62] // 六边形雷达图特征值
                },
                advice: [
                    "【化学药剂】: 见病后立即用药。每亩用 20% 三唑酮乳油 50-70 毫升，兑水 50 公斤均匀喷雾。",
                    "【农业治理】: 发病严重田块应合理追施速效氮肥，或喷施磷酸二氢钾，增强植株抗病力。",
                    "【跟进提醒】: 重病区隔 7-10 天需再次喷药防治，注意叶片正反面均要喷到。"
                ]
            };

            // 追加进临时数据库
            mockDatabase.unshift({
                id: aiResult.id,
                crop: aiResult.crop,
                disease: aiResult.disease.split(' ')[0],
                time: aiResult.time,
                status: aiResult.status,
                imageUrl: aiResult.imageUrl
            });

            res.json({ success: true, data: aiResult });
        }, 1500);

    } catch (error) {
        res.status(500).json({ success: false, message: "服务器内部异常" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 后端已成功运行！监听端口: ${PORT}`);
});
