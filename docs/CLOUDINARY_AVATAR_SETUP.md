# Cloudinary Upload Preset Setup for Avatar Upload

## 问题
头像上传功能需要在 Cloudinary 中创建一个 upload preset。

## 设置步骤

### 1. 登录 Cloudinary Console
1. 访问 https://cloudinary.com/console
2. 使用你的账号登录

### 2. 创建 Upload Preset
1. 点击左侧菜单的 **Settings** (设置图标 ⚙️)
2. 选择 **Upload** 标签页
3. 滚动到 **Upload presets** 部分
4. 点击 **Add upload preset** 按钮

### 3. 配置 Upload Preset

填写以下信息：

**Preset name**: `user_avatars`

**Signing Mode**: 选择 **Unsigned** (无需签名)

**Folder**: 可选，建议设置为 `foodbuddy/avatars`

**Allowed formats**: `jpg, png, gif, webp`

**Transformations** (推荐设置):
- **Width**: 400
- **Height**: 400
- **Crop mode**: `fill` (填充)
- **Quality**: `auto:good`
- **Format**: `auto`

这样会自动将上传的头像：
- ✅ 调整为 400x400 像素
- ✅ 裁剪为正方形
- ✅ 优化文件大小和质量
- ✅ 自动选择最佳格式

### 4. 保存设置
点击 **Save** 按钮保存 upload preset

### 5. 测试上传
1. 回到你的应用 http://localhost:3000/profile
2. 点击 "Choose File" 选择图片
3. 图片会自动上传到 Cloudinary
4. 头像 URL 会自动更新

## 可选：高级设置

### 限制文件大小
在 Upload preset 中设置：
- **Max file size**: 5242880 (5MB)

### 自动删除旧头像
如果用户上传新头像，可以配置删除旧的：
- **Overwrite**: `true`
- **Unique filename**: `false`
- **Use filename**: `true`

### 安全性
- ✅ **Unsigned** mode 适合客户端直接上传
- ✅ 不需要暴露 API secret
- ✅ 可以在 preset 中限制上传权限

## 故障排除

### 错误: "Upload preset not found"
**解决方案**: 
1. 检查 preset name 是否正确拼写为 `user_avatars`
2. 确认 Signing Mode 设置为 **Unsigned**

### 错误: "Upload failed"
**解决方案**:
1. 检查图片大小是否超过 5MB
2. 检查文件格式是否为图片类型
3. 查看浏览器控制台的详细错误信息

### 图片上传慢
**解决方案**:
1. 在 Cloudinary 中启用 auto quality
2. 设置合适的图片尺寸限制（400x400）
3. 使用图片压缩工具预处理

## 替代方案：使用 Cloudinary Upload Widget

如果你想要更好的上传体验，可以使用 Cloudinary 的官方 Upload Widget：

```typescript
// 安装依赖
npm install @cloudinary/react cloudinary-core

// 在组件中使用
import { CloudinaryContext, Image } from 'cloudinary-react';

// 使用 Upload Widget
const openWidget = () => {
  window.cloudinary.openUploadWidget(
    {
      cloudName: 'dcbktxiuw',
      uploadPreset: 'user_avatars',
      sources: ['local', 'camera'],
      cropping: true,
      croppingAspectRatio: 1,
      maxFileSize: 5000000,
    },
    (error, result) => {
      if (!error && result.event === 'success') {
        setAvatarUrl(result.info.secure_url);
      }
    }
  );
};
```

这样可以提供：
- 📸 拍照功能
- ✂️ 图片裁剪
- 🎨 更好的UI界面
- 📊 上传进度显示
